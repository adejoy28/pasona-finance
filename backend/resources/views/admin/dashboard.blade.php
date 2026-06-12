@extends('admin.layout')

@section('title', 'Dashboard')

@section('body')
@include('admin.partials.sidebar')

<div class="main">
    <div class="header">
        <div class="header-left">
            <label for="sidebar-toggle" class="hamburger" aria-label="Open sidebar">&#9776;</label>
            <h2>Dashboard</h2>
        </div>
        <div class="user-info">
            <div class="user-info-avatar">{{ substr(Auth::user()->name, 0, 1) }}</div>
            <span>{{ Auth::user()->name }}</span>
            <a href="{{ route('admin.logout') }}" onclick="event.preventDefault(); document.getElementById('logout-form').submit();">Sign out</a>
            <form id="logout-form" action="{{ route('admin.logout') }}" method="POST" class="inline" style="display:none;">@csrf</form>
        </div>
    </div>

    @if (session('success'))
        <div class="flash flash-success">{{ session('success') }}</div>
    @endif
    @if (session('error'))
        <div class="flash flash-error">{{ session('error') }}</div>
    @endif

    <div class="stats-grid">
        <div class="stat-card">
            <div class="label">Total Users</div>
            <div class="value">{{ $totalUsers }}</div>
        </div>
        <div class="stat-card">
            <div class="label">Active Today</div>
            <div class="value">{{ $activeToday }}</div>
            <div class="sub">Recorded &ge;1 transaction today</div>
        </div>
        <div class="stat-card">
            <div class="label">Emails Today</div>
            <div class="value">{{ $emailsToday }}</div>
            <div class="sub">Sent in the last 24h</div>
        </div>
        <div class="stat-card">
            <div class="label">Deleted</div>
            <div class="value">{{ $trashedUsers }}</div>
            <div class="sub">Soft-deleted accounts</div>
        </div>
    </div>

    <h3 style="margin-bottom:1rem;font-size:1rem;font-weight:600;color:#e2e8f0;">Recent Users</h3>
    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Verified</th>
                    <th>Joined</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                @forelse ($recentUsers as $user)
                    <tr>
                        <td>{{ $user->name }}</td>
                        <td>{{ $user->email }}</td>
                        <td>
                            @if ($user->hasVerifiedEmail())
                                <span class="badge badge-success">Verified</span>
                            @else
                                <span class="badge badge-warning">Unverified</span>
                            @endif
                        </td>
                        <td>{{ $user->created_at->diffForHumans() }}</td>
                        <td><a href="{{ route('admin.users.show', $user->id) }}">View</a></td>
                    </tr>
                @empty
                    <tr><td colspan="5" style="text-align:center;color:#64748b;padding:2rem;">No users yet.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>
@endsection
