<?php

namespace App\Console\Commands;

use App\Mail\DemocracyDayMail;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendDemocracyDayEmails extends Command
{
    protected $signature = 'democracy-day:send
        {--dry-run : Count recipients without sending}
        {--user= : Send to a single user ID}
        {--email= : Send to a specific email address}
        {--list : List all users with IDs and emails}';

    protected $description = 'Send the Democracy Day greeting to all registered users.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $userId = $this->option('user');
        $targetEmail = $this->option('email');

        if ($this->option('list')) {
            $users = User::whereNotNull('email')->get(['id', 'email']);
            $this->table(['ID', 'Email'], $users->toArray());
            return self::SUCCESS;
        }

        $query = User::query()
            ->whereNotNull('email');

        if ($userId) {
            $query->whereKey((int) $userId);
        }

        if ($targetEmail) {
            $query->where('email', $targetEmail);
        }

        $total = $query->count();

        if ($total === 0) {
            $this->info('No users to notify.');
            return self::SUCCESS;
        }

        $this->line("Found {$total} user(s).");

        if ($dryRun) {
            $this->info('Dry run — no emails sent.');
            return self::SUCCESS;
        }

        $sent = 0;
        $failed = 0;

        $query->each(function (User $user) use (&$sent, &$failed) {
            try {
                Mail::to($user->email, $user->name)
                    ->send(new DemocracyDayMail());

                $sent++;
                $this->line("  ✓ {$user->email}");
            } catch (\Throwable $e) {
                $failed++;
                Log::error("Failed to send Democracy Day email to {$user->email}: {$e->getMessage()}");
                $this->error("  ✗ {$user->email} — {$e->getMessage()}");
            }
        });

        $this->newLine();
        $this->info("Sent: {$sent}  |  Failed: {$failed}");

        return self::SUCCESS;
    }
}
