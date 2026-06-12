@extends('admin.layout')

@section('title', 'Emails')

@section('body')
@include('admin.partials.sidebar')

<div class="main">
    <div class="header">
        <div class="header-left">
            <label for="sidebar-toggle" class="hamburger" aria-label="Open sidebar">&#9776;</label>
            <h2>Email Log</h2>
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

    <div class="flex flex-wrap gap-2 items-center mb-2">
        <form method="GET" action="{{ route('admin.emails') }}" class="flex gap-2 items-center flex-wrap">
            <input type="text" name="search" placeholder="Search by email..." value="{{ request('search') }}" class="search-input" style="width:220px;">
            <select name="type" style="padding:0.5rem 0.75rem;background:#0f172a;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:0.875rem;">
                <option value="">All types</option>
                @foreach ($types as $t)
                    <option value="{{ $t }}" {{ request('type') === $t ? 'selected' : '' }}>{{ $t }}</option>
                @endforeach
            </select>
            <button type="submit" class="btn btn-primary btn-sm">Filter</button>
            @if (request()->anyFilled(['type', 'search']))
                <a href="{{ route('admin.emails') }}" class="btn btn-outline btn-sm">Clear</a>
            @endif
        </form>
    </div>

    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Recipient</th>
                    <th>Subject</th>
                    <th>User</th>
                    <th>Sent</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($logs as $log)
                    <tr>
                        <td data-label="Type"><span class="badge badge-active">{{ $log->email_type }}</span></td>
                        <td data-label="Recipient">{{ $log->recipient_email }}</td>
                        <td data-label="Subject" style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ $log->subject }}</td>
                        <td data-label="User">
                            @if ($log->user)
                                <a href="{{ route('admin.users.show', $log->user->id) }}">{{ $log->user->name }}</a>
                            @else
                                <span class="badge badge-neutral">&mdash;</span>
                            @endif
                        </td>
                        <td data-label="Sent" style="font-size:0.8125rem;color:#94a3b8;">{{ $log->sent_at->diffForHumans() }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" style="text-align:center;color:#64748b;padding:2rem;">No emails logged yet.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="pagination">
        {{ $logs->appends(request()->query())->links() }}
    </div>
</div>
@endsection
