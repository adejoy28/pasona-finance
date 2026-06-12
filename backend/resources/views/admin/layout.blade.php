<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Dashboard') &middot; Admin</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a; color: #e2e8f0; min-height: 100vh;
        }
        .layout { display: flex; min-height: 100vh; }

        /* ── Sidebar ── */
        .sidebar {
            width: 260px; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
            padding: 1.5rem 1rem; position: sticky; top: 0; height: 100vh;
            border-right: 1px solid #1e293b; flex-shrink: 0; overflow-y: auto;
        }
        .sidebar-brand {
            display: flex; align-items: center; gap: 0.625rem;
            padding: 0.25rem 0.75rem; margin-bottom: 2rem; color: #fff;
            font-size: 1.125rem; font-weight: 700; letter-spacing: -0.02em;
        }
        .sidebar-brand svg { width: 24px; height: 24px; flex-shrink: 0; }
        .sidebar-nav { display: flex; flex-direction: column; gap: 0.125rem; }
        .sidebar-nav a {
            display: flex; align-items: center; gap: 0.75rem;
            color: #94a3b8; text-decoration: none; padding: 0.625rem 0.75rem;
            border-radius: 8px; font-size: 0.875rem; font-weight: 500;
            transition: background 0.15s, color 0.15s; position: relative;
        }
        .sidebar-nav a:hover { background: #334155; color: #e2e8f0; }
        .sidebar-nav a.active {
            background: #1e3a5f; color: #60a5fa;
        }
        .sidebar-nav a.active::before {
            content: ''; position: absolute; left: -1rem; top: 50%; transform: translateY(-50%);
            width: 3px; height: 20px; background: #60a5fa; border-radius: 0 3px 3px 0;
        }
        .sidebar-nav a svg { width: 18px; height: 18px; flex-shrink: 0; opacity: 0.7; }
        .sidebar-nav a.active svg { opacity: 1; }

        /* Hamburger */
        .hamburger { display: none; background: none; border: none; color: #e2e8f0; font-size: 1.5rem; cursor: pointer; padding: 0.25rem; line-height: 1; }
        #sidebar-toggle { display: none; }

        /* ── Main ── */
        .main { flex: 1; padding: 2rem 2.5rem; min-width: 0; }
        .header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;
        }
        .header-left { display: flex; align-items: center; gap: 0.75rem; }
        .header h2 { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
        .user-info {
            display: flex; align-items: center; gap: 0.75rem;
            font-size: 0.875rem; color: #94a3b8;
        }
        .user-info-avatar {
            width: 32px; height: 32px; border-radius: 999px; background: #334155;
            display: flex; align-items: center; justify-content: center;
            font-size: 0.75rem; font-weight: 600; color: #94a3b8;
        }
        .user-info a {
            color: #64748b; text-decoration: none; font-size: 0.8125rem;
            padding: 0.25rem 0.625rem; border-radius: 6px; border: 1px solid #334155;
            transition: background 0.15s, color 0.15s;
        }
        .user-info a:hover { background: #334155; color: #e2e8f0; text-decoration: none; }

        /* ── Tables ── */
        .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 8px; border: 1px solid #334155; }
        table { width: 100%; border-collapse: collapse; }
        th {
            background: #1e293b; color: #94a3b8; font-weight: 600; text-transform: uppercase;
            font-size: 0.6875rem; letter-spacing: 0.06em; text-align: left;
            padding: 0.75rem 1rem; border-bottom: 1px solid #334155; white-space: nowrap;
            position: sticky; top: 0; z-index: 1;
        }
        td {
            padding: 0.75rem 1rem; border-bottom: 1px solid #1e293b;
            font-size: 0.875rem; white-space: nowrap; background: #0f172a;
        }
        tbody tr { transition: background 0.1s; }
        tbody tr:hover td { background: #1a2332; }
        tbody tr:last-child td { border-bottom: none; }

        /* ── Badges ── */
        .badge {
            display: inline-block; padding: 0.1875rem 0.5625rem; border-radius: 999px;
            font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.01em;
        }
        .badge-success { background: #064e3b; color: #6ee7b7; }
        .badge-warning { background: #451a03; color: #fbbf24; }
        .badge-danger { background: #450a0a; color: #fca5a5; }
        .badge-neutral { background: #1e293b; color: #64748b; }
        .badge-active { background: #172554; color: #93c5fd; }

        /* ── Buttons ── */
        .btn {
            display: inline-flex; align-items: center; gap: 0.375rem;
            padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.8125rem;
            font-weight: 500; text-decoration: none; border: none; cursor: pointer;
            transition: background 0.15s, box-shadow 0.15s;
        }
        .btn-sm { padding: 0.3125rem 0.75rem; font-size: 0.75rem; }
        .btn-primary { background: #2563eb; color: #fff; }
        .btn-primary:hover { background: #1d4ed8; box-shadow: 0 0 0 3px rgba(37,99,235,0.25); }
        .btn-danger { background: #dc2626; color: #fff; }
        .btn-danger:hover { background: #b91c1c; box-shadow: 0 0 0 3px rgba(220,38,38,0.25); }
        .btn-outline { background: transparent; color: #94a3b8; border: 1px solid #334155; }
        .btn-outline:hover { background: #334155; color: #fff; }

        a { color: #60a5fa; text-decoration: none; transition: color 0.15s; }
        a:hover { color: #93c5fd; }

        /* ── Stats Grid ── */
        .stats-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1rem; margin-bottom: 2rem;
        }
        .stat-card {
            background: #1e293b; border-radius: 10px; padding: 1.25rem 1.5rem;
            border: 1px solid #334155; position: relative; overflow: hidden;
        }
        .stat-card::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0;
            height: 3px; border-radius: 10px 10px 0 0;
        }
        .stat-card:nth-child(1)::before { background: linear-gradient(90deg, #2563eb, #60a5fa); }
        .stat-card:nth-child(2)::before { background: linear-gradient(90deg, #059669, #34d399); }
        .stat-card:nth-child(3)::before { background: linear-gradient(90deg, #d97706, #fbbf24); }
        .stat-card:nth-child(4)::before { background: linear-gradient(90deg, #dc2626, #f87171); }
        .stat-card .label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
        .stat-card .value { font-size: 2rem; font-weight: 800; margin-top: 0.25rem; color: #f8fafc; letter-spacing: -0.03em; }
        .stat-card .sub { font-size: 0.75rem; color: #475569; margin-top: 0.125rem; }

        /* ── Detail Cards ── */
        .detail-card {
            background: #1e293b; border-radius: 10px; padding: 1.5rem;
            border: 1px solid #334155; margin-bottom: 1rem; overflow-x: auto;
        }
        .detail-card dt {
            font-size: 0.6875rem; color: #64748b; text-transform: uppercase;
            letter-spacing: 0.06em; font-weight: 600; margin-bottom: 0.25rem;
        }
        .detail-card dd { font-size: 1rem; margin-bottom: 1.25rem; color: #e2e8f0; }
        .detail-card dd:last-child { margin-bottom: 0; }

        /* ── Flash ── */
        .flash {
            padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem;
            font-size: 0.875rem; font-weight: 500;
        }
        .flash-success { background: #064e3b; color: #6ee7b7; border: 1px solid #065f46; }
        .flash-error { background: #450a0a; color: #fca5a5; border: 1px solid #7f1d1d; }

        /* ── Pagination ── */
        .pagination { margin-top: 1rem; }
        .pagination nav { display: flex; gap: 0.25rem; flex-wrap: wrap; }
        .pagination a, .pagination span {
            display: inline-flex; align-items: center; justify-content: center;
            min-width: 2rem; height: 2rem; padding: 0 0.5rem;
            background: #1e293b; border: 1px solid #334155; border-radius: 6px;
            color: #94a3b8; font-size: 0.8125rem; text-decoration: none;
            transition: background 0.15s, color 0.15s;
        }
        .pagination a:hover { background: #334155; color: #fff; }
        .pagination .active { background: #2563eb; color: #fff; border-color: #2563eb; }

        /* ── Forms ── */
        form.inline { display: inline; }
        button.link {
            background: none; border: none; color: #60a5fa; cursor: pointer;
            font-size: 0.875rem; padding: 0; text-decoration: none;
        }
        button.link:hover { color: #93c5fd; }

        .login-page {
            display: flex; align-items: center; justify-content: center;
            min-height: 100vh; padding: 1rem; background: #0f172a;
        }
        .login-card {
            background: #1e293b; padding: 2.5rem; border-radius: 12px;
            border: 1px solid #334155; width: 100%; max-width: 380px;
        }
        .login-card h1 { margin-bottom: 1.5rem; text-align: center; font-size: 1.25rem; }

        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 0.8125rem; color: #94a3b8; margin-bottom: 0.375rem; font-weight: 500; }
        .form-group input, .form-group select {
            width: 100%; padding: 0.5625rem 0.75rem; background: #0f172a;
            border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;
            font-size: 0.875rem; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
        .error { color: #fca5a5; font-size: 0.75rem; margin-top: 0.25rem; }

        .w-100 { width: 100%; }
        .text-center { text-align: center; }
        .mt-2 { margin-top: 0.5rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .flex { display: flex; }
        .flex-wrap { flex-wrap: wrap; }
        .gap-2 { gap: 0.5rem; }
        .gap-1 { gap: 0.25rem; }
        .items-center { align-items: center; }
        .w-full { width: 100%; }

        /* ── Activity Calendar ── */
        .activity-cal { display: flex; flex-wrap: wrap; gap: 3px; }
        .activity-day {
            width: 16px; height: 16px; border-radius: 3px; background: #0f172a;
            position: relative; cursor: default;
        }
        .activity-day.has-tx { background: #2563eb; }
        .activity-day.today { outline: 2px solid #fde047; outline-offset: 1px; }
        .activity-day:hover::after {
            content: attr(data-tip); position: absolute; bottom: 120%; left: 50%; transform: translateX(-50%);
            background: #1e293b; border: 1px solid #334155; color: #e2e8f0;
            padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; white-space: nowrap; z-index: 10;
        }

        .search-input {
            padding: 0.5rem 0.75rem; background: #0f172a; border: 1px solid #334155;
            border-radius: 6px; color: #e2e8f0; font-size: 0.875rem; width: 280px; max-width: 100%;
        }
        .search-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }

        summary { cursor: pointer; }
        details > summary { list-style: none; display: flex; align-items: center; gap: 0.375rem; }
        details > summary::-webkit-details-marker { display: none; }
        details > summary::before { content: '\25B6'; font-size: 0.625rem; color: #64748b; transition: transform 0.15s; }
        details[open] > summary::before { transform: rotate(90deg); }

        /* ── Section heading utility ── */
        .section-heading { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 1rem; }

        /* ── 2-col grid on wide screens ── */
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        @media (max-width: 1200px) {
            .grid-2 { grid-template-columns: 1fr; }
            .main { padding: 1.5rem; }
        }

        @media (max-width: 768px) {
            .sidebar {
                position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
                transform: translateX(-100%); width: 260px; height: 100vh;
            }
            #sidebar-toggle:checked ~ .sidebar { transform: translateX(0); }
            #sidebar-toggle:checked ~ .overlay { display: block; }
            .overlay {
                display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99;
            }
            .hamburger { display: block; }
            .main { padding: 1rem; }
            .stats-grid { grid-template-columns: 1fr 1fr; }
            .header h2 { font-size: 1.25rem; }
            .table-wrap { margin: 0 -1rem; border-radius: 0; border-left: none; border-right: none; }
            .search-input { width: 100%; }
            .users-toolbar { flex-direction: column; align-items: stretch; }
            .users-toolbar form { flex-wrap: wrap; }
        }

        @media (max-width: 480px) {
            .stats-grid { grid-template-columns: 1fr; }
            .main { padding: 0.75rem; }
            .header h2 { font-size: 1.125rem; }
            .user-info { font-size: 0.75rem; }
        }
    </style>
</head>
<body>
    @yield('body')
</body>
</html>
