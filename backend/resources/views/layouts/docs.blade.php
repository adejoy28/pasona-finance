<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="api-base-url" content="{{ config('api.base_url') }}">
    <title>@yield('title', 'Documentation') &middot; {{ config('api.name') }}</title>

    <link rel="icon" href="{{ asset('favicon.ico') }}">

    {{-- highlight.js for syntax highlighting --}}
    <link id="hljs-theme-dark" rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/[email protected]/build/styles/github-dark.min.css">
    <link id="hljs-theme-light" rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/[email protected]/build/styles/github.min.css" disabled>
    <script src="https://cdn.jsdelivr.net/gh/highlightjs/[email protected]/build/highlight.min.js" defer></script>

    {{-- Project styles --}}
    <link rel="stylesheet" href="{{ asset('css/docs.css') }}">

    @stack('head')
</head>
<body>
    {{-- Mobile overlay --}}
    <div class="overlay" id="mobile-overlay" aria-hidden="true"></div>

    {{-- Top Navbar --}}
    @include('partials.navbar')

    <div class="layout">
        {{-- Left Sidebar --}}
        @include('partials.sidebar')

        {{-- Main Content --}}
        <main class="main" id="main-content">
            <article class="content">
                @yield('content')

                <footer class="content-footer">
                    <p>&copy; {{ date('Y') }} {{ config('api.name') }}. All rights reserved.</p>
                    <p class="muted">API version: <code>{{ config('api.version') }}</code></p>
                </footer>
            </article>

            {{-- Right Panel for code examples (filled by @push('code-examples')) --}}
            <aside class="code-panel" id="code-panel">
                @stack('code-examples')
            </aside>
        </main>
    </div>

    {{-- Search modal --}}
    <div class="search-modal" id="search-modal" aria-hidden="true">
        <div class="search-modal__backdrop" data-close-search></div>
        <div class="search-modal__dialog" role="dialog" aria-modal="true" aria-label="Search docs">
            <div class="search-modal__input-wrap">
                <svg class="search-modal__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input type="text" id="search-input" class="search-modal__input" placeholder="Search documentation..." autocomplete="off">
                <kbd class="kbd">ESC</kbd>
            </div>
            <div class="search-modal__results" id="search-results">
                <p class="search-modal__hint">Start typing to search through the documentation...</p>
            </div>
        </div>
    </div>

    {{-- Project scripts --}}
    <script src="{{ asset('js/docs.js') }}" defer></script>
    @stack('scripts')
</body>
</html>
