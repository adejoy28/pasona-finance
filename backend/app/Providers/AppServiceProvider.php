<?php

namespace App\Providers;

use App\Models\EmailLog;
use Carbon\Carbon;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Console\Events\CommandStarting;
use Illuminate\Http\Request;
use Illuminate\Mail\Events\MessageSent;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\Mime\Address;
use TijsVerkoyen\CssToInlineStyles\CssToInlineStyles;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Block destructive commands unless explicitly allowed via env.
        // Set DESTRUCTIVE_COMMANDS_ALLOWED=true in .env to run rollbacks,
        // fresh, wipe, etc. against the configured database. This prevents
        // accidental data loss (e.g. an AI agent running migrate:rollback
        // against Supabase when the .env points at production).
        Event::listen(CommandStarting::class, function (CommandStarting $event) {
            $destructive = [
                'migrate:rollback',
                'migrate:fresh',
                'migrate:refresh',
                'db:wipe',
            ];
            if (in_array($event->command, $destructive) && ! env('DESTRUCTIVE_COMMANDS_ALLOWED', false)) {
                throw new \RuntimeException(
                    'Destructive commands are blocked. Set DESTRUCTIVE_COMMANDS_ALLOWED=true in .env to enable.'
                );
            }
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by(
                $request->user()?->id ?: $request->ip()
            );
        });

        // Tighter limit for the email-availability probe on the auth
        // screen. The frontend debounces to 500ms, so a real user fires
        // at most a handful of requests while typing one email — 30/min
        // is plenty for the UX. The cap exists to make scripted email
        // enumeration (OWASP A07:2021) noticeably expensive.
        RateLimiter::for('check-email', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });

        $this->registerMailCssInliner();
        $this->registerMailLogger();
    }

    /**
     * Gmail (and most webmail clients) strip <style> blocks, so any CSS
     * that lives only in the <head> is lost in transit. Pasona's email
     * templates are written with inline styles from the start, but this
     * listener is a safety net: if a future template reintroduces a
     * <style> block, we run it through CssToInlineStyles, copy every
     * rule onto the matching elements as inline style="", and then
     * strip the <style> block itself.
     */
    private function registerMailCssInliner(): void
    {
        Event::listen(MessageSending::class, function (MessageSending $event): void {
            $message = $event->message;

            if (! method_exists($message, 'getHtmlBody') || ! method_exists($message, 'html')) {
                return;
            }

            $html = $message->getHtmlBody();
            if (! $html || ! str_contains($html, '<style')) {
                return;
            }

            try {
                $inlined = (new CssToInlineStyles())->convert($html);

                // Drop the <style> blocks after inlining so clients that
                // do honor them don't re-apply rules on top of our
                // inlined copies (which can cause double-decoration in
                // Apple Mail and trigger spam filters in some clients).
                $inlined = preg_replace('/<style\b[^>]*>.*?<\/style>/is', '', $inlined) ?? $inlined;

                $message->html($inlined);
            } catch (\Throwable $e) {
                // Never let the inliner break a send — log and ship the
                // original HTML. The user gets an unstyled-but-readable
                // email, which is still better than a failed send.
                report($e);
            }
        });
    }

    private function registerMailLogger(): void
    {
        Event::listen(MessageSent::class, function (MessageSent $event): void {
            try {
                $message = $event->message;
                $headers = $message->getHeaders();

                $type = $headers->get('X-Email-Type')?->getBody() ?? 'unknown';
                $userId = $headers->get('X-User-Id')?->getBody();

                $to = $message->getTo();
                $recipientEmail = $to ? collect($to)->first(fn () => true)?->getAddress() : null;

                if (! $recipientEmail) {
                    return;
                }

                EmailLog::create([
                    'user_id'         => $userId ? (int) $userId : null,
                    'email_type'      => $type,
                    'recipient_email' => $recipientEmail,
                    'subject'         => $message->getSubject(),
                    'sent_at'         => Carbon::now(),
                ]);
            } catch (\Throwable $e) {
                report($e);
            }
        });
    }
}
