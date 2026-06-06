<?php

namespace App\Console\Commands;

use App\Jobs\SendTransactionReminder;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Scan users whose `reminder_time` matches the current 5-minute
 * window, smart-skip those who already logged a transaction today,
 * dedupe via `reminder_last_sent_at`, and dispatch a
 * {@see SendTransactionReminder} job for the rest.
 *
 * Run by the scheduler (see routes/console.php). The window is
 * ±2 minutes so a 5-minute tick will always hit each reminder_time
 * at least once; running on a 1-minute tick works too because the
 * job itself re-checks the dedupe window before sending.
 *
 * Flags:
 *   --user=ID       Process a single user (bypasses the time match)
 *   --no-smart-skip Send even if the user already logged today
 *   --dry-run       Print the would-be dispatches without queueing
 *   --window=MIN    Override the time-match window in minutes
 */
class SendDailyReminders extends Command
{
    protected $signature = 'reminders:send-daily
        {--user= : Process a single user (bypasses the time match)}
        {--no-smart-skip : Send even if the user already logged a transaction today}
        {--dry-run : Show what would be queued without dispatching}
        {--window=2 : Time-match window in minutes (± this many minutes from now)}';

    protected $description = 'Queue daily transaction-logging reminders for users whose reminder_time matches now.';

    public function handle(): int
    {
        $now          = Carbon::now();
        $windowMin    = max(0, (int) $this->option('window'));
        $smartSkip    = ! $this->option('no-smart-skip');
        $dryRun       = (bool) $this->option('dry-run');
        $singleUserId = $this->option('user') !== null ? (int) $this->option('user') : null;

        $query = User::query()->whereNotNull('email');

        if ($singleUserId) {
            $query->whereKey($singleUserId);
        } else {
            // reminder_time is "HH:MM" in the app's timezone.
            // Match any time within ±$windowMin minutes of now.
            $from = $now->copy()->subMinutes($windowMin)->format('H:i');
            $to   = $now->copy()->addMinutes($windowMin)->format('H:i');

            // The simple WHERE reminder_time BETWEEN ... misses
            // wrap-around windows (e.g. 23:58 ↔ 00:02). Split into
            // two ranges when the window crosses midnight.
            if ($from <= $to) {
                $query->whereBetween('reminder_time', [$from, $to]);
            } else {
                $query->where(function ($q) use ($from, $to) {
                    $q->where('reminder_time', '>=', $from)
                      ->orWhere('reminder_time', '<=', $to);
                });
            }
        }

        $users = $query->get();
        $this->info(sprintf(
            'Found %d candidate user(s) at %s (window ±%d min, smart-skip=%s).',
            $users->count(),
            $now->format('Y-m-d H:i'),
            $windowMin,
            $smartSkip ? 'on' : 'off'
        ));

        if ($users->isEmpty()) {
            return self::SUCCESS;
        }

        $today = $now->toDateString();

        $usersWithTx = Transaction::query()
            ->whereIn('user_id', $users->pluck('id'))
            ->whereDate('transaction_date', $today)
            ->distinct()
            ->pluck('user_id')
            ->flip();

        $alreadySentToday = User::query()
            ->whereIn('id', $users->pluck('id'))
            ->whereDate('reminder_last_sent_at', $today)
            ->pluck('id')
            ->flip();

        $queued = 0;
        $skippedSmart = 0;
        $skippedDedupe = 0;

        foreach ($users as $user) {
            if ($alreadySentToday->has($user->id)) {
                $skippedDedupe++;
                continue;
            }

            if ($smartSkip && $usersWithTx->has($user->id)) {
                $skippedSmart++;
                continue;
            }

            if ($dryRun) {
                $this->line("  would queue: user #{$user->id} ({$user->email}) at {$user->reminder_time}");
            } else {
                SendTransactionReminder::dispatch($user->id);
            }
            $queued++;
        }

        $this->info(sprintf(
            'Done. queued=%d, smart-skipped=%d, dedupe-skipped=%d.',
            $queued,
            $skippedSmart,
            $skippedDedupe
        ));

        return self::SUCCESS;
    }
}
