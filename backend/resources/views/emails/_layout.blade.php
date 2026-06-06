{{--
    Shared email layout — every Pasona email extends this.

    Important: Gmail and most webmail clients strip <style> blocks, so
    the App\Providers\AppServiceProvider mail listener runs every outgoing
    HTML body through TijsVerkoyen\CssToInlineStyles to inline the rules
    below and then removes the <style> block. That means:
      - The CSS below MUST use raw hex values (no var() — those don't get
        resolved by the inliner).
      - The CSS below MUST NOT use pseudo-elements (::before/::after) —
        the inliner can't apply them.
      - Outlook ignores linear-gradient, so every gradient gets a solid
        color fallback on the line before it.
    The inliner also strips @media queries, so the design is desktop-first
    (still readable on mobile; responsive polish can come later).
--}}
@props([
    'title'       => 'Pasona',
    'previewText' => null,
])

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>{{ $title }}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#334155;-webkit-font-smoothing:antialiased;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;width:100%;">
    <tr>
      <td align="center" style="padding:20px 12px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">

          @include('emails._brand-strip', ['eyebrow' => $eyebrow ?? null])

          {{-- White content card --}}
          <tr>
            <td style="background:#ffffff;border:1px solid #f1f5f9;border-top:none;border-radius:0 0 24px 24px;padding:24px 24px 24px;
                       box-shadow:0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05), 0 20px 25px -5px rgba(0,0,0,0.02);">
              @yield('content')
            </td>
          </tr>

          {{-- Footer --}}
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
