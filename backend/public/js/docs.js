/* ==========================================================================
   Pasona Finance API Docs — Vanilla JS
   - Theme toggle (dark/light, persisted in localStorage)
   - highlight.js init + theme swap
   - Mobile sidebar + overlay
   - Search modal (Cmd+K / Ctrl+K)
   - Copy-to-clipboard
   - Code tabs (cURL/JS/PHP/Python) + Response tabs
   - Scroll-spy with IntersectionObserver
   - Smooth in-page navigation
   ========================================================================== */

(function () {
    'use strict';

    /* ------------------------------------------------------------------ THEME */
    const STORAGE_KEY = 'docs:theme';
    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const hljsDark = document.getElementById('hljs-theme-dark');
    const hljsLight = document.getElementById('hljs-theme-light');

    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        if (hljsDark && hljsLight) {
            hljsDark.disabled = theme !== 'dark';
            hljsLight.disabled = theme !== 'light';
        }
    }

    function initTheme() {
        let theme = localStorage.getItem(STORAGE_KEY);
        if (!theme) {
            theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }
        applyTheme(theme);
    }

    initTheme();

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = html.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            localStorage.setItem(STORAGE_KEY, next);
        });
    }

    /* ------------------------------------------------------------------ HIGHLIGHT.JS */
    function highlightAll() {
        if (window.hljs && typeof window.hljs.highlightAll === 'function') {
            window.hljs.highlightAll();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', highlightAll);
    } else {
        highlightAll();
    }
    // Re-run after defer-loaded hljs finishes
    window.addEventListener('load', highlightAll);

    /* ------------------------------------------------------------------ MOBILE MENU */
    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('is-open');
        if (overlay) overlay.classList.remove('is-visible');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    }

    function openSidebar() {
        if (sidebar) sidebar.classList.add('is-open');
        if (overlay) overlay.classList.add('is-visible');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    }

    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar();
        });
    }

    if (overlay) overlay.addEventListener('click', closeSidebar);

    // Close sidebar on link click (mobile only)
    if (sidebar) {
        sidebar.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && window.innerWidth <= 768) closeSidebar();
        });
    }

    /* ------------------------------------------------------------------ SEARCH MODAL */
    const searchTrigger = document.getElementById('search-trigger');
    const searchModal = document.getElementById('search-modal');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    function openSearch() {
        if (!searchModal) return;
        searchModal.classList.add('is-open');
        searchModal.setAttribute('aria-hidden', 'false');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        renderSearchResults('');
    }

    function closeSearch() {
        if (!searchModal) return;
        searchModal.classList.remove('is-open');
        searchModal.setAttribute('aria-hidden', 'true');
    }

    if (searchTrigger) searchTrigger.addEventListener('click', openSearch);

    if (searchModal) {
        searchModal.querySelectorAll('[data-close-search]').forEach((el) => {
            el.addEventListener('click', closeSearch);
        });
    }

    // Cmd+K / Ctrl+K
    document.addEventListener('keydown', (e) => {
        const isMac = navigator.platform.toUpperCase().includes('MAC');
        const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
        if (cmdOrCtrl && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            openSearch();
        } else if (e.key === 'Escape' && searchModal && searchModal.classList.contains('is-open')) {
            closeSearch();
        }
    });

    // Build a simple in-page search index from headings on the page
    function buildIndex() {
        const index = [];
        document.querySelectorAll('h1[id], h2[id], h3[id]').forEach((h) => {
            const section = h.closest('article, section, .content')?.querySelector('.page-header__eyebrow')?.textContent?.trim()
                         || document.title.split('·')[0].trim();
            index.push({
                title: h.textContent.trim(),
                section,
                id: h.id,
                level: parseInt(h.tagName.slice(1), 10),
            });
        });
        // Pull in sidebar links so users can jump across pages
        document.querySelectorAll('.sidebar__link').forEach((link) => {
            index.push({
                title: link.textContent.trim(),
                section: link.closest('.sidebar__section')?.querySelector('.sidebar__heading')?.textContent?.trim() || '',
                href: link.getAttribute('href'),
                level: 4,
            });
        });
        return index;
    }

    let searchIndex = [];
    function renderSearchResults(query) {
        if (!searchResults) return;
        if (!searchIndex.length) searchIndex = buildIndex();

        if (!query) {
            searchResults.innerHTML = '<p class="search-modal__hint">Start typing to search through the documentation...</p>';
            return;
        }

        const q = query.toLowerCase();
        const matches = searchIndex
            .filter((item) => item.title.toLowerCase().includes(q) || (item.section && item.section.toLowerCase().includes(q)))
            .slice(0, 20);

        if (matches.length === 0) {
            searchResults.innerHTML = `<p class="search-modal__hint">No results for "<strong>${escapeHtml(query)}</strong>"</p>`;
            return;
        }

        searchResults.innerHTML = matches
            .map((item, i) => {
                const href = item.href || `#${item.id}`;
                return `
                    <a href="${href}" class="search-result ${i === 0 ? 'is-active' : ''}" data-result-index="${i}">
                        <div class="search-result__title">${highlight(item.title, q)}</div>
                        <div class="search-result__section">${escapeHtml(item.section || '')}</div>
                    </a>
                `;
            })
            .join('');

        // Close modal once a result is chosen
        searchResults.querySelectorAll('.search-result').forEach((el) => {
            el.addEventListener('click', closeSearch);
        });
    }

    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function highlight(text, q) {
        const safe = escapeHtml(text);
        if (!q) return safe;
        const re = new RegExp(escapeRegex(q), 'gi');
        return safe.replace(re, (m) => `<mark style="background:transparent;color:var(--color-brand);font-weight:600">${m}</mark>`);
    }

    function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderSearchResults(e.target.value));

        // Arrow-key navigation through results
        searchInput.addEventListener('keydown', (e) => {
            if (!searchResults) return;
            const results = Array.from(searchResults.querySelectorAll('.search-result'));
            if (results.length === 0) return;
            const activeIdx = results.findIndex((el) => el.classList.contains('is-active'));

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = (activeIdx + 1) % results.length;
                results.forEach((el) => el.classList.remove('is-active'));
                results[next].classList.add('is-active');
                results[next].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = (activeIdx - 1 + results.length) % results.length;
                results.forEach((el) => el.classList.remove('is-active'));
                results[prev].classList.add('is-active');
                results[prev].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const target = results[activeIdx >= 0 ? activeIdx : 0];
                if (target) target.click();
            }
        });
    }

    /* ------------------------------------------------------------------ COPY BUTTONS */
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.copy-btn');
        if (!btn) return;

        const selector = btn.getAttribute('data-copy-target');
        const target = selector ? document.querySelector(selector) : btn.closest('.code-block, .code-tabs')?.querySelector('pre code');
        if (!target) return;

        const text = target.innerText || target.textContent || '';

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => flashCopied(btn));
        } else {
            // Fallback for older browsers / non-https
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); flashCopied(btn); } catch (_) {}
            document.body.removeChild(ta);
        }
    });

    function flashCopied(btn) {
        const label = btn.querySelector('.copy-btn__label');
        const originalText = label ? label.textContent : '';
        btn.classList.add('is-copied');
        if (label) label.textContent = 'Copied!';
        setTimeout(() => {
            btn.classList.remove('is-copied');
            if (label) label.textContent = originalText;
        }, 1600);
    }

    /* ------------------------------------------------------------------ CODE TABS */
    document.querySelectorAll('[data-code-tabs]').forEach((container) => {
        container.addEventListener('click', (e) => {
            const tab = e.target.closest('.code-tabs__tab');
            if (!tab) return;
            const target = tab.getAttribute('data-tab');

            container.querySelectorAll('.code-tabs__tab').forEach((t) => t.classList.toggle('is-active', t === tab));
            container.querySelectorAll('.code-tabs__panel').forEach((p) => {
                p.classList.toggle('is-active', p.getAttribute('data-panel') === target);
            });
        });
    });

    /* ------------------------------------------------------------------ RESPONSE TABS */
    document.querySelectorAll('[data-response-tabs]').forEach((container) => {
        container.addEventListener('click', (e) => {
            const tab = e.target.closest('.response-tabs__tab');
            if (!tab) return;
            const target = tab.getAttribute('data-resp');

            container.querySelectorAll('.response-tabs__tab').forEach((t) => t.classList.toggle('is-active', t === tab));
            container.querySelectorAll('.response-tabs__panel').forEach((p) => {
                p.classList.toggle('is-active', p.getAttribute('data-resp-panel') === target);
            });
        });
    });

    /* ------------------------------------------------------------------ SCROLL-SPY */
    // Highlight the sidebar entry whose anchor is currently in view.
    const headings = Array.from(document.querySelectorAll('h1[id], h2[id], h3[id]'));
    const sidebarLinks = Array.from(document.querySelectorAll('.sidebar__link[href*="#"]'));

    if (headings.length && sidebarLinks.length && 'IntersectionObserver' in window) {
        const visible = new Set();

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) visible.add(entry.target.id);
                    else visible.delete(entry.target.id);
                });
                updateActive();
            },
            { rootMargin: `-${64 + 16}px 0px -70% 0px`, threshold: 0 }
        );

        headings.forEach((h) => observer.observe(h));

        function updateActive() {
            if (visible.size === 0) return;
            // Pick the first visible heading in document order
            const ordered = headings.find((h) => visible.has(h.id));
            if (!ordered) return;

            sidebarLinks.forEach((link) => {
                const href = link.getAttribute('href') || '';
                const id = href.split('#')[1];
                if (!id) return;
                link.classList.toggle('is-active', id === ordered.id);
            });
        }
    }

    /* ------------------------------------------------------------------ SMOOTH SCROLL */
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const id = link.getAttribute('href').slice(1);
            if (!id) return;
            const el = document.getElementById(id);
            if (!el) return;
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Update URL hash without jumping
            history.replaceState(null, '', `#${id}`);
        });
    });
})();
