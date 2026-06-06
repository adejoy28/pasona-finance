<div style="max-width:560px;margin:0 auto;">
  <h1 style="font-size:26px;font-weight:600;line-height:1.3;color:#111;margin:0 0 8px;">
    Email templates
  </h1>
  <p style="color:var(--muted);margin:0 0 28px;">
    Pick a template from the bar above to render it with sample data. These pages are only available outside production.
  </p>

  <div style="background:#fff;border:1px solid var(--line-soft);border-radius:14px;overflow:hidden;">
    @foreach ($templates as $i => $t)
      <a href="{{ $t['url'] }}" style="
          display:flex;align-items:center;justify-content:space-between;
          padding:18px 22px;text-decoration:none;color:inherit;
          border-top:{{ $i === 0 ? 'none' : '1px solid #f0ebe4' }};
        ">
        <div>
          <div style="font-weight:600;color:#111;">{{ $t['label'] }}</div>
          <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted);margin-top:2px;">
            {{ $t['slug'] }}
          </div>
        </div>
        <div style="color:var(--muted);font-size:18px;">&rarr;</div>
      </a>
    @endforeach
  </div>
</div>
