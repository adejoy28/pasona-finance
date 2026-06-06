<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Password-reset notification.
 *
 * Queued so the forgot-password endpoint never blocks on SMTP.
 * Builds a reset URL pointing at the frontend (the backend is a
 * JSON API and does not host the reset form). The user lands on
 * FRONTEND_URL/reset-password with the token and email in the
 * query string; the SPA then POSTs them to /api/reset-password.
 */
class ResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public string $token)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $frontend = rtrim((string) env('FRONTEND_URL', 'http://localhost:8080'), '/');
        $email    = $notifiable->getEmailForPasswordReset();

        $url = $frontend
             . '/reset-password?token=' . $this->token
             . '&email=' . urlencode($email);

        return (new MailMessage)
            ->subject('Reset your Pasona password')
            ->markdown('emails.reset-password', [
                'actionUrl' => $url,
            ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [];
    }
}
