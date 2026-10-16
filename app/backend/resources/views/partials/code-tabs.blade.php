{{--
    Reusable code-tabs panel that supports cURL / JavaScript / PHP / Python.
    Usage:
        @include('partials.code-tabs', [
            'id'       => 'create-user',
            'curl'     => "curl -X POST ...",
            'js'       => "fetch('...')",
            'php'      => "<?php ...",
            'python'   => "import requests ...",
        ])
--}}
@php
    $id      = $id      ?? 'snippet-' . uniqid();
    $curl    = $curl    ?? '';
    $js      = $js      ?? '';
    $php     = $php     ?? '';
    $python  = $python  ?? '';
@endphp
<div class="code-tabs" data-code-tabs id="{{ $id }}">
    <div class="code-tabs__header">
        <div class="code-tabs__tabs" role="tablist">
            <button class="code-tabs__tab is-active" data-tab="curl"   role="tab" aria-selected="true">cURL</button>
            <button class="code-tabs__tab"           data-tab="js"     role="tab">JavaScript</button>
            <button class="code-tabs__tab"           data-tab="php"    role="tab">PHP</button>
            <button class="code-tabs__tab"           data-tab="python" role="tab">Python</button>
        </div>
        <button class="copy-btn" data-copy-target="#{{ $id }} .code-tabs__panel.is-active code" aria-label="Copy code">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span class="copy-btn__label">Copy</span>
        </button>
    </div>

    <div class="code-tabs__panel is-active" data-panel="curl"><pre><code class="language-bash">{{ $curl }}</code></pre></div>
    <div class="code-tabs__panel"           data-panel="js"><pre><code class="language-javascript">{{ $js }}</code></pre></div>
    <div class="code-tabs__panel"           data-panel="php"><pre><code class="language-php">{{ $php }}</code></pre></div>
    <div class="code-tabs__panel"           data-panel="python"><pre><code class="language-python">{{ $python }}</code></pre></div>
</div>
