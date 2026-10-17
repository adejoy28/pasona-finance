<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>Pasona &middot; Happy Democracy Day</title>
  </head>

  <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#334155;-webkit-font-smoothing:antialiased;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;width:100%;">
      <tr>
        <td align="center" style="padding:20px 12px;">

          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">

            {{-- HERO: Flag background covering brand + headline --}}
            <tr>
              <td background="https://pasona-api.adebayosystems.com.ng/img/email-header-bg.jpg"
                style="background-color:#1e3a8a;background-image:url('https://pasona-api.adebayosystems.com.ng/img/email-header-bg.jpg');background-size:cover;background-position:center;color:#ffffff;border-radius:24px 24px 0 0;padding:0;">

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:rgba(30,58,138,0.72);">
                  <tr>
                    <td style="padding:34px 28px 40px;">

                      {{-- Logo --}}
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="vertical-align:middle;padding:0 10px 0 0;">
                            <div style="width:32px;height:32px;border-radius:9px;background:#0ea5e9;background:linear-gradient(135deg,#0ea5e9 0%,#2563eb 100%);display:inline-block;line-height:32px;text-align:center;color:#ffffff;font-weight:900;font-size:16px;letter-spacing:-0.02em;box-shadow:0 8px 20px -6px rgba(14,165,233,0.45);">P.</div>
                          </td>
                          <td style="vertical-align:middle;">
                            <div style="font-weight:900;font-size:17px;letter-spacing:-0.02em;color:#ffffff;line-height:1.2;">
                              Pasona<span style="color:#bfdbfe;">.</span>
                            </div>
                            <div style="margin-top:6px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#bfdbfe;">
                              June 12
                            </div>
                          </td>
                        </tr>
                      </table>

                      {{-- Headline --}}
                      <div style="display:inline-block;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#bfdbfe;margin-top:24px;">
                        Happy Democracy Day &#x1F1F3;&#x1F1EC;
                      </div>

                      <h1 style="margin:8px 0 0;font-size:28px;line-height:1.25;font-weight:900;letter-spacing:-0.02em;color:#ffffff;">
                        Freedom includes<br>knowing your naira.
                      </h1>

                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            {{-- WHITE CONTENT CARD --}}
            <tr>
              <td style="background:#ffffff;border:1px solid #f1f5f9;border-top:none;border-radius:0 0 24px 24px;padding:24px 24px 24px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -2px rgba(0,0,0,0.05),0 20px 25px -5px rgba(0,0,0,0.02);">

                <p style="margin:0 0 16px;color:#64748b;font-size:14px;line-height:1.6;">
                  Today we remember what June 12, 1993 stood for &mdash; the right of Nigerians to choose their own future. That spirit runs deeper than politics. It's about agency. The freedom to decide what happens in your own life.
                </p>

                <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">
                  That's why we built Pasona. Because knowing exactly where your money is &mdash; across Kuda, OPay, Sterling, and everywhere else &mdash; is a form of freedom most people don't have. You do.
                </p>

                {{-- Feature section --}}
                <div style="display:inline-block;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#94a3b8;margin:0 0 16px;">
                  New today
                </div>

                @include('emails._feature', [
                    'tint'  => 'blue',
                    'icon'  => '&times;',
                    'title' => 'Delete your account &amp; remove all your data',
                    'body'  => 'You can now permanently delete your Pasona account from Settings. When you do, everything goes with it &mdash; your profile, every linked account, every transaction, every naira figure we ever stored. No backup. No waiting period. Gone, because you said so.',
                ])

                <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 20px;">
                  Data ownership is part of financial freedom. You should be able to walk away from any tool &mdash; including ours &mdash; and take nothing with you except what's in your own head. That's what today's update gives you.
                </p>

                @include('emails._button', [
                    'url'   => config('app.url'),
                    'label' => 'Open Pasona',
                ])

                <p style="font-size:14px;line-height:1.7;color:#475569;margin:0;">
                  Happy Democracy Day,<br>
                  <strong style="color:#0f172a;">The Pasona crew</strong>
                </p>

              </td>
            </tr>

            {{-- FOOTER --}}
            <tr>
              <td align="center" style="padding:16px 12px 0;font-size:12px;color:#94a3b8;line-height:1.7;">
                <p style="font-weight:900;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#94a3b8;margin:0 0 6px;">
                  Pasona &middot; Know your naira
                </p>
                <p style="margin:0;">
                  You're getting this because you have an account at pasona.adebayosystems.com.ng.<br>
                  <a href="{{ $settingsUrl ?? '#' }}" style="color:#64748b;text-decoration:underline;">Notification settings</a>
                  &nbsp;&middot;&nbsp;
                  <a href="{{ $unsubscribeUrl ?? '#' }}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>
                </p>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
</html>
