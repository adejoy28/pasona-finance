{{--
    The Pasona brand header that sits at the top of every email card.
    Uses the official Pasona logo, styled with resilient typography fallback
    if images are blocked by the mail client.
--}}
@props(['eyebrow' => null])

@php
    $frontendUrl = rtrim((string) config('app.frontend_url', 'https://pasona.adebayosystems.com.ng'), '/');
    $logoUrl     = $frontendUrl . '/img/brand-name-logo-light.png';
@endphp

<!-- Brand Accent Top Bar -->
<tr>
  <td style="background:#2563eb;background:linear-gradient(90deg,#2563eb 0%,#3b82f6 50%,#4f46e5 100%);height:4px;line-height:4px;font-size:4px;border-radius:20px 20px 0 0;padding:0;">
    &nbsp;
  </td>
</tr>

<!-- Brand Header Bar -->
<tr>
  <td style="background:#ffffff;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:24px 28px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td valign="middle" align="left" style="padding:0;">
          <a href="{{ $frontendUrl }}" target="_blank" style="text-decoration:none;display:inline-block;">
            <img src="{{ $logoUrl }}"
                 alt="Pasona"
                 width="128"
                 height="34"
                 style="display:block;border:0;outline:none;text-decoration:none;max-height:36px;width:auto;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:22px;font-weight:900;color:#0f172a;letter-spacing:-0.03em;" />
          </a>
        </td>
        @if ($eyebrow)
          <td valign="middle" align="right" style="padding:0;">
            <span style="display:inline-block;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;padding:5px 12px;border-radius:9999px;border:1px solid #dbeafe;white-space:nowrap;">
              {{ $eyebrow }}
            </span>
          </td>
        @endif
      </tr>
    </table>
    <div style="height:1px;background:#f1f5f9;margin-top:18px;line-height:1px;font-size:1px;">&nbsp;</div>
  </td>
</tr>