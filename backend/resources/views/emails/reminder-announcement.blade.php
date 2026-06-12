@extends('emails._layout', [
    'eyebrow' => 'New feature',
])

@section('content')
    <div style="display:inline-block;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#94a3b8;margin:0 0 14px;">
        Daily reminders
    </div>

    <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:#0f172a;">
        Hey {{ $firstName }},<br>set a daily reminder for your expenses.
    </h1>

    <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">
        You can now tell Pasona to send you a daily email (or push notification on Android) to remind you to log your transactions. No more end-of-the-month guesswork — just a gentle nudge at the time you pick.
    </p>

    @include('emails._button', ['url' => $settingsUrl, 'label' => 'Set your reminder time'])

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;margin:20px 0;">
        <tr>
            <td style="padding:18px 20px;">
                <p style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;color:#94a3b8;margin:0 0 10px;">How it works</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td valign="top" style="width:34px;padding:0 12px 12px 0;">
                            <div style="width:24px;height:24px;border-radius:9999px;background:#0f172a;color:#ffffff;font-size:12px;font-weight:800;line-height:24px;text-align:center;">1</div>
                        </td>
                        <td style="padding:0 0 12px 0;">
                            <p style="margin:0 0 2px;font-size:14px;font-weight:800;color:#0f172a;">Log in</p>
                            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Open the Pasona app and sign in to your account.</p>
                        </td>
                    </tr>
                    <tr>
                        <td valign="top" style="width:34px;padding:0 12px 12px 0;">
                            <div style="width:24px;height:24px;border-radius:9999px;background:#0f172a;color:#ffffff;font-size:12px;font-weight:800;line-height:24px;text-align:center;">2</div>
                        </td>
                        <td style="padding:0 0 12px 0;">
                            <p style="margin:0 0 2px;font-size:14px;font-weight:800;color:#0f172a;">Go to Settings</p>
                            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Tap the settings gear icon at the bottom of the dashboard.</p>
                        </td>
                    </tr>
                    <tr>
                        <td valign="top" style="width:34px;padding:0 12px 12px 0;">
                            <div style="width:24px;height:24px;border-radius:9999px;background:#0f172a;color:#ffffff;font-size:12px;font-weight:800;line-height:24px;text-align:center;">3</div>
                        </td>
                        <td style="padding:0 0 12px 0;">
                            <p style="margin:0 0 2px;font-size:14px;font-weight:800;color:#0f172a;">Turn on the reminder</p>
                            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Flip the Daily Reminder toggle to <strong style="color:#0f172a;">On</strong>.</p>
                        </td>
                    </tr>
                    <tr>
                        <td valign="top" style="width:34px;padding:0;">
                            <div style="width:24px;height:24px;border-radius:9999px;background:#0f172a;color:#ffffff;font-size:12px;font-weight:800;line-height:24px;text-align:center;">4</div>
                        </td>
                        <td style="padding:0;">
                            <p style="margin:0 0 2px;font-size:14px;font-weight:800;color:#0f172a;">Set your time</p>
                            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Pick the time that works for you. That's it — you're all set.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 12px;">
        We've picked <strong style="color:#0f172a;">9:10 PM</strong> as the default — right after dinner, when most people like to catch up. But you can change it anytime from Settings.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:0;">
        <tr>
            <td style="padding:14px 18px;font-size:12px;color:#64748b;line-height:1.65;">
                <strong style="color:#0f172a;">Already using Pasona?</strong> Just head to <a href="{{ $settingsUrl }}" style="color:#475569;text-decoration:underline;">Settings</a>, enable the reminder, and pick your time. No need to do anything else.
            </td>
        </tr>
    </table>
@endsection
