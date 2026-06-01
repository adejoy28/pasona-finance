<?php

namespace App\Jobs;

/**
 * SendDailyReminder Job
 * 
 * Handles sending PWA push notifications to users who have a reminder set.
 */

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class SendDailyReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The user to send the reminder to.
     *
     * @var User
     */
    protected $user;

    /**
     * Create a new job instance.
     * 
     * @param User $user
     */
    public function __construct(User $user)
    {
        $this->user = $user;
    }

    /**
     * Execute the job.
     * 
     * Logic for sending the actual PWA push notification via a notification service.
     */
    public function handle(): void
    {
        // Logic to send push notification via WebPush or similar library
        // This would typically use $this->user->notify(new DailyExpenseReminder());
    }
}
