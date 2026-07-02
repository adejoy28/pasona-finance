<?php

namespace App\Console\Commands;

use App\Jobs\SendTransactionReminder;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Scan users whose `reminder_time` matches the current 5-minute
 * window in their own timezone, smart-skip those who already logged
 * a transaction today, dedupe via `reminder_last_sent_at`, and
 * dispatch a {@see SendTransactionReminder} job for the rest.
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

    protected $description = 'Queue daily transaction-logging reminders for users whose reminder_time matches now in their timezone.';

    public function handle(): int
    {
        $now          = Carbon::now('UTC');
        $windowMin    = max(0, (int) $this->option('window'));
        $smartSkip    = ! $this->option('no-smart-skip');
        $dryRun       = (bool) $this->option('dry-run');
        $singleUserId = $this->option('user') !== null ? (int) $this->option('user') : null;

        $queued = 0;
        $skippedSmart = 0;
        $skippedDedupe = 0;

        if ($singleUserId) {
            $user = User::find($singleUserId);
            if (! $user) {
                $this->error("User #{$singleUserId} not found.");
                return self::FAILURE;
            }
            $tzStartOfDay = Carbon::now($user->timezone)->startOfDay();
            $result = $this->processUsers(collect([$user]), $tzStartOfDay, $smartSkip, $dryRun);
            $queued = $result['queued'];
            $skippedSmart = $result['skipped_smart'];
            $skippedDedupe = $result['skipped_dedupe'];
        } else {
            // Group users by timezone so we compare each user's
            // reminder_time against their own local time.
            $timezones = User::query()
                ->whereNotNull('email')
                ->select('timezone')
                ->distinct()
                ->pluck('timezone');

            foreach ($timezones as $tz) {
                $tzNow = Carbon::now($tz);
                $from = $tzNow->copy()->subMinutes($windowMin)->format('H:i');
                $to   = $tzNow->copy()->addMinutes($windowMin)->format('H:i');

                $query = User::query()
                    ->whereNotNull('email')
                    ->where('timezone', $tz);

                if ($from <= $to) {
                    $query->whereBetween('reminder_time', [$from, $to]);
                } else {
                    $query->where(function ($q) use ($from, $to) {
                        $q->where('reminder_time', '>=', $from)
                          ->orWhere('reminder_time', '<=', $to);
                    });
                }

                $users = $query->get();
                if ($users->isEmpty()) {
                    continue;
                }

                $this->line(sprintf(
                    '  [%s] %d candidate(s) at %s (window ±%d min)',
                    $tz,
                    $users->count(),
                    $tzNow->format('H:i'),
                    $windowMin,
                ));

                $tzStartOfDay = $tzNow->copy()->startOfDay();
                $result = $this->processUsers($users, $tzStartOfDay, $smartSkip, $dryRun);
                $queued += $result['queued'];
                $skippedSmart += $result['skipped_smart'];
                $skippedDedupe += $result['skipped_dedupe'];
            }
        }

        $this->info(sprintf(
            'Done. queued=%d, smart-skipped=%d, dedupe-skipped=%d.',
            $queued,
            $skippedSmart,
            $skippedDedupe
        ));

        return self::SUCCESS;
    }

    /**
     * @param \Illuminate\Support\Collection<int, \App\Models\User> $users
     * @return array{queued: int, skipped_smart: int, skipped_dedupe: int}
     */
    private function processUsers($users, Carbon $tzStartOfDay, bool $smartSkip, bool $dryRun): array
    {
        $today = $tzStartOfDay->toDateString();

        $userIds = $users->pluck('id');

        $usersWithTx = Transaction::query()
            ->whereIn('user_id', $userIds)
            ->where('created_at', '>=', $tzStartOfDay)
            ->distinct()
            ->pluck('user_id')
            ->flip();

        $alreadySentToday = User::query()
            ->whereIn('id', $userIds)
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
                $this->line("  would queue: user #{$user->id} ({$user->email}) at {$user->reminder_time} [{$user->timezone}]");
            } else {
                SendTransactionReminder::dispatch($user->id);
            }
            $queued++;
        }

        return [
            'queued' => $queued,
            'skipped_smart' => $skippedSmart,
            'skipped_dedupe' => $skippedDedupe,
        ];
    }
}
