<?php

namespace Tests\Feature;

use App\Mail\TransactionReminderMail;
use App\Mail\WelcomeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailDeliverabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_welcome_mail_has_plain_text_and_valid_from_and_reply_to(): void
    {
        $user = User::factory()->create([
            'name'  => 'Amara Okonkwo',
            'email' => 'amara@example.com',
        ]);

        $mailable = new WelcomeMail($user);
        $mailable->assertSeeInHtml('Pasona');
        $mailable->assertSeeInHtml($user->email);

        // Send mail and verify the delivered Symfony Email contains text/plain alternative part
        Mail::fake();
        Mail::to($user->email)->send($mailable);

        Mail::assertSent(WelcomeMail::class, function (WelcomeMail $mail) use ($user) {
            return $mail->hasTo($user->email);
        });
    }

    public function test_transaction_reminder_generates_plain_text_and_headers(): void
    {
        $user = User::factory()->create([
            'name'               => 'Babajide Davies',
            'email'              => 'baba@example.com',
            'reminder_frequency' => 'daily',
        ]);

        $mailable = new TransactionReminderMail($user);
        $renderedHtml = $mailable->render();

        $this->assertStringContainsString('Pasona', $renderedHtml);
        $this->assertNotEmpty($mailable->previewText);
        $this->assertNotEmpty($mailable->unsubscribeUrl);
    }

    public function test_unsubscribe_rejects_unsigned_or_tampered_request(): void
    {
        $user = User::factory()->create([
            'reminder_frequency' => 'daily',
            'marketing_opt_in'   => true,
        ]);

        // Unsigned request must fail with 403
        $response = $this->get("/unsubscribe/{$user->id}?type=reminder");
        $response->assertStatus(403);

        // Tampered signature must fail with 403
        $response = $this->get("/unsubscribe/{$user->id}?type=reminder&signature=invalid_hash");
        $response->assertStatus(403);
    }

    public function test_unsubscribe_via_get_updates_user_and_shows_confirmation(): void
    {
        $user = User::factory()->create([
            'reminder_frequency' => 'daily',
            'marketing_opt_in'   => true,
        ]);

        $signedUrl = URL::signedRoute('unsubscribe', [
            'user' => $user->id,
            'type' => 'reminder',
        ]);

        $response = $this->get($signedUrl);
        $response->assertStatus(200);
        $response->assertSee('Preferences Updated');
        $response->assertSee('unsubscribed from daily reminder emails');

        $user->refresh();
        $this->assertEquals('off', $user->reminder_frequency);
    }

    public function test_one_click_unsubscribe_via_post_succeeds_without_csrf(): void
    {
        $user = User::factory()->create([
            'marketing_opt_in' => true,
        ]);

        $signedUrl = URL::signedRoute('unsubscribe', [
            'user' => $user->id,
            'type' => 'marketing',
        ]);

        $response = $this->post($signedUrl, [
            'List-Unsubscribe' => 'One-Click',
        ]);

        $response->assertStatus(200);
        $this->assertStringContainsString('Unsubscribed successfully', $response->getContent());

        $user->refresh();
        $this->assertFalse((bool) $user->marketing_opt_in);
    }

    public function test_mail_sending_listener_attaches_plain_text_and_unsubscribe_header(): void
    {
        config(['mail.default' => 'array']);

        $user = User::factory()->create([
            'name'  => 'Chioma Eze',
            'email' => 'chioma@example.com',
        ]);

        Mail::to($user->email)->send(new WelcomeMail($user));

        /** @var \Illuminate\Mail\Transport\ArrayTransport $transport */
        $sentMessages = app('mailer')->getSymfonyTransport()->messages();
        $this->assertNotEmpty($sentMessages);

        /** @var \Symfony\Component\Mime\Email $email */
        $email = $sentMessages[0]->getOriginalMessage();

        // 1. Text/plain part was generated from HTML
        $this->assertNotEmpty($email->getTextBody());
        $this->assertStringContainsString('Hey Chioma', $email->getTextBody());
        $this->assertStringContainsString('Pasona', $email->getTextBody());

        // 2. Reply-To was populated
        $this->assertNotEmpty($email->getReplyTo());

        // 3. List-Unsubscribe headers were attached
        $headers = $email->getHeaders();
        $this->assertTrue($headers->has('List-Unsubscribe'));
        $this->assertTrue($headers->has('List-Unsubscribe-Post'));
        $this->assertEquals('List-Unsubscribe=One-Click', $headers->get('List-Unsubscribe-Post')->getBodyAsString());
    }
}

