<?php

/**
 * One-off test sender — dispatches all 4 Pasona emails to a real address
 * via the configured MAIL_MAILER (currently Resend), then drains the queue
 * so the recipient actually receives them.
 *
 * Usage: php scripts/send-test-emails.php <recipient-email>
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Mail\TransactionReminderMail;
use App\Mail\WelcomeMail;
use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;

$recipient = $argv[1] ?? null;
if (! $recipient || ! filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Usage: php scripts/send-test-emails.php <recipient-email>\n");
    exit(1);
}

// In-memory stub user — never persisted. id=1 lets the
// TransactionReminderMail constructor's aggregate queries return 0s
// cleanly without needing a real DB row.
$user = new User([
    'name'          => 'John Adebayo',
    'email'         => $recipient,
    'reminder_time' => '21:10',
]);
$user->id = 1;

echo "From : " . config('mail.from.address') . "\n";
echo "To   : {$recipient}\n";
echo "Mail : " . config('mail.default') . "\n";
echo "Queue: " . config('queue.default') . "\n\n";

echo "[1/4] Welcome …\n";
Mail::to($recipient)->send(new WelcomeMail($user));

echo "[2/4] Verify email …\n";
// User model overrides sendEmailVerificationNotification to use our custom
// App\Notifications\VerifyEmailNotification (Markdown -> view switch happened
// in the template refactor, so this now renders the new chrome).
$user->sendEmailVerificationNotification();

echo "[3/4] Reset password …\n";
$user->notify(new ResetPasswordNotification('preview-token-' . substr(md5((string) microtime(true)), 0, 12)));

echo "[4/4] Transaction reminder …\n";
Mail::to($recipient)->send(new TransactionReminderMail($user));

echo "\nAll 4 dispatched. Draining queue (sync execution)...\n";
$exit = Artisan::call('queue:work', [
    '--once'            => true,
    '--stop-when-empty' => true,
    '--tries'           => 1,
    '--timeout'         => 30,
]);

echo "Queue worker exited with code {$exit}.\n";
echo "Check {$recipient} (and spam folder) in a moment.\n";
