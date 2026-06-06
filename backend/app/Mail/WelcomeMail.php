<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Welcome to Pasona');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.welcome',
            with: [
                'firstName'    => explode(' ', $this->user->name)[0],
                'email'        => $this->user->email,
                'dashboardUrl' => config('app.frontend_url') . '/dashboard',
                'settingsUrl'  => config('app.frontend_url') . '/settings/notifications',
            ],
        );
    }
}
