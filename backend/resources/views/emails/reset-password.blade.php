@extends('emails._layout', [
    'eyebrow' => 'Account security',
])

@section('content')
    <div style="display:inline-block;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#94a3b8;margin:0 0 14px;">
        Locking things back down
    </div>

    <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:#0f172a;">
        Hey {{ $notifiable->name ?? 'there' }} &#x1F512;
    </h1>

    <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">
        Someone (hopefully you) just asked to reset the Pasona password for
        <strong style="color:#0f172a;">{{ $notifiable->getEmailForPasswordReset() }}</strong>.
        If that was you, use the button below to pick a new one.
    </p>

    @include('emails._button', ['url' => $actionUrl, 'label' => 'Reset my password'])

    <p style="font-size:12px;color:#94a3b8;text-align:center;margin:4px 0 0;">
        This link expires in <strong style="color:#475569;">60 minutes</strong>, so don't sit on it.
    </p>

    {{-- Rose alert: didn't request this? --}}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff1f2;border:1px solid #ffe4e6;border-radius:16px;margin:28px 0 0;">
        <tr>
            <td style="padding:14px 18px;">
                <p style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#e11d48;margin:0 0 4px;">Didn't request this?</p>
                <p style="font-size:13px;color:#881337;line-height:1.65;margin:0;">
                    If you didn't ask for a reset, you can safely ignore this email — your password will stay exactly as it is. If you see repeated resets you didn't trigger, <a href="mailto:security@adebayosystems.com.ng" style="color:#9f1239;text-decoration:underline;">let us know</a> so we can lock things down.
                </p>
            </td>
        </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
        <tr><td style="border-top:1px solid #e2e8f0;line-height:1px;font-size:1px;">&nbsp;</td></tr>
    </table>

    {{-- Indigo panel: security reminders --}}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2ff;border:1px solid #e0e7ff;border-radius:16px;margin:0 0 20px;">
        <tr>
            <td style="padding:18px 20px;">
                <p style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;color:#4f46e5;margin:0 0 10px;">A quick reminder</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td valign="top" style="width:34px;padding:0 12px 12px 0;">
                            <div style="width:24px;height:24px;border-radius:9999px;background:#2563eb;color:#ffffff;font-size:14px;line-height:24px;text-align:center;">&#x1F511;</div>
                        </td>
                        <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:1.5;color:#334155;">Pasona will <strong style="color:#0f172a;">never</strong> ask for your password in an email or DM.</td>
                    </tr>
                    <tr>
                        <td valign="top" style="width:34px;padding:0 12px 12px 0;">
                            <div style="width:24px;height:24px;border-radius:9999px;background:#059669;color:#ffffff;font-size:14px;line-height:24px;text-align:center;">&#x2705;</div>
                        </td>
                        <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:1.5;color:#334155;">Use a password manager — your future self will thank you.</td>
                    </tr>
                    <tr>
                        <td valign="top" style="width:34px;padding:0 12px 0 0;">
                            <div style="width:24px;height:24px;border-radius:9999px;background:#d97706;color:#ffffff;font-size:14px;line-height:24px;text-align:center;">&#x26A0;&#xFE0F;</div>
                        </td>
                        <td valign="top" style="padding:0;font-size:14px;line-height:1.5;color:#334155;">Public Wi-Fi + password resets = bad combo. Wait till you're home.</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 12px;">
        Stay safe,<br>
        <strong style="color:#0f172a;">The Pasona crew</strong>
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:0;">
        <tr>
            <td style="padding:14px 18px;font-size:12px;color:#64748b;line-height:1.65;word-break:break-all;">
                Button not cooperating? Paste this URL into your browser:<br>
                <a href="{{ $actionUrl }}" style="color:#475569;text-decoration:underline;">{{ $actionUrl }}</a>
            </td>
        </tr>
    </table>
@endsection
