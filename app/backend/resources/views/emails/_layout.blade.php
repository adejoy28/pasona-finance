{{--
    Shared email layout — every Pasona email extends this.
    Optimized for modern deliverability, dark mode resilience, and visual hierarchy.
--}}
@props([
    'title'          => 'Pasona',
    'previewText'    => null,
    'eyebrow'        => null,
    'settingsUrl'    => null,
    'unsubscribeUrl' => null,
])

@php
    $frontendUrl    = rtrim((string) config('app.frontend_url', 'https://pasona.adebayosystems.com.ng'), '/');
    $settingsUrl    = $settingsUrl ?: ($frontendUrl . '/settings/notifications');
    $unsubscribeUrl = $unsubscribeUrl ?: ($frontendUrl . '/settings/notifications#unsubscribe');
@endphp

<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>{{ $title }}</title>
  </head>

  <body
    style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#334155;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

    {{-- Preheader / Inbox Preview Text (hidden with anti-trailing snippet whitespace) --}}
    @if ($previewText)
      <div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;font-family:sans-serif;">
        {{ $previewText }}
        &#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;
      </div>
    @endif

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#f1f5f9;width:100%;margin:0;padding:0;">
      <tr>
        <td align="center" style="padding:28px 12px 36px;">

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="width:100%;max-width:580px;border-collapse:separate;">

            @include('emails._brand-strip', ['eyebrow' => $eyebrow ?? null])

            {{-- White Content Card --}}
            <tr>
              <td
                style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 20px 20px;padding:28px 32px 32px;
                       box-shadow:0 4px 6px -1px rgba(0,0,0,0.04), 0 2px 4px -2px rgba(0,0,0,0.03);">
                @yield('content')
              </td>
            </tr>

            {{-- Compliant Deliverability Footer --}}
            <tr>
              <td align="center" style="padding:24px 16px 0;font-size:12px;color:#64748b;line-height:1.7;">
                <p style="font-weight:800;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#94a3b8;margin:0 0 8px;">
                  Pasona &middot; Know Your Naira
                </p>
                <p style="margin:0 0 8px;">
                  You received this email because you have an account at <a href="{{ $frontendUrl }}" style="color:#475569;text-decoration:none;font-weight:600;">pasona.adebayosystems.com.ng</a>.
                </p>
                <p style="margin:0;">
                  <a href="{{ $settingsUrl }}" style="color:#2563eb;text-decoration:underline;">Notification Settings</a>
                  &nbsp;&middot;&nbsp;
                  <a href="{{ $unsubscribeUrl }}" style="color:#2563eb;text-decoration:underline;">Unsubscribe</a>
                </p>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>

</html>