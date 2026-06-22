<?php

namespace App\Console\Commands;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendStreakNotifications extends Command
{
    protected $signature = 'streak:notify
        {--dry-run : Count recipients without sending}
        {--user= : Send to a single user ID}
        {--force : Send regardless of last notification time}
        {--days=7 : Minimum days since last notification}';

    protected $description = 'Send weekly streak notification emails to active users.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $userId = $this->option('user');
        $force  = (bool) $this->option('force');
        $days   = max(1, (int) $this->option('days'));

        $cutoff = now()->subDays($days);

        $query = User::query()
            ->whereNotNull('email')
            ->whereHas('transactions');

        if ($userId) {
            $query->whereKey((int) $userId);
        }

        if (! $force) {
            $query->where(function ($q) use ($cutoff) {
                $q->whereNull('streak_notified_at')
                  ->orWhere('streak_notified_at', '<=', $cutoff);
            });
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

        $frontend = rtrim((string) config('app.frontend_url'), '/');
        $sent = 0;

        $query->chunkById(50, function ($users) use ($frontend, &$sent) {
            foreach ($users as $user) {
                $stats = $this->computeStreaks($user);

                if ($stats['currentStreak'] === 0 && $stats['transactionsThisWeek'] === 0) {
                    continue;
                }

                $firstName = explode(' ', (string) $user->name)[0] ?: (string) $user->name;

                Mail::send('emails.streak-notification', [
                    'firstName'            => $firstName,
                    'currentStreak'        => $stats['currentStreak'],
                    'longestStreak'        => $stats['longestStreak'],
                    'transactionsThisWeek' => $stats['transactionsThisWeek'],
                    'activeDaysLast30'     => $stats['activeDaysLast30'],
                    'dashboardUrl'         => $frontend . '/dashboard',
                    'settingsUrl'          => $frontend . '/settings/notifications',
                ], function ($message) use ($user) {
                    $message->to($user->email, $user->name)
                            ->subject('Your weekly streak report from Pasona');
                    $message->getHeaders()->addTextHeader('X-Email-Type', 'streak-notification');
                    $message->getHeaders()->addTextHeader('X-User-Id', (string) $user->id);
                });

                $user->streak_notified_at = now();
                $user->save();
                $sent++;
            }
        });

        $this->info("Sent {$sent} streak notification email(s).");
        return self::SUCCESS;
    }

    private function computeStreaks(User $user): array
    {
        $txDates = $user->transactions()
            ->where('transaction_date', '>=', now()->subDays(60)->startOfDay())
            ->pluck('transaction_date')
            ->map(fn ($d) => Carbon::parse($d)->startOfDay())
            ->unique()
            ->sort(fn (Carbon $a, Carbon $b) => $a->timestamp <=> $b->timestamp)
            ->values();

        $currentStreak = 0;
        $longestStreak = 0;

        if ($txDates->isNotEmpty()) {
            $check = today();
            while ($txDates->first(fn (Carbon $d) => $d->isSameDay($check))) {
                $currentStreak++;
                $check = $check->copy()->subDay();
            }

            $streak = 0;
            foreach ($txDates as $i => $d) {
                $streak++;
                if ($i === $txDates->count() - 1 || ! $txDates[$i + 1]->isSameDay($d->copy()->addDay())) {
                    if ($streak > $longestStreak) {
                        $longestStreak = $streak;
                    }
                    $streak = 0;
                }
            }
        }

        $transactionsThisWeek = $user->transactions()
            ->where('transaction_date', '>=', now()->subWeek()->startOfDay())
            ->count();

        $activeDaysLast30 = $user->transactions()
            ->where('transaction_date', '>=', now()->subDays(30)->startOfDay())
            ->distinct('transaction_date')
            ->count('transaction_date');

        return [
            'currentStreak'        => $currentStreak,
            'longestStreak'        => $longestStreak,
            'transactionsThisWeek' => $transactionsThisWeek,
            'activeDaysLast30'     => $activeDaysLast30,
        ];
    }
}
