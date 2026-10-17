<input type="checkbox" id="sidebar-toggle" aria-hidden="true">
<label for="sidebar-toggle" class="overlay"></label>
<aside class="sidebar">
    <div class="sidebar-brand">
        <svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8"/><path d="M12 17v4"/>
        </svg>
        Pasona Admin
    </div>
    <nav class="sidebar-nav">
        <a href="{{ route('admin.dashboard') }}" class="{{ request()->routeIs('admin.dashboard') ? 'active' : '' }}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Dashboard
        </a>
        <a href="{{ route('admin.users') }}" class="{{ request()->routeIs('admin.users*') ? 'active' : '' }}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Users
        </a>
        <a href="{{ route('admin.emails') }}" class="{{ request()->routeIs('admin.emails*') ? 'active' : '' }}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/>
            </svg>
            Emails
        </a>
    </nav>
    <div style="margin-top:auto;padding-top:2rem;">
        <a href="{{ route('admin.logout') }}" onclick="event.preventDefault(); document.getElementById('logout-form-sidebar').submit();"
           style="display:flex;align-items:center;gap:0.75rem;color:#64748b;font-size:0.8125rem;padding:0.5rem 0.75rem;border-radius:6px;transition:background 0.15s;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
        </a>
        <form id="logout-form-sidebar" action="{{ route('admin.logout') }}" method="POST" style="display:none;">@csrf</form>
    </div>
</aside>
