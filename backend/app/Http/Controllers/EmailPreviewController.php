<?php

namespace App\Http\Controllers;

use App\Mail\TransactionReminderMail;
use App\Mail\WelcomeMail;
use App\Models\User;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\View;

/**
 * Dev-only browser preview for every email template in resources/views/emails.
 *
 * Lives outside the API and is only registered when APP_ENV is not production
 * (see routes/web.php). Renders templates with realistic sample data so a
 * designer can iterate on copy/layout without firing real mail.
 */
class EmailPreviewController extends Controller
{
    /**
     * @var array<string, array{label: string, view: string, mailable?: class-string}>
     */
    private const TEMPLATES = [
        'welcome' => [
            'label'    => 'Welcome',
            'view'     => 'emails.welcome',
            'mailable' => WelcomeMail::class,
        ],
        'reminder-announcement' => [
            'label' => 'Reminder announcement',
            'view'  => 'emails.reminder-announcement',
        ],
        'verify-email' => [
            'label' => 'Verify email',
            'view'  => 'emails.verify-email',
        ],
        'reset-password' => [
            'label' => 'Reset password',
            'view'  => 'emails.reset-password',
        ],
        'transaction-reminder' => [
            'label'    => 'Transaction reminder',
            'view'     => 'emails.transaction-reminder',
            'mailable' => TransactionReminderMail::class,
        ],
        'democracy-day' => [
            'label' => 'Democracy Day',
            'view'  => 'emails.democracy_day',
        ],
    ];

    public function index(): Response
    {
        $rows = collect(self::TEMPLATES)
            ->map(fn (array $t, string $slug) => [
                'slug'  => $slug,
                'label' => $t['label'],
                'url'   => route('email-preview.show', ['template' => $slug]),
            ])
            ->values();

        return $this->chrome(null, 'Email previews', View::make('docs.email-preview-list', ['templates' => $rows])->render());
    }

    public function show(string $template): Response
    {
        if (! array_key_exists($template, self::TEMPLATES)) {
            abort(404, "Unknown email template [{$template}].");
        }

        $config  = self::TEMPLATES[$template];
        $sample  = $this->sampleUser();
        $payload = $this->payloadFor($template, $sample);

        $html = isset($config['mailable'])
            ? $this->renderMailable($config['mailable'], $sample)
            : View::make($config['view'], $payload)->render();

        return $this->chrome($template, $config['label'], $html);
    }

    private function chrome(?string $active, string $title, string $body): Response
    {
        $templates = collect(self::TEMPLATES)
            ->map(fn (array $t, string $slug) => [
                'slug'  => $slug,
                'label' => $t['label'],
                'url'   => route('email-preview.show', ['template' => $slug]),
            ])
            ->values();

        $html = View::make('docs.email-preview-chrome', [
            'templates' => $templates,
            'active'    => $active,
            'title'     => $title,
            'body'      => $body,
        ])->render();

        return response($html);
    }

    private function sampleUser(): User
    {
        $user = new User([
            'name'          => 'John Adebayo',
            'email'         => 'john@example.com',
            'reminder_time' => '21:10',
        ]);
        $user->id = 1;

        return $user;
    }

    /**
     * @return array<string, mixed>
     */
    private function payloadFor(string $template, User $user): array
    {
        $frontend = rtrim((string) env('FRONTEND_URL', 'http://localhost:8080'), '/');
        $first    = explode(' ', $user->name)[0];

        // Shared footer links (every email chrome uses these).
        $settingsUrl    = $frontend . '/settings/notifications';
        $unsubscribeUrl = $frontend . '/settings/notifications#unsubscribe';

        $base = [
            'settingsUrl'    => $settingsUrl,
            'unsubscribeUrl' => $unsubscribeUrl,
        ];

        return match ($template) {
            'reminder-announcement' => $base + [
                'firstName' => $first,
                'settingsUrl' => $frontend . '/settings',
            ],
            'welcome' => $base + [
                'firstName'    => $first,
                'email'        => $user->email,
                'dashboardUrl' => $frontend . '/dashboard',
            ],
            'verify-email' => $base + [
                'firstName' => $first,
                'email'     => $user->email,
                'actionUrl' => $frontend . '/verify-email/preview-token?expires=60',
            ],
            'reset-password' => $base + [
                'notifiable' => $user,
                'actionUrl'  => $frontend . '/reset-password/preview-token?expires=60',
            ],
            'transaction-reminder' => $base + [
                'user'          => $user,
                'count'         => 4,
                'loggedToday'   => true,
                'todayIncome'   => 75000.0,
                'todayExpense'  => 12500.5,
                'accountsCount' => 3,
                'greeting'      => 'Good evening',
                'reminderTime'  => '21:10',
                'appUrl'        => $frontend,
                'addUrl'        => $frontend . '/transactions/new?from=reminder',
            ],
            'democracy-day' => $base,
        };
    }

    private function renderMailable(string $mailableClass, User $user): string
    {
        $mailable = app($mailableClass, ['user' => $user]);

        return $mailable->render();
    }
}
