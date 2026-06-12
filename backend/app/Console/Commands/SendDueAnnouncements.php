<?php

namespace App\Console\Commands;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * Send all due announcements to users who haven't received them yet.
 *
 * This command is designed to run every minute via the scheduler.
 * It checks for announcements where scheduled_at ≤ now and sent_at is null.
 */
class SendDueAnnouncements extends Command
{
    protected $signature = 'announcements:send-due
        {--dry-run : Preview without sending}
        {--chunk=50 : Users per batch}';

    protected $description = 'Send all due broadcast announcements to users.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $chunk  = max(1, (int) $this->option('chunk'));

        $announcements = Announcement::pending()->get();

        if ($announcements->isEmpty()) {
            $this->info('No due announcements.');
            return self::SUCCESS;
        }

        $frontend = rtrim((string) env('FRONTEND_URL', 'http://localhost:8080'), '/');

        foreach ($announcements as $announcement) {
            $this->line("Processing: {$announcement->name}");

            $query = User::whereDoesntHave('announcements', fn ($q) => $q->where('announcement_id', $announcement->id))
                ->whereNotNull('email');

            $total = $query->count();
            if ($total === 0) {
                $announcement->markSent();
                $this->line("  -> No pending recipients, marking sent.");
                continue;
            }

            $this->line("  -> {$total} recipient(s)");

            if ($dryRun) {
                continue;
            }

            $vars = array_merge(
                ['settingsUrl' => $frontend . '/settings'],
                $announcement->template_vars ?? [],
            );

            $sent = 0;
            $query->chunkById($chunk, function ($users) use ($announcement, $frontend, &$sent) {
                foreach ($users as $user) {
                    $vars = array_merge(
                        [
                            'firstName'   => explode(' ', (string) $user->name)[0] ?: (string) $user->name,
                            'settingsUrl' => $frontend . '/settings',
                        ],
                        $announcement->template_vars ?? [],
                    );

                    Mail::send($announcement->template, $vars, function ($message) use ($user, $announcement) {
                        $message->to($user->email, $user->name)
                                ->subject($announcement->subject);
                        $message->getHeaders()->addTextHeader('X-Email-Type', 'announcement');
                        $message->getHeaders()->addTextHeader('X-User-Id', (string) $user->id);
                    });

                    $announcement->markDelivered($user);
                    $sent++;
                }
            });

            $announcement->markSent();
            $this->info("  -> Sent {$sent} email(s) for '{$announcement->name}'.");
        }

        return self::SUCCESS;
    }
}
