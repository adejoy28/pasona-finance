<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

/**
 * Custom email-verification notification.
 *
 * The default Laravel verification link is signed and points at a
 * backend route (/email/verify/{id}/{hash}). For a JSON-API + SPA
 * backend, we instead send a signed link that points at the FRONTEND
 * "you've been verified" page; the SPA then calls back to
 * GET /api/email/verify/{id}/{hash} on the backend to flip the bit.
 *
 * Queued so a register request never blocks on SMTP.
 */
class VerifyEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

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

        $verifyUrl = URL::temporarySignedRoute(
            'api.email.verify',
            now()->addMinutes(60),
            [
                'id'   => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
        );

        $spaUrl = $frontend
            . '/email/verify?verify_url=' . urlencode($verifyUrl)
            . '&redirect=' . urlencode($frontend . '/dashboard');

        return (new MailMessage)
            ->subject('Confirm your Pasona email')
            ->view('emails.verify-email', [
                'actionUrl' => $spaUrl,
                'firstName' => explode(' ', (string) $notifiable->name)[0] ?: (string) $notifiable->name,
                'email'     => $notifiable->getEmailForVerification(),
            ])
            ->withSymfonyMessage(function ($message) use ($notifiable) {
                $message->getHeaders()->addTextHeader('X-Email-Type', 'verify-email');
                $message->getHeaders()->addTextHeader('X-User-Id', (string) $notifiable->getKey());
            });
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
