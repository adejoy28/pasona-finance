{{--
    Reusable code block with copy button.
    Usage:
        @include('partials.code-block', ['language' => 'json', 'code' => '{}'])
--}}
@php
    $language = $language ?? 'json';
    $code     = $code     ?? '';
    $title    = $title    ?? null;
    $id       = $id       ?? 'block-' . uniqid();
@endphp
<div class="code-block" id="{{ $id }}">
    <div class="code-block__header">
        <span class="code-block__lang">{{ $title ?? strtoupper($language) }}</span>
        <button class="copy-btn" data-copy-target="#{{ $id }} pre code" aria-label="Copy code">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span class="copy-btn__label">Copy</span>
        </button>
    </div>
    <pre><code class="language-{{ $language }}">{{ $code }}</code></pre>
</div>
