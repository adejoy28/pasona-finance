{{--
    The gradient brand strip that sits above every email card.
    Decorative "blob" circles are real <div> elements (not ::before/::after)
    so they survive the CSS-inliner pass for Gmail/Outlook compatibility.
    The gradient has a solid color fallback for Outlook (Word renderer).
    When a real logo is dropped into public/img/, swap the .brand-tile div
    below for an <img> with the same 44×44 size.
--}}
@props(['eyebrow' => null])

<tr>
  {{-- Swapped this for config --}}
  <td background="{{ config('app.url') }}/img/email-header-bg.jpg"
    style="background-color:#2563eb;background-image:url('{{ config('app.url') }}/img/email-header-bg.jpg');background-size:cover;background-position:center;color:#ffffff;border-radius:24px 24px 0 0;padding:0;">
    {{-- <td
    style="background:#2563eb;background:linear-gradient(135deg,#2563eb 0%,#4f46e5 100%);color:#ffffff;border-radius:24px 24px 0 0;padding:0;overflow:hidden;"> --}}
    {{-- style="background:#2563eb;background:linear-gradient(135deg,#2563eb 0%,#4f46e5 100%);color:#ffffff;border-radius:24px 24px 0 0;padding:0;position:relative;overflow:hidden;"> --}}

    {{-- Decorative blobs (real elements, not pseudo) --}}
    {{-- <div
      style="position:absolute;right:-40px;top:-50px;width:160px;height:160px;border-radius:9999px;background:rgba(255,255,255,0.10);pointer-events:none;">
    </div>
    <div
      style="position:absolute;right:40px;bottom:-40px;width:100px;height:100px;border-radius:9999px;background:rgba(255,255,255,0.06);pointer-events:none;">
    </div> --}}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
      <tr>
        <td style="padding:34px 24px 12px;">

          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:middle;padding:0 10px 0 0;">
                <div
                  style="width:32px;height:32px;border-radius:9px;background:#0ea5e9;background:linear-gradient(135deg,#0ea5e9 0%,#2563eb 100%);display:inline-block;line-height:32px;text-align:center;color:#ffffff;font-weight:900;font-size:16px;letter-spacing:-0.02em;box-shadow:0 8px 20px -6px rgba(14,165,233,0.45);">
                  P.</div>
              </td>
              <td style="vertical-align:middle;">
                <div style="font-weight:900;font-size:17px;letter-spacing:-0.02em;color:#ffffff;line-height:1.2;">
                  Pasona<span style="color:#bfdbfe;">.</span>
                </div>
              </td>
            </tr>
          </table>

          @if ($eyebrow)
          <div
            style="margin-top:10px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;color:#bfdbfe;">
            {{ $eyebrow }}
          </div>
          @endif

        </td>
      </tr>
    </table>

  </td>
</tr>