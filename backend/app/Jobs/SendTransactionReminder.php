<?php

namespace App\Jobs;

use App\Mail\TransactionReminderMail;
use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

/**
 * Send the daily "log today's transactions" reminder to one user.
 *
 * This is the unit-of-work job dispatched by
 * {@see \App\Console\Commands\SendDailyReminders}. We stamp
 * `reminder_last_sent_at` here (not in the command) so that even
 * if the queue is delayed by a few minutes, the dedupe window
 * covers the actual send, not the dispatch.
 *
 * If the user's email is no longer valid (unsubscribed, hard-bounced
 * etc.) the mailable's `failed()` hook logs and lets the job fail
 * cleanly so the failed_jobs table captures it for follow-up.
 */
class SendTransactionReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** @var int */
    public $tries = 3;

    /** @var int */
    public $backoff = 60;

    public function __construct(public int $userId)
    {
    }

    public function handle(): void
    {
        $user = User::find($this->userId);

        if (! $user) {
            return;
        }

        if (! $user->email) {
            return;
        }

        // Re-check the dedupe window in case another worker
        // dispatched the same reminder concurrently.
        if ($user->reminder_last_sent_at && $user->reminder_last_sent_at->isToday()) {
            return;
        }

        $mailable = new TransactionReminderMail($user);
        Mail::to($user->email)->send($mailable);

        /** @var \App\Services\MoneyFactsService $moneyFactsService */
        $moneyFactsService = app(\App\Services\MoneyFactsService::class);
        $copy = $moneyFactsService->getDynamicCopy(
            $user,
            now($user->timezone ?: 'Africa/Lagos'),
            $mailable->loggedToday,
            $mailable->streak,
            $mailable->todayExpense
        );

        AppNotification::send(
            $user,
            'reminder',
            $copy['pushTitle'],
            $copy['pushBody'],
            ['url' => '/transactions/add'],
        );

        $this->sendPushNotification($user, $copy['pushTitle'], $copy['pushBody']);

        $user->forceFill(['reminder_last_sent_at' => now()])->save();
    }

    private function sendPushNotification(User $user, string $title, string $body): void
    {
        $subscriptions = $user->pushSubscriptions;

        if ($subscriptions->isEmpty()) {
            return;
        }

        $vapidPublicKey = config('services.vapid.public_key');
        $vapidPrivateKey = config('services.vapid.private_key');
        $vapidSubject = config('services.vapid.subject');

        if (! $vapidPublicKey || ! $vapidPrivateKey) {
            return;
        }

        try {
            $auth = [
                'VAPID' => [
                    'subject' => $vapidSubject,
                    'publicKey' => $vapidPublicKey,
                    'privateKey' => $vapidPrivateKey,
                ],
            ];

            $webPush = new WebPush($auth);

            $payload = json_encode([
                'title' => $title,
                'body' => $body,
                'icon' => '/icons/icon-192x192.svg',
                'data' => ['url' => '/'],
                'vibrate' => [200, 100, 200],
            ]);

            foreach ($subscriptions as $sub) {
                $webPush->queueNotification(
                    Subscription::create([
                        'endpoint' => $sub->endpoint,
                        'publicKey' => $sub->p256dh,
                        'authToken' => $sub->auth,
                    ]),
                    $payload,
                );
            }

            $results = $webPush->flush();
            foreach ($results as $result) {
                if (! $result->isSuccess()) {
                    Log::warning('Push notification failed', [
                        'user_id' => $user->id,
                        'endpoint' => $result->getEndpoint(),
                        'reason' => $result->getReason(),
                    ]);

                    if ($result->isSubscriptionExpired()) {
                        $user->pushSubscriptions()
                            ->where('endpoint', $result->getEndpoint())
                            ->delete();
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('SendPushNotification failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::warning('SendTransactionReminder failed', [
            'user_id' => $this->userId,
            'error'   => $e->getMessage(),
        ]);
    }
}

