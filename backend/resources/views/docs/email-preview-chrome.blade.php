<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ $title }} &middot; Email previews</title>
<style>
  :root {
    --bg: #f0ede8;
    --ink: #1a1a1a;
    --muted: #6b6560;
    --line: #d4cfc9;
    --line-soft: #e8e2da;
    --chip-bg: #ffffff;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--ink);
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  .bar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: rgba(240, 237, 232, 0.92);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--line);
  }
  .bar-inner {
    max-width: 1080px;
    margin: 0 auto;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .brand {
    font-family: 'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    text-decoration: none;
    border: 1px solid var(--line);
    padding: 5px 12px;
    border-radius: 100px;
  }
  .nav {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .nav a {
    font-size: 13px;
    text-decoration: none;
    color: var(--muted);
    padding: 6px 12px;
    border-radius: 100px;
    border: 1px solid transparent;
  }
  .nav a:hover { color: var(--ink); border-color: var(--line); }
  .nav a.is-active {
    color: var(--ink);
    background: var(--chip-bg);
    border-color: var(--line);
  }
  .stage {
    max-width: 1080px;
    margin: 0 auto;
    padding: 24px;
  }
  .title {
    font-family: 'DM Mono', ui-monospace, monospace;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0 0 16px;
  }
</style>
</head>
<body>
  <div class="bar">
    <div class="bar-inner">
      <a class="brand" href="{{ route('email-preview.index') }}">Email previews</a>
      <nav class="nav">
        @foreach ($templates as $t)
          <a href="{{ $t['url'] }}" class="{{ $t['slug'] === $active ? 'is-active' : '' }}">{{ $t['label'] }}</a>
        @endforeach
      </nav>
    </div>
  </div>

  <div class="stage">
    @if ($active === null)
      {!! $body !!}
    @else
      <p class="title">{{ $title }}</p>
      {!! $body !!}
    @endif
  </div>
</body>
</html>
