@extends('admin.layout')

@section('title', 'Users')

@section('body')
@include('admin.partials.sidebar')

<div class="main">
    <div class="header">
        <div class="header-left">
            <label for="sidebar-toggle" class="hamburger" aria-label="Open sidebar">&#9776;</label>
            <h2>Users</h2>
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

    <div class="flex flex-wrap gap-2 items-center mb-2 users-toolbar">
        <form method="GET" action="{{ route('admin.users') }}" class="flex gap-2 items-center flex-wrap">
            <input type="text" name="search" placeholder="Search by name or email..." value="{{ request('search') }}" class="search-input">
            <button type="submit" class="btn btn-primary btn-sm">Search</button>
            @if (request()->anyFilled(['search', 'trashed']))
                <a href="{{ route('admin.users') }}" class="btn btn-outline btn-sm">Clear</a>
            @endif
        </form>
        <a href="{{ route('admin.users', ['trashed' => 1]) }}" class="btn btn-outline btn-sm {{ request()->boolean('trashed') ? 'active' : '' }}">Trashed</a>
    </div>

    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Verified</th>
                    <th>Admin</th>
                    <th>Last Active</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                @forelse ($users as $user)
                    <tr>
                        <td data-label="Name">{{ $user->name }}</td>
                        <td data-label="Email">{{ $user->email }}</td>
                        <td data-label="Verified">
                            @if ($user->hasVerifiedEmail())
                                <span class="badge badge-success">Yes</span>
                            @else
                                <span class="badge badge-warning">No</span>
                            @endif
                        </td>
                        <td data-label="Admin">
                            @if ($user->is_admin)
                                <span class="badge badge-success">Yes</span>
                            @else
                                <span class="badge badge-neutral">No</span>
                            @endif
                        </td>
                        <td data-label="Last Active">
                            @if ($user->last_transaction_date)
                                <span class="badge badge-active">{{ \Carbon\Carbon::parse($user->last_transaction_date)->diffForHumans() }}</span>
                            @else
                                <span class="badge badge-neutral">Never</span>
                            @endif
                        </td>
                        <td data-label="Joined">{{ $user->created_at->format('M j, Y') }}</td>
                        <td data-label="Status">
                            @if ($user->trashed())
                                <span class="badge badge-danger">Deleted</span>
                            @else
                                <span class="badge badge-success">Active</span>
                            @endif
                        </td>
                        <td data-label="Action"><a href="{{ route('admin.users.show', $user->id) }}">View</a></td>
                    </tr>
                @empty
                    <tr><td colspan="8" style="text-align:center;color:#64748b;padding:2rem;">No users found.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="pagination">
        {{ $users->appends(request()->query())->links() }}
    </div>
</div>
@endsection
