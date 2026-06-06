{{--
    Feature row — colored icon tile + heading + body. Tints: blue | emerald | amber | purple | rose | indigo.
    Tints map to Tailwind-ish hex pairs: bg #50, fg #600. Inline styles only
    for Gmail/Outlook compatibility.
--}}
@props([
    'tint'  => 'blue',
    'icon'  => null,
    'title' => '',
    'body'  => '',
])

@php
    $tints = [
        'blue'    => ['bg' => '#eff6ff', 'fg' => '#2563eb'],
        'emerald' => ['bg' => '#ecfdf5', 'fg' => '#059669'],
        'amber'   => ['bg' => '#fffbeb', 'fg' => '#d97706'],
        'purple'  => ['bg' => '#faf5ff', 'fg' => '#9333ea'],
        'rose'    => ['bg' => '#fff1f2', 'fg' => '#e11d48'],
        'indigo'  => ['bg' => '#eef2ff', 'fg' => '#4f46e5'],
    ];
    $c = $tints[$tint] ?? $tints['blue'];
@endphp

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
  <tr>
    <td valign="top" style="width:46px;padding:0 12px 0 0;">
      <div style="width:36px;height:36px;border-radius:12px;background:{{ $c['bg'] }};color:{{ $c['fg'] }};display:inline-block;line-height:36px;text-align:center;font-size:16px;">{!! $icon ?? '&bull;' !!}</div>
    </td>
    <td valign="top" style="padding:0;">
      <div style="font-size:14px;font-weight:700;color:#0f172a;margin:0 0 2px;line-height:1.4;">{{ $title }}</div>
      <div style="font-size:13px;color:#64748b;line-height:1.5;margin:0;">{{ $body }}</div>
    </td>
  </tr>
</table>
