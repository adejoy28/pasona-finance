@extends('admin.layout')

@section('title', $user->name)

@section('body')
@include('admin.partials.sidebar')

<div class="main">
    <div class="header">
        <label for="sidebar-toggle" class="hamburger" aria-label="Open sidebar">&#9776;</label>
        <div class="header-left">
            <a href="{{ route('admin.users') }}" style="color:#64748b;font-size:1.25rem;line-height:1;">&larr;</a>
            <h2>{{ $user->name }}</h2>
            @if ($user->trashed())
                <span class="badge badge-danger">Deleted</span>
            @endif
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

    @if (session('impersonation_token'))
        <div class="detail-card" style="border-color:#2563eb;">
            <dt class="section-heading">Impersonation Token</dt>
            <dd style="font-size:0.875rem;margin-bottom:0.5rem;">
                Logged in as <strong>{{ session('impersonation_user') }}</strong>. Use this token to access the API:
            </dd>
            <div style="background:#0f172a;padding:0.75rem 1rem;border-radius:6px;font-family:monospace;font-size:0.8rem;word-break:break-all;color:#6ee7b7;user-select:all;" onclick="navigator.clipboard?.writeText(this.textContent)">
                {{ session('impersonation_token') }}
            </div>
            <dd style="font-size:0.75rem;color:#64748b;margin-top:0.5rem;">
                Click to copy. All previous tokens for this user have been revoked.
            </dd>
        </div>
    @endif

    {{-- Profile Info --}}
    <div class="detail-card">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.5rem;">
            <div>
                <dt>Name</dt>
                <dd>{{ $user->name }}</dd>
                <dt>Email</dt>
                <dd>{{ $user->email }}</dd>
                <dt>Email Verified</dt>
                <dd>
                    @if ($user->hasVerifiedEmail())
                        <span class="badge badge-success">Verified</span>
                        <span style="font-size:0.75rem;color:#64748b;margin-left:0.375rem;">{{ $user->email_verified_at->format('M j, Y g:i A') }}</span>
                    @else
                        <span class="badge badge-warning">Unverified</span>
                    @endif
                </dd>
                <dt>Status</dt>
                <dd>
                    @if ($user->trashed())
                        <span class="badge badge-danger">Deleted</span>
                    @else
                        <span class="badge badge-success">Active</span>
                    @endif
                </dd>
            </div>
            <div>
                <dt>Accounts</dt>
                <dd>{{ $user->accounts_count }}</dd>
                <dt>Categories</dt>
                <dd>{{ $user->categories_count }}</dd>
                <dt>Transactions</dt>
                <dd>{{ $user->transactions_count }}</dd>
                <dt>Joined</dt>
                <dd style="font-size:0.875rem;">{{ $user->created_at->format('M j, Y') }}<span style="color:#64748b;margin-left:0.375rem;">({{ $user->created_at->diffForHumans() }})</span></dd>
                @if ($user->deleted_at)
                    <dt>Deleted At</dt>
                    <dd style="font-size:0.875rem;">{{ $user->deleted_at->format('M j, Y g:i A') }}<span style="color:#64748b;margin-left:0.375rem;">({{ $user->deleted_at->diffForHumans() }})</span></dd>
                @endif
            </div>
            <div>
                <dt>Timezone</dt>
                <dd>{{ $user->timezone ?? 'Not set' }}</dd>
                <dt>Reminder Time</dt>
                <dd>{{ $user->reminder_time ?? 'Not set' }}</dd>
                <dt>Admin</dt>
                <dd>
                    @if ($user->is_admin)
                        <span class="badge badge-success">Yes</span>
                    @else
                        <span class="badge badge-neutral">No</span>
                    @endif
                </dd>
            </div>
            <div>
                <dt>Daily Activity</dt>
                <dd>
                    <div class="flex gap-2 items-center flex-wrap" style="margin-bottom:0.75rem;">
                        <span class="badge badge-active">
                            {{ $activeDaysCount }} / {{ $totalDaysSpan ?: '—' }}
                            days
                        </span>
                        @if ($currentStreak > 0)
                            <span class="badge badge-success">{{ $currentStreak }}-day streak</span>
                        @endif
                        @if ($longestStreak > 0)
                            <span class="badge badge-neutral">Best: {{ $longestStreak }}d</span>
                        @endif
                    </div>
                    <div style="font-size:0.6875rem;color:#64748b;margin-bottom:0.5rem;">
                        Last 60 days &middot; <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#2563eb;vertical-align:middle;"></span> = transaction
                    </div>
                    <div class="activity-cal">
                        @foreach ($activityDays as $day)
                            <div class="activity-day {{ $day['class'] }}" data-tip="{{ $day['tip'] }}"></div>
                        @endforeach
                    </div>
                </dd>
            </div>
        </div>
    </div>

    {{-- Two-column actions --}}
    <div class="grid-2">
        <div>
            {{-- Edit Profile --}}
            <div class="detail-card">
                <dt class="section-heading">Edit Profile</dt>
                <form method="POST" action="{{ route('admin.users.update', $user->id) }}">
                    @csrf
                    <div class="form-group">
                        <label for="edit-name">Name</label>
                        <input type="text" id="edit-name" name="name" value="{{ old('name', $user->name) }}">
                    </div>
                    <div class="form-group">
                        <label for="edit-email">Email</label>
                        <input type="email" id="edit-email" name="email" value="{{ old('email', $user->email) }}">
                    </div>
                    <div class="form-group">
                        <label for="edit-timezone">Timezone</label>
                        <input type="text" id="edit-timezone" name="timezone" value="{{ old('timezone', $user->timezone) }}" placeholder="Africa/Lagos">
                    </div>
                    <div class="form-group">
                        <label for="edit-reminder">Reminder Time (HH:MM)</label>
                        <input type="text" id="edit-reminder" name="reminder_time" value="{{ old('reminder_time', $user->reminder_time) }}" placeholder="21:10">
                    </div>
                    <div class="flex gap-2 items-center flex-wrap" style="margin-top:0.75rem;">
                        <label style="display:flex;align-items:center;gap:0.375rem;font-size:0.8125rem;cursor:pointer;">
                            <input type="checkbox" name="is_admin" value="1" {{ $user->is_admin ? 'checked' : '' }}>
                            Is Admin
                        </label>
                        <label style="display:flex;align-items:center;gap:0.375rem;font-size:0.8125rem;cursor:pointer;">
                            <input type="checkbox" name="mark_verified" value="1" {{ $user->hasVerifiedEmail() ? 'disabled checked' : '' }}>
                            Mark Verified
                        </label>
                        <label style="display:flex;align-items:center;gap:0.375rem;font-size:0.8125rem;cursor:pointer;">
                            <input type="checkbox" name="unmark_verified" value="1">
                            Unmark Verified
                        </label>
                    </div>
                    <button type="submit" class="btn btn-primary btn-sm" style="margin-top:0.75rem;">Save Changes</button>
                </form>
            </div>

            {{-- Password --}}
            <div class="detail-card">
                <dt class="section-heading">Password</dt>
                <div class="flex gap-2" style="margin-bottom:0.75rem;">
                    <form method="POST" action="{{ route('admin.users.send-reset-link', $user->id) }}" class="inline">
                        @csrf
                        <button type="submit" class="btn btn-outline btn-sm">Send Reset Link</button>
                    </form>
                </div>
                <details>
                    <summary style="font-size:0.8125rem;color:#60a5fa;">Set password directly</summary>
                    <form method="POST" action="{{ route('admin.users.set-password', $user->id) }}" style="margin-top:0.75rem;">
                        @csrf
                        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                            <div class="form-group" style="flex:1;min-width:160px;">
                                <label for="new-password">New Password</label>
                                <input type="password" id="new-password" name="password" required minlength="8">
                            </div>
                            <div class="form-group" style="flex:1;min-width:160px;">
                                <label for="new-password-confirm">Confirm</label>
                                <input type="password" id="new-password-confirm" name="password_confirmation" required minlength="8">
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-sm">Set Password</button>
                    </form>
                </details>
            </div>
        </div>

        <div>
            {{-- Impersonate --}}
            <div class="detail-card">
                <dt class="section-heading">Impersonate</dt>
                <form method="POST" action="{{ route('admin.users.impersonate', $user->id) }}" class="inline">
                    @csrf
                    <button type="submit" class="btn" style="background:#d97706;color:#fff;" onclick="return confirm('Generate an impersonation token for {{ $user->email }}? This will revoke all their existing tokens.')">
                        Generate Impersonation Token
                    </button>
                </form>
                <dd style="font-size:0.75rem;color:#64748b;margin-top:0.75rem;">
                    Creates a new API token and revokes all existing ones. Use the token to access the API as this user.
                </dd>
            </div>

            {{-- Delete / Restore --}}
            <div class="detail-card">
                <dt class="section-heading">Danger Zone</dt>
                @if ($user->trashed())
                    <form method="POST" action="{{ route('admin.users.restore', $user->id) }}" class="inline">
                        @csrf
                        <button type="submit" class="btn btn-primary" onclick="return confirm('Restore this user?')">Restore User</button>
                    </form>
                @else
                    <form method="POST" action="{{ route('admin.users.delete', $user->id) }}" class="inline">
                        @csrf
                        <button type="submit" class="btn btn-danger" onclick="return confirm('Soft-delete this user and all their data?')">Delete User</button>
                    </form>
                @endif
            </div>

            {{-- Raw Data --}}
            <div class="detail-card">
                <dt class="section-heading">Raw Data</dt>
                <details>
                    <summary style="font-size:0.8125rem;color:#60a5fa;">View raw user record</summary>
                    <pre style="background:#0f172a;padding:1rem;border-radius:6px;margin-top:0.75rem;overflow-x:auto;font-size:0.6875rem;line-height:1.6;color:#94a3b8;white-space:pre-wrap;word-break:break-all;">{{ json_encode($user->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) }}</pre>
                </details>
            </div>

            {{-- Email Log --}}
            @if ($emailLogs->isNotEmpty())
                <div class="detail-card">
                    <dt class="section-heading">Recent Emails</dt>
                    <div class="table-wrap" style="margin:0;">
                        <table>
                            <thead><tr><th>Type</th><th>Sent</th></tr></thead>
                            <tbody>
                                @foreach ($emailLogs as $log)
                                    <tr>
                                        <td><span class="badge badge-active">{{ $log->email_type }}</span></td>
                                        <td style="font-size:0.8125rem;color:#94a3b8;">{{ $log->sent_at->diffForHumans() }}</td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
