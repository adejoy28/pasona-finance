@extends('emails._layout', [
    'eyebrow' => 'Daily money minute',
])

@section('content')
    <div style="display:flex;align-items:center;justify-content:space-between;margin:0 0 14px;">
        <span style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#94a3b8;">
            {{ $greeting }} &#x1F44B;
        </span>
        @if (isset($streak) && $streak >= 2)
            <span style="display:inline-block;padding:3px 10px;border-radius:9999px;background:#fef3c7;color:#b45309;font-size:11px;font-weight:800;letter-spacing:0.04em;">
                &#x1F525; {{ $streak }}-day streak
            </span>
        @endif
    </div>

    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:800;letter-spacing:-0.02em;color:#0f172a;">
        {{ $headline ?? "Log today's transactions" }}
    </h1>

    <p style="margin:0 0 22px;color:#64748b;font-size:14px;line-height:1.6;">
        {{ $subtext ?? "Open Pasona and log the day in under two minutes." }}
    </p>

    {{-- Two-up stat tiles: In today / Out today --}}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
        <tr>
            <td valign="top" style="width:50%;padding:0 6px 0 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:16px;">
                    <tr>
                        <td style="padding:16px;">
                            <p style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#059669;margin:0 0 4px;">In today</p>
                            <p style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#0f172a;margin:0;line-height:1.15;">
                                @if ($todayIncome > 0)
                                    &#8358;{{ number_format($todayIncome, 2) }}
                                @else
                                    &mdash;
                                @endif
                            </p>
                            <p style="font-size:11px;color:#64748b;margin:4px 0 0;">across income</p>
                        </td>
                    </tr>
                </table>
            </td>
            <td valign="top" style="width:50%;padding:0 0 0 6px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff1f2;border:1px solid #ffe4e6;border-radius:16px;">
                    <tr>
                        <td style="padding:16px;">
                            <p style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#e11d48;margin:0 0 4px;">Out today</p>
                            <p style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#0f172a;margin:0;line-height:1.15;">
                                @if ($todayExpense > 0)
                                    &#8358;{{ number_format($todayExpense, 2) }}
                                @else
                                    &mdash;
                                @endif
                            </p>
                            <p style="font-size:11px;color:#64748b;margin:4px 0 0;">
                                across {{ $accountsCount }} {{ \Illuminate\Support\Str::plural('account', $accountsCount) }}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    @include('emails._button', ['url' => $addUrl, 'label' => "Log today's transactions"])

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;">
        <tr><td style="border-top:1px solid #e2e8f0;line-height:1px;font-size:1px;">&nbsp;</td></tr>
    </table>

    {{-- Daily Money Fact Card --}}
    @if (isset($dailyFact))
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f172a;border-radius:16px;margin:0 0 24px;color:#ffffff;overflow:hidden;">
        <tr>
            <td style="padding:22px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="padding:0 0 10px;">
                            <span style="display:inline-block;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#38bdf8;background:rgba(56,189,248,0.12);padding:4px 10px;border-radius:9999px;">
                                &#x1F4A1; Daily Money Fact &bull; {{ $dailyFact['category'] }}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 0 8px;">
                            <h3 style="margin:0;font-size:16px;font-weight:800;color:#ffffff;line-height:1.35;">
                                {{ $dailyFact['title'] }}
                            </h3>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 0 12px;font-size:13px;line-height:1.65;color:#cbd5e1;">
                            {{ $dailyFact['fact'] }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:10px 14px;background:rgba(255,255,255,0.06);border-left:3px solid #38bdf8;border-radius:6px;font-size:12px;line-height:1.55;color:#e2e8f0;">
                            <strong style="color:#ffffff;">The Takeaway:</strong> {{ $dailyFact['take'] }}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    @endif

    <p style="font-size:13px;line-height:1.65;color:#64748b;margin:0 0 16px;">
        Track the small stuff daily and you'll never have to do a "where did all my money go" autopsy at month-end.<br><br>
        See you tomorrow,<br>
        <strong style="color:#0f172a;">The Pasona crew</strong>
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:0;">
        <tr>
            <td style="padding:12px 16px;font-size:11px;color:#94a3b8;line-height:1.6;">
                Don't want these reminders or want to change frequency? Update in your <a href="{{ $settingsUrl }}" style="color:#64748b;text-decoration:underline;">Pasona settings</a>.
            </td>
        </tr>
    </table>
@endsection
