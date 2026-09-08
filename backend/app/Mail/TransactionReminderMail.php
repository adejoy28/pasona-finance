<?php

namespace App\Mail;

use App\Models\Transaction;
use App\Models\User;
use App\Services\MoneyFactsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

/**
 * The "log today's transactions" daily nudge.
 *
 * Enriched with dynamic zero-repeat copy, user streak status, and a curated
 * "Daily Money Fact" to make every email entertaining, engaging, and educational.
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
    public string $headline;
    public string $subtext;
    public string $customSubject;
    public int $streak;
    /** @var array{category: string, title: string, fact: string, take: string} */
    public array $dailyFact;
    public string $reminderTime;
    public string $appUrl;
    public string $addUrl;
    public string $settingsUrl;

    public function __construct(public User $user)
    {
        $this->reminderTime = (string) ($user->reminder_time ?: '21:10');
        $userTz = $user->timezone ?: 'Africa/Lagos';
        $todayTz = Carbon::now($userTz)->startOfDay();

        $todays = Transaction::query()
            ->where('user_id', $user->id)
            ->where('transaction_date', '>=', $todayTz)
            ->get();

        $this->count         = $todays->count();
        $this->loggedToday   = $this->count > 0;
        $this->todayIncome   = (float) $todays->where('type', 'income')->sum('amount');
        $this->todayExpense  = (float) $todays->where('type', 'expense')->sum('amount');
        $this->accountsCount = $user->accounts()->count();
        $this->streak        = $user->calculateStreak();

        /** @var MoneyFactsService $moneyFactsService */
        $moneyFactsService = app(MoneyFactsService::class);
        $this->dailyFact   = $moneyFactsService->getDailyFact($user, Carbon::now($userTz));

        $copy = $moneyFactsService->getDynamicCopy(
            $user,
            Carbon::now($userTz),
            $this->loggedToday,
            $this->streak,
            $this->todayExpense
        );

        $this->customSubject = $copy['subject'];
        $this->greeting      = $copy['greeting'];
        $this->headline      = $copy['headline'];
        $this->subtext       = $copy['subtext'];

        $frontend = rtrim((string) env('FRONTEND_URL', 'http://localhost:8080'), '/');
        $this->appUrl      = $frontend;
        $this->addUrl      = $frontend . '/transactions/new?from=reminder';
        $this->settingsUrl = $frontend . '/settings';
    }

    /**
     * Build the message.
     */
    public function build(): self
    {
        return $this
            ->subject($this->customSubject)
            ->view('emails.transaction-reminder')
            ->withSymfonyMessage(function ($message) {
                $headers = $message->getHeaders();
                $headers->addTextHeader('X-Email-Type', 'reminder');
                $headers->addTextHeader('X-User-Id', (string) $this->user->id);
            });
    }

    /**
     * @return array<int, mixed>
     */
    public function attachments(): array
    {
        return [];
    }
}
