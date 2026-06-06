@extends('emails._layout', [
    'eyebrow' => 'One last step',
])

@section('content')
    <div style="display:inline-block;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#94a3b8;margin:0 0 14px;">
        Verify your email
    </div>

    <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:#0f172a;">
        Hey {{ $firstName }}, let's verify your email.
    </h1>

    <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">
        You're one click away from full access to Pasona. Confirm <strong style="color:#0f172a;">{{ $email }}</strong> and you're set.
    </p>

    @include('emails._button', ['url' => $actionUrl, 'label' => 'Verify my email'])

    <p style="font-size:12px;color:#94a3b8;text-align:center;margin:4px 0 0;">
        This link is good for <strong style="color:#475569;">60 minutes</strong>. After that, request a fresh one from your Pasona settings.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
        <tr><td style="border-top:1px solid #e2e8f0;line-height:1px;font-size:1px;">&nbsp;</td></tr>
    </table>

    {{-- "What you get" panel --}}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;margin:0 0 20px;">
        <tr>
            <td style="padding:18px 20px;">
                <p style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;color:#94a3b8;margin:0 0 10px;">What you get</p>

                @include('emails._feature', [
                    'tint'  => 'emerald',
                    'icon'  => '&#8358;',
                    'title' => 'Track every naira',
                    'body'  => 'Income, expenses, transfers — all in one place.',
                ])
                @include('emails._feature', [
                    'tint'  => 'blue',
                    'icon'  => '&#127974;',
                    'title' => 'All your accounts, unified',
                    'body'  => 'GTBank, OPay, Kuda, cash in your wallet.',
                ])
                @include('emails._feature', [
                    'tint'  => 'amber',
                    'icon'  => '&#128229;',
                    'title' => 'Drop in a bank statement',
                    'body'  => 'We handle the parsing and flag duplicates.',
                ])
                @include('emails._feature', [
                    'tint'  => 'purple',
                    'icon'  => '&#128202;',
                    'title' => 'Reports that make sense',
                    'body'  => 'Monthly summaries and category breakdowns.',
                ])
            </td>
        </tr>
    </table>

    <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 12px;">
        Didn't sign up for Pasona? No worries — just ignore this message and nothing happens to your inbox.<br><br>
        Talk soon,<br>
        <strong style="color:#0f172a;">The Pasona team</strong>
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:0;">
        <tr>
            <td style="padding:14px 18px;font-size:12px;color:#64748b;line-height:1.65;word-break:break-all;">
                Having trouble with the button? Paste this URL into your browser:<br>
                <a href="{{ $actionUrl }}" style="color:#475569;text-decoration:underline;">{{ $actionUrl }}</a>
            </td>
        </tr>
    </table>
@endsection
