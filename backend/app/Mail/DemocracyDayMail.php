<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DemocracyDayMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public ?int $userId = null) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new \Illuminate\Mail\Mailables\Address(
                'pasona@adebayosystems.com.ng',
                'Pasona Finance',
            ),
            subject: 'Happy Democracy Day from Pasona 🇳🇬',
        );
    }

    public function content(): Content
    {
        $frontend = rtrim((string) env('FRONTEND_URL', 'http://localhost:8080'), '/');

        return new Content(
            view: 'emails.democracy_day',
            with: [
                'settingsUrl'    => $frontend . '/settings/notifications',
                'unsubscribeUrl' => $frontend . '/settings/notifications#unsubscribe',
            ],
        );
    }

    public function build(): self
    {
        return $this->withSymfonyMessage(function ($message) {
            $headers = $message->getHeaders();
            $headers->addTextHeader('X-Email-Type', 'democracy-day');
            if ($this->userId) {
                $headers->addTextHeader('X-User-Id', (string) $this->userId);
            }
        });
    }
}
