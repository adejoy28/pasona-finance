<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
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
     *
     * Builds a reset URL pointing at the frontend (the backend is a
     * JSON API and does not host the reset form). The user lands on
     * FRONTEND_URL/reset-password with the token and email in the
     * query string; the SPA then POSTs them to /api/reset-password.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $frontend = rtrim((string) env('FRONTEND_URL', 'http://localhost:8080'), '/');
        $email    = $notifiable->getEmailForPasswordReset();

        $url = $frontend
             . '/reset-password?token=' . $this->token
             . '&email=' . urlencode($email);

        return (new MailMessage)
            ->subject('Reset your password')
            ->greeting('Hello ' . ($notifiable->name ?? '') . '!')
            ->line('You are receiving this email because we received a password reset request for your account.')
            ->action('Reset password', $url)
            ->line('This password reset link will expire in 60 minutes.')
            ->line('If you did not request a password reset, no further action is required.');
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
