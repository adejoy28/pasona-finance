<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * One-off command to send the "daily reminders are now live" email
 * to every registered user who hasn't already received it.
 *
 * Usage:
 *   php artisan reminders:announce                     # all users
 *   php artisan reminders:announce --dry-run           # preview count
 *   php artisan reminders:announce --user=5            # single user
 *   php artisan reminders:announce --chunk=100         # 100 at a time
 */
class SendReminderAnnouncement extends Command
{
    protected $signature = 'reminders:announce
        {--dry-run : Count recipients without sending}
        {--user= : Send to a single user ID}
        {--chunk=50 : Users per batch}';

    protected $description = 'Send the daily-reminder announcement email to users who have not yet received it.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $userId = $this->option('user');
        $chunk  = max(1, (int) $this->option('chunk'));

        $query = User::query()
            ->whereNotNull('email')
            ->whereNull('reminder_announced_at');

        if ($userId) {
            $query->whereKey((int) $userId);
        }

        $total = $query->count();

        if ($total === 0) {
            $this->info('No users to notify.');
            return self::SUCCESS;
        }

        $this->line("Found {$total} user(s) to notify.");

        if ($dryRun) {
            $this->info('Dry run — no emails sent.');
            return self::SUCCESS;
        }

        $frontend = rtrim((string) env('FRONTEND_URL', 'http://localhost:8080'), '/');
        $sent = 0;

        $query->chunkById($chunk, function ($users) use ($frontend, &$sent) {
            foreach ($users as $user) {
                $firstName = explode(' ', (string) $user->name)[0] ?: (string) $user->name;

                Mail::send('emails.reminder-announcement', [
                    'firstName'    => $firstName,
                    'settingsUrl'  => $frontend . '/settings',
                ], function ($message) use ($user) {
                    $message->to($user->email, $user->name)
                            ->subject('Daily reminders are now live on Pasona');
                });

                $user->reminder_announced_at = now();
                $user->save();
                $sent++;
            }
        });

        $this->info("Sent {$sent} announcement email(s).");
        return self::SUCCESS;
    }
}
