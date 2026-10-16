{{--
    High-Conversion Primary CTA Button
    Designed with bulletproof Outlook VML/table support, 48px touch targets,
    and high-contrast modern styling for maximum click-through rates.
--}}
@props([
    'url'     => '#',
    'label'   => 'Get Started',
    'subtext' => null,
])

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 16px;">
  <tr>
    <td align="center" style="padding:0;">
      <!-- Main CTA Button -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;width:100%;max-width:440px;">
        <tr>
          <td align="center" style="border-radius:14px;background:#2563eb;box-shadow:0 10px 25px -5px rgba(37,99,235,0.4),0 4px 6px -2px rgba(37,99,235,0.2);">
            <a href="{{ $url }}" target="_blank"
               style="display:block;box-sizing:border-box;width:100%;background:#2563eb;background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);border:1px solid #1d4ed8;border-radius:14px;padding:15px 28px;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:800;color:#ffffff !important;text-decoration:none;text-align:center;letter-spacing:0.02em;line-height:1.2;">
              {{ $label }} &nbsp;&rarr;
            </a>
          </td>
        </tr>
      </table>

      @if ($subtext)
        <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;font-weight:500;text-align:center;letter-spacing:0.01em;">
          {{ $subtext }}
        </p>
      @endif
    </td>
  </tr>
</table>
