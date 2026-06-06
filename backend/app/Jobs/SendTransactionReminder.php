<?php

namespace App\Jobs;

use App\Mail\TransactionReminderMail;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

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

        Mail::to($user->email)->send(new TransactionReminderMail($user));

        $user->forceFill(['reminder_last_sent_at' => now()])->save();
    }

    public function failed(\Throwable $e): void
    {
        Log::warning('SendTransactionReminder failed', [
            'user_id' => $this->userId,
            'error'   => $e->getMessage(),
        ]);
    }
}
