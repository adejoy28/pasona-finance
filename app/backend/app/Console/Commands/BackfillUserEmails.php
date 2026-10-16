<?php

namespace App\Console\Commands;

use App\Mail\WelcomeMail;
use App\Models\EmailLog;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

class BackfillUserEmails extends Command
{
    protected $signature = 'users:backfill-emails
        {--type=both : Which email to send — welcome, verify, or both}
        {--user= : Restrict to a single user (id or email)}
        {--since= : Only users created on/after this date (YYYY-MM-DD)}
        {--skip-verified : Skip users whose email_verified_at is set (welcome only — verify already auto-skips them)}
        {--skip-sent : Skip users who already have an email_logs entry for this type}
        {--chunk=100 : Number of users to process per chunk}
        {--dry-run : Show what would happen without dispatching}';

    protected $description = 'Send welcome and/or verify emails to users who already registered before the mail system was live.';

    public function handle(): int
    {
        $type = strtolower((string) $this->option('type'));
        if (! in_array($type, ['welcome', 'verify', 'both'], true)) {
            $this->error("Invalid --type. Use welcome, verify, or both.");
            return self::FAILURE;
        }

        $dryRun       = (bool) $this->option('dry-run');
        $skipVerified = (bool) $this->option('skip-verified');
        $skipSent     = (bool) $this->option('skip-sent');
        $chunkSize    = max(1, (int) $this->option('chunk'));
        $userOpt      = $this->option('user');
        $since        = $this->option('since');

        $query = User::query()->orderBy('id');

        if ($userOpt) {
            $query->where(function ($q) use ($userOpt) {
                if (is_numeric($userOpt)) {
                    $q->where('id', (int) $userOpt);
                }
                $q->orWhere('email', $userOpt);
            });
        }

        if ($since) {
            $query->where('created_at', '>=', $since);
        }

        if ($skipSent) {
            $emailTypes = match ($type) {
                'welcome' => ['welcome'],
                'verify'  => ['verify'],
                'both'    => ['welcome', 'verify'],
            };
            $alreadySentUserIds = EmailLog::whereIn('email_type', $emailTypes)
                ->pluck('user_id')
                ->unique();
            $query->whereNotIn('id', $alreadySentUserIds);
        }

        $total = (clone $query)->count();
        if ($total === 0) {
            $this->warn('No users matched the filters. Nothing to do.');
            return self::SUCCESS;
        }

        $this->info("Will send [{$type}] email(s) to {$total} user(s).");
        if ($dryRun) {
            $this->warn('Dry run — no jobs will be dispatched.');
        }
        if (! $dryRun && ! $this->confirm('Proceed?', true)) {
            $this->warn('Aborted.');
            return self::SUCCESS;
        }

        $welcomeSent = 0;
        $verifySent  = 0;
        $skipped     = 0;
        $failed      = 0;

        $query->chunkById($chunkSize, function ($users) use ($type, $dryRun, $skipVerified, &$welcomeSent, &$verifySent, &$skipped, &$failed) {
            foreach ($users as $user) {
                /** @var User $user */
                $isVerified = ! is_null($user->email_verified_at);

                $doWelcome = in_array($type, ['welcome', 'both'], true)
                    && ! ($skipVerified && $isVerified);

                $doVerify  = in_array($type, ['verify', 'both'], true)
                    && ! $isVerified;

                if (! $doWelcome && ! $doVerify) {
                    $skipped++;
                    $this->line("  skip  #{$user->id} {$user->email} (already verified)");
                    continue;
                }

                if ($dryRun) {
                    $tags = [];
                    if ($doWelcome) { $tags[] = 'welcome'; }
                    if ($doVerify)  { $tags[] = 'verify'; }
                    $this->line("  would send [".implode(',', $tags)."] -> #{$user->id} {$user->email}");
                    if ($doWelcome) { $welcomeSent++; }
                    if ($doVerify)  { $verifySent++; }
                    continue;
                }

                try {
                    if ($doWelcome) {
                        Mail::to($user->email)->queue(new WelcomeMail($user));
                        $welcomeSent++;
                    }
                    if ($doVerify) {
                        $user->sendEmailVerificationNotification();
                        $verifySent++;
                    }
                    $this->line("  queued #{$user->id} {$user->email}");
                } catch (Throwable $e) {
                    $failed++;
                    $this->error("  fail   #{$user->id} {$user->email} -> {$e->getMessage()}");
                }
            }
        });

        $verb = $dryRun ? 'Would queue' : 'Queued';
        $this->info("{$verb}: {$welcomeSent} welcome, {$verifySent} verify. Skipped: {$skipped}. Failed: {$failed}.");

        if (! $dryRun) {
            $this->line('');
            $this->line('Jobs are now on the [database] queue. A worker must run to deliver them:');
            $this->line('  php artisan queue:work --stop-when-empty');
        }

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
