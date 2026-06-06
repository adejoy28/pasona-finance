{{--
    Primary CTA button — gradient + blue glow. The gradient has a solid
    color fallback for Outlook (Word renderer). Pass $url and $label.
--}}
@props(['url' => '#', 'label' => 'Continue'])

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;">
  <tr>
    <td align="center" style="padding:0;">
      <a href="{{ $url }}"
         style="display:block;background:#1d4ed8;background:linear-gradient(135deg,#1d4ed8 0%,#1e3a8a 100%);color:#ffffff !important;text-decoration:none;padding:13px 24px;border-radius:14px;font-size:14px;font-weight:800;letter-spacing:0.02em;text-align:center;box-shadow:0 10px 25px -5px rgba(37,99,235,0.35);mso-padding-alt:0;">
        {{ $label }} &rarr;
      </a>
    </td>
  </tr>
</table>
