<nav class="navbar" id="navbar">
    <div class="navbar__inner">
        <button class="navbar__menu-btn" id="mobile-menu-btn" aria-label="Open menu" aria-controls="sidebar" aria-expanded="false">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>

        <a href="{{ route('docs.index') }}" class="navbar__brand">
            <span class="navbar__logo">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16v16H4z"/>
                    <path d="M4 12h16"/>
                    <path d="M12 4v16"/>
                </svg>
            </span>
            <span class="navbar__title">{{ config('api.name') }}</span>
            <span class="navbar__badge">Docs</span>
        </a>

        <button class="navbar__search" id="search-trigger" aria-label="Search documentation">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <span class="navbar__search-text">Search documentation...</span>
            <kbd class="kbd">
                <span class="kbd__cmd">&#8984;</span><span class="kbd__ctrl">Ctrl</span>K
            </kbd>
        </button>

        <div class="navbar__actions">
            <button class="navbar__theme-toggle" id="theme-toggle" aria-label="Toggle theme">
                <svg class="theme-icon theme-icon--sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
                <svg class="theme-icon theme-icon--moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>

            <a href="#" class="navbar__link navbar__link--hide-sm">Support</a>
            <a href="#" class="navbar__btn">Login</a>
        </div>
    </div>
</nav>
