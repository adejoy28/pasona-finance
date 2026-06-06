@extends('emails._layout', [
    'eyebrow' => 'Welcome aboard',
])

@section('content')
    {{-- Eyebrow tag --}}
    <div style="display:inline-block;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#94a3b8;margin:0 0 14px;">
        You're in
    </div>

    {{-- H1 --}}
    <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:#0f172a;">
        Hey {{ $firstName }},<br>your finances just got clearer.
    </h1>

    {{-- Lede --}}
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">
        You made a small but mighty decision today — from here, you'll always know exactly where your naira goes.
    </p>

    {{-- "Your first two minutes" panel --}}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;margin:0 0 20px;">
        <tr>
            <td style="padding:18px 20px;">
                <p style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;color:#94a3b8;margin:0 0 10px;">Your first two minutes</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td valign="top" style="width:34px;padding:0 12px 12px 0;">
                            <div style="width:24px;height:24px;border-radius:9999px;background:#0f172a;color:#ffffff;font-size:12px;font-weight:800;line-height:24px;text-align:center;">1</div>
                        </td>
                        <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:1.5;color:#334155;">Add your first account — <strong style="color:#0f172a;">cash, bank, or mobile money, all welcome</strong></td>
                    </tr>
                    <tr>
                        <td valign="top" style="width:34px;padding:0 12px 12px 0;">
                            <div style="width:24px;height:24px;border-radius:9999px;background:#0f172a;color:#ffffff;font-size:12px;font-weight:800;line-height:24px;text-align:center;">2</div>
                        </td>
                        <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:1.5;color:#334155;">Log a transaction or two — even the <strong style="color:#0f172a;">small &#8358;500 ones</strong> count</td>
                    </tr>
                    <tr>
                        <td valign="top" style="width:34px;padding:0 12px 0 0;">
                            <div style="width:24px;height:24px;border-radius:9999px;background:#0f172a;color:#ffffff;font-size:12px;font-weight:800;line-height:24px;text-align:center;">3</div>
                        </td>
                        <td valign="top" style="padding:0;font-size:14px;line-height:1.5;color:#334155;">Open the dashboard and watch your <strong style="color:#0f172a;">money's story take shape</strong></td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    @include('emails._button', ['url' => $dashboardUrl, 'label' => 'Take me to my dashboard'])

    {{-- Divider --}}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
        <tr><td style="border-top:1px solid #e2e8f0;line-height:1px;font-size:1px;">&nbsp;</td></tr>
    </table>

    {{-- Features section --}}
    <div style="display:inline-block;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#94a3b8;margin:0 0 16px;">
        What you can do with Pasona
    </div>

    @include('emails._feature', [
        'tint'  => 'emerald',
        'icon'  => '&#8358;',
        'title' => 'Track every naira',
        'body'  => 'Income, expenses, transfers — logged in one place, nothing slipping through.',
    ])
    @include('emails._feature', [
        'tint'  => 'blue',
        'icon'  => '&#127974;',
        'title' => 'All your accounts, unified',
        'body'  => 'GTBank, OPay, Kuda, cash in your wallet — see the full picture at once.',
    ])
    @include('emails._feature', [
        'tint'  => 'amber',
        'icon'  => '&#128229;',
        'title' => 'Drop in a bank statement',
        'body'  => 'Export from your banking app, paste it in — we handle the parsing and flag duplicates.',
    ])
    @include('emails._feature', [
        'tint'  => 'purple',
        'icon'  => '&#128202;',
        'title' => 'Reports that actually make sense',
        'body'  => 'Monthly summaries and category breakdowns — no spreadsheet skills required.',
    ])

    {{-- Verify amber alert --}}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border:1px solid #fef3c7;border-radius:14px;margin:0 0 20px;">
        <tr>
            <td style="padding:14px 18px;">
                <p style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#d97706;margin:0 0 4px;">One step left</p>
                <p style="font-size:13px;color:#78350f;line-height:1.65;margin:0;">
                    We sent a verification email to <strong style="color:#451a03;">{{ $email }}</strong>. Click the link in that email to fully unlock your account. If it doesn't land within two minutes, check spam or hit the <strong style="color:#451a03;">resend verification</strong> link in your settings.
                </p>
            </td>
        </tr>
    </table>

    {{-- Signoff --}}
    <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 12px;">
        Got a question, a problem, or just want to say hi? Hit reply — a real human reads every one of these (mostly John, the founder).<br><br>
        Welcome to the crew,<br>
        <strong style="color:#0f172a;">The Pasona team</strong>
    </p>

    {{-- Subcopy --}}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:0;">
        <tr>
            <td style="padding:14px 18px;font-size:12px;color:#64748b;line-height:1.65;word-break:break-all;">
                This is your welcome email — the only automated message we'll send that isn't a transaction reminder or a security alert. You can manage notification preferences anytime in your <a href="{{ $settingsUrl }}" style="color:#475569;text-decoration:underline;">Pasona account settings</a>.
            </td>
        </tr>
    </table>
@endsection
