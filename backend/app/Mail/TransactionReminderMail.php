<?php

namespace App\Mail;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

/**
 * The "log today's transactions" daily nudge.
 *
 * The user picks their own reminder time (default 21:10). The
 * SendDailyReminders command dispatches {@see \App\Jobs\SendTransactionReminder}
 * for every user whose reminder_time falls in the current 5-minute
 * window, smart-skips anyone who already logged a transaction today,
 * and dedupes via the users.reminder_last_sent_at column.
 *
 * The mailable carries the user's own aggregates (today's spend /
 * income / account count) so the copy can be personal without
 * re-running queries at render time.
 */
class TransactionReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $count;
    public float $todayIncome;
    public float $todayExpense;
    public int $accountsCount;
    public bool $loggedToday;
    public string $greeting;
    public string $reminderTime;
    public string $appUrl;
    public string $addUrl;
    public string $settingsUrl;

    public function __construct(public User $user)
    {
        $this->reminderTime = (string) $user->reminder_time;

        $today = Carbon::today();
        $todays = Transaction::query()
            ->where('user_id', $user->id)
            ->whereDate('transaction_date', $today)
            ->get();

        $this->count         = $todays->count();
        $this->loggedToday   = $this->count > 0;
        $this->todayIncome   = (float) $todays->where('type', 'income')->sum('amount');
        $this->todayExpense  = (float) $todays->where('type', 'expense')->sum('amount');
        $this->accountsCount = $user->accounts()->count();

        $hour = (int) ($todays->max('created_at')?->format('H') ?? now()->format('H'));
        $this->greeting = match (true) {
            $hour < 12 => 'Good morning',
            $hour < 17 => 'Good afternoon',
            default    => 'Good evening',
        };

        $frontend = rtrim((string) env('FRONTEND_URL', 'http://localhost:8080'), '/');
        $this->appUrl      = $frontend;
        $this->addUrl      = $frontend . '/transactions/new?from=reminder';
        $this->settingsUrl = $frontend . '/settings/reminders';
    }

    /**
     * Build the message.
     */
    public function build(): self
    {
        return $this
            ->subject($this->loggedToday
                ? "Quick gut-check: anything missing from today's ₦" . number_format($this->todayExpense, 2) . ' spend?'
                : "It's {$this->reminderTime} — log today's transactions")
            ->markdown('emails.transaction-reminder');
    }

    /**
     * @return array<int, mixed>
     */
    public function attachments(): array
    {
        return [];
    }
}
