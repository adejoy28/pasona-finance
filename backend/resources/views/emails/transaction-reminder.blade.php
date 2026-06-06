@extends('emails._layout', [
    'eyebrow' => 'Daily money minute',
])

@section('content')
    <div style="display:inline-block;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#94a3b8;margin:0 0 14px;">
        {{ $greeting }}, {{ $user->name }} &#x1F44B;
    </div>

    <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:#0f172a;">
        @if ($loggedToday)
            Quick gut-check time.
        @else
            It's {{ $reminderTime }} &mdash; log today's transactions.
        @endif
    </h1>

    <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">
        @if ($loggedToday)
            You already wrapped up today's logging — nice. This is your friendly nudge to do a quick gut-check before the day ends. Anything missing from the <strong style="color:#0f172a;">{{ $count }} transaction{{ $count === 1 ? '' : 's' }}</strong> you logged? A tip, a taxi, that 2 a.m. order?
        @else
            It's <strong style="color:#0f172a;">{{ $reminderTime }}</strong> — your self-imposed money minute. The Pasona app isn't on the Play Store just yet, but your books don't care about that. Open the web app and log the day in under two minutes.
        @endif
    </p>

    {{-- Two-up stat tiles: In today / Out today --}}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
        <tr>
            <td valign="top" style="width:50%;padding:0 6px 0 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:18px;">
                    <tr>
                        <td style="padding:18px;">
                            <p style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#059669;margin:0 0 4px;">In today</p>
                            <p style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#0f172a;margin:0;line-height:1.15;">
                                @if ($todayIncome > 0)
                                    &#8358;{{ number_format($todayIncome, 2) }}
                                @else
                                    &mdash;
                                @endif
                            </p>
                            <p style="font-size:12px;color:#64748b;margin:4px 0 0;">across income sources</p>
                        </td>
                    </tr>
                </table>
            </td>
            <td valign="top" style="width:50%;padding:0 0 0 6px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff1f2;border:1px solid #ffe4e6;border-radius:18px;">
                    <tr>
                        <td style="padding:18px;">
                            <p style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#e11d48;margin:0 0 4px;">Out today</p>
                            <p style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#0f172a;margin:0;line-height:1.15;">
                                @if ($todayExpense > 0)
                                    &#8358;{{ number_format($todayExpense, 2) }}
                                @else
                                    &mdash;
                                @endif
                            </p>
                            <p style="font-size:12px;color:#64748b;margin:4px 0 0;">
                                across {{ $accountsCount }} {{ \Illuminate\Support\Str::plural('account', $accountsCount) }}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    @include('emails._button', ['url' => $addUrl, 'label' => "Log today's transactions"])

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
        <tr><td style="border-top:1px solid #e2e8f0;line-height:1px;font-size:1px;">&nbsp;</td></tr>
    </table>

    {{-- Three-step panel --}}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;margin:0 0 20px;">
        <tr>
            <td style="padding:18px 20px;">
                <p style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;color:#94a3b8;margin:0 0 10px;">Two-minute version</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td valign="top" style="width:34px;padding:0 12px 12px 0;">
                            <div style="width:24px;height:24px;border-radius:9999px;background:#2563eb;color:#ffffff;font-size:12px;font-weight:800;line-height:24px;text-align:center;">1</div>
                        </td>
                        <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:1.5;color:#334155;">Open <a href="{{ $appUrl }}" style="color:#2563eb;text-decoration:underline;">{{ $appUrl }}</a></td>
                    </tr>
                    <tr>
                        <td valign="top" style="width:34px;padding:0 12px 12px 0;">
                            <div style="width:24px;height:24px;border-radius:9999px;background:#059669;color:#ffffff;font-size:12px;font-weight:800;line-height:24px;text-align:center;">2</div>
                        </td>
                        <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:1.5;color:#334155;">Tap <strong style="color:#0f172a;">+ New transaction</strong></td>
                    </tr>
                    <tr>
                        <td valign="top" style="width:34px;padding:0 12px 0 0;">
                            <div style="width:24px;height:24px;border-radius:9999px;background:#d97706;color:#ffffff;font-size:12px;font-weight:800;line-height:24px;text-align:center;">3</div>
                        </td>
                        <td valign="top" style="padding:0;font-size:14px;line-height:1.5;color:#334155;">Pick the account, drop the amount, hit save</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 12px;">
        Do that for the small stuff <em>now</em> and you'll never have to do the "where did all my money go" autopsy later. That's the whole game.<br><br>
        See you tomorrow,<br>
        <strong style="color:#0f172a;">The Pasona crew</strong>
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:0;">
        <tr>
            <td style="padding:14px 18px;font-size:12px;color:#64748b;line-height:1.65;">
                Don't want these pings? Update your reminder time (or turn them off) in your <a href="{{ $settingsUrl }}" style="color:#475569;text-decoration:underline;">Pasona settings</a>.
            </td>
        </tr>
    </table>
@endsection
