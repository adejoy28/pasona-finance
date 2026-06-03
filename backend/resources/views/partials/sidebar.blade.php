<aside class="sidebar" id="sidebar" aria-label="Documentation navigation">
    <div class="sidebar__inner">
        {{-- Getting Started --}}
        <div class="sidebar__section">
            <h4 class="sidebar__heading">Getting Started</h4>
            <ul class="sidebar__list">
                <li><a href="{{ route('docs.getting-started.overview') }}" class="sidebar__link {{ request()->routeIs('docs.getting-started.overview') ? 'is-active' : '' }}">Overview</a></li>
                <li><a href="{{ route('docs.getting-started.authentication') }}" class="sidebar__link {{ request()->routeIs('docs.getting-started.authentication') ? 'is-active' : '' }}">Authentication</a></li>
                <li><a href="{{ route('docs.getting-started.errors') }}" class="sidebar__link {{ request()->routeIs('docs.getting-started.errors') ? 'is-active' : '' }}">Errors</a></li>
                <li><a href="{{ route('docs.getting-started.rate-limiting') }}" class="sidebar__link {{ request()->routeIs('docs.getting-started.rate-limiting') ? 'is-active' : '' }}">Rate Limiting</a></li>
            </ul>
        </div>

        {{-- API Reference --}}
        <div class="sidebar__section">
            <h4 class="sidebar__heading">API Reference</h4>
            <ul class="sidebar__list">
                <li><a href="{{ route('docs.endpoints.auth') }}" class="sidebar__link {{ request()->routeIs('docs.endpoints.auth') ? 'is-active' : '' }}">
                    <span class="sidebar__resource">Authentication</span>
                </a></li>
                <li><a href="{{ route('docs.endpoints.accounts') }}" class="sidebar__link {{ request()->routeIs('docs.endpoints.accounts') ? 'is-active' : '' }}">
                    <span class="sidebar__resource">Accounts</span>
                </a></li>
                <li><a href="{{ route('docs.endpoints.categories') }}" class="sidebar__link {{ request()->routeIs('docs.endpoints.categories') ? 'is-active' : '' }}">
                    <span class="sidebar__resource">Categories</span>
                </a></li>
                <li><a href="{{ route('docs.endpoints.transactions') }}" class="sidebar__link {{ request()->routeIs('docs.endpoints.transactions') ? 'is-active' : '' }}">
                    <span class="sidebar__resource">Transactions</span>
                </a></li>
                <li><a href="{{ route('docs.endpoints.import') }}" class="sidebar__link {{ request()->routeIs('docs.endpoints.import') ? 'is-active' : '' }}">
                    <span class="sidebar__resource">Import</span>
                </a></li>
                <li><a href="{{ route('docs.endpoints.summary') }}" class="sidebar__link {{ request()->routeIs('docs.endpoints.summary') ? 'is-active' : '' }}">
                    <span class="sidebar__resource">Summary</span>
                </a></li>
            </ul>
        </div>

        {{-- Guides --}}
        <div class="sidebar__section">
            <h4 class="sidebar__heading">Guides</h4>
            <ul class="sidebar__list">
                <li><a href="{{ route('docs.guides') }}" class="sidebar__link {{ request()->routeIs('docs.guides') ? 'is-active' : '' }}">All Guides</a></li>
            </ul>
        </div>

        {{-- Changelog --}}
        <div class="sidebar__section">
            <h4 class="sidebar__heading">Changelog</h4>
            <ul class="sidebar__list">
                <li><a href="{{ route('docs.changelog') }}" class="sidebar__link {{ request()->routeIs('docs.changelog') ? 'is-active' : '' }}">Release Notes</a></li>
            </ul>
        </div>

        {{-- SDKs --}}
        <div class="sidebar__section">
            <h4 class="sidebar__heading">SDKs &amp; Libraries</h4>
            <ul class="sidebar__list">
                <li><a href="{{ route('docs.sdks') }}" class="sidebar__link {{ request()->routeIs('docs.sdks') ? 'is-active' : '' }}">Available SDKs</a></li>
            </ul>
        </div>

        {{-- On-page table of contents (auto-populated for endpoint pages) --}}
        @hasSection('page-toc')
            <div class="sidebar__section sidebar__section--toc">
                <h4 class="sidebar__heading">On this page</h4>
                <ul class="sidebar__list" id="toc-list">
                    @yield('page-toc')
                </ul>
            </div>
        @endif
    </div>
</aside>
