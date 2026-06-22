@extends('emails._layout', [
    'eyebrow' => 'Streak report',
])

@section('content')
    <div style="display:inline-block;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#94a3b8;margin:0 0 14px;">
        Your weekly check-in
    </div>

    <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:#0f172a;">
        Hey {{ $firstName }}, here's your streak
    </h1>

    <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">
        Consistency is how money stories get told. Here's how you've been tracking your finances this week.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;margin:0 0 20px;">
        <tr>
            <td style="padding:20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td align="center" style="padding:0 8px 16px;width:50%;">
                            <div style="font-size:32px;font-weight:800;color:#059669;line-height:1;">{{ $currentStreak }}</div>
                            <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;margin-top:4px;">Day streak</div>
                        </td>
                        <td align="center" style="padding:0 8px 16px;width:50%;">
                            <div style="font-size:32px;font-weight:800;color:#6366f1;line-height:1;">{{ $longestStreak }}</div>
                            <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;margin-top:4px;">Best ever</div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:16px 8px 0;width:50%;border-top:1px solid #e2e8f0;">
                            <div style="font-size:24px;font-weight:800;color:#0f172a;line-height:1;">{{ $transactionsThisWeek }}</div>
                            <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;margin-top:4px;">Transactions this week</div>
                        </td>
                        <td align="center" style="padding:16px 8px 0;width:50%;border-top:1px solid #e2e8f0;">
                            <div style="font-size:24px;font-weight:800;color:#0f172a;line-height:1;">{{ $activeDaysLast30 }}</div>
                            <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;margin-top:4px;">Active days (last 30)</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    @if ($currentStreak > 0)
        <p style="font-size:14px;line-height:1.6;color:#475569;margin:0 0 16px;">
            @if ($currentStreak >= $longestStreak && $longestStreak > 0)
                You're on your <strong style="color:#0f172a;">longest streak ever</strong> &mdash; {{ $currentStreak }} days and counting. Keep the momentum going!
            @elseif ($currentStreak > 3)
                Solid {{ $currentStreak }}-day run. Your best is {{ $longestStreak }} days &mdash; you're closing in on it.
            @else
                You're building a {{ $currentStreak }}-day streak. Every day counts &mdash; can you make it to {{ $currentStreak + 1 }}?
            @endif
        </p>
    @else
        <p style="font-size:14px;line-height:1.6;color:#475569;margin:0 0 16px;">
            You haven't logged a transaction today yet. A quick entry takes less than a minute &mdash; even the small purchases add up to a meaningful picture.
        </p>
    @endif

    @include('emails._button', ['url' => $dashboardUrl, 'label' => 'Log a transaction'])

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border:1px solid #fef3c7;border-radius:14px;margin:20px 0;">
        <tr>
            <td style="padding:14px 18px;">
                <p style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#d97706;margin:0 0 4px;">What's working &#8212; or what's not?</p>
                <p style="font-size:13px;color:#78350f;line-height:1.65;margin:0;">
                    Hit reply and tell us what's making tracking easy, or what's getting in the way. A real human reads every reply.
                </p>
            </td>
        </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;">
        <tr>
            <td style="font-size:12px;color:#94a3b8;line-height:1.65;text-align:center;">
                You'll receive this weekly streak report. You can disable it anytime in your
                <a href="{{ $settingsUrl }}" style="color:#64748b;text-decoration:underline;">notification settings</a>.
            </td>
        </tr>
    </table>
@endsection
