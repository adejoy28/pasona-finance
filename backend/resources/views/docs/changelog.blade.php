@extends('layouts.docs')

@section('title', 'Changelog')

@section('content')
<div class="page-header">
    <p class="page-header__eyebrow">Changelog</p>
    <h1 id="changelog">Release notes</h1>
    <p class="page-header__lead">
        Stay up to date with the latest changes to the {{ config('api.name') }} API.
    </p>
</div>

<section class="section">
    <div class="changelog">
        <article class="changelog__entry">
            <header class="changelog__header">
                <span class="changelog__date">June 06, 2026</span>
                <span class="changelog__tag changelog__tag--new">New</span>
            </header>
            <h2>v1.1.0 — Mailing system &amp; opt-in email verification</h2>
            <ul class="bullet-list">
                <li><strong>Opt-in email verification.</strong> The <code>User</code> model implements <code>MustVerifyEmail</code>; a verification email is queued on register. Endpoints <code>GET /api/email/verify/{id}/{hash}</code> (signed), <code>POST /api/email/verification-notification</code> (resend, throttled 6/min), and <code>GET /api/email/verification-status</code> are now available. Google OAuth auto-flips <code>email_verified_at</code> on first login.</li>
                <li><strong>Sensitive writers are now gated.</strong> <code>POST /api/transactions/sync</code>, <code>POST /api/import/store</code>, and <code>POST /api/import/kuda/store</code> return <code>403 { "requires_verified_email": true }</code> for unverified users. Read endpoints are unaffected.</li>
                <li><strong>Daily reminder email.</strong> New <code>artisan reminders:send-daily</code> command (scheduled every 5 minutes in <code>routes/console.php</code>) emails each user at their <code>reminder_time</code> with a personalised today-stats panel. Smart-skips users who already logged today and dedupes via <code>users.reminder_last_sent_at</code>.</li>
                <li><strong>Polished password-reset email.</strong> The reset-password mail is now a queued Markdown mailable (<code>resources/views/emails/reset-password.blade.php</code>) with a one-click link to the SPA reset form.</li>
                <li><strong>New endpoints documented.</strong> Kuda import (<code>/api/import/kuda/preview</code>, <code>/api/import/kuda/store</code>) and the email-availability probe (<code>GET /api/auth/check-email</code>) are now in the reference.</li>
                <li><strong>API surface tweak.</strong> <code>POST /api/register</code> and <code>POST /api/login</code> now return <code>email_verified</code> + <code>email_verified_at</code>. <code>GET /api/me</code> now returns <code>reminder_time</code> and <code>reminder_last_sent_at</code>.</li>
            </ul>
        </article>

        <article class="changelog__entry">
            <header class="changelog__header">
                <span class="changelog__date">June 03, 2026</span>
                <span class="changelog__tag changelog__tag--new">New</span>
            </header>
            <h2>v1.0.0 — Public API launch</h2>
            <ul class="bullet-list">
                <li>Added <code>POST /register</code>, <code>POST /login</code>, <code>POST /logout</code>, and <code>GET /me</code> for authentication.</li>
                <li>Added full CRUD on <code>/accounts</code>, <code>/categories</code>, and <code>/transactions</code>.</li>
                <li>Added <code>POST /transactions/sync</code> for offline batch upload via a queue job.</li>
                <li>Added <code>POST /import/preview</code> and <code>POST /import/store</code> for CSV bank-statement import with duplicate detection.</li>
                <li>Added <code>GET /summary</code> for the dashboard data (totals, monthly summary, category breakdown).</li>
                <li>Added Google OAuth via <code>/auth/google</code> and <code>/auth/google/callback</code>.</li>
            </ul>
        </article>

        <article class="changelog__entry">
            <header class="changelog__header">
                <span class="changelog__date">May 12, 2026</span>
                <span class="changelog__tag changelog__tag--improved">Improved</span>
            </header>
            <h2>v0.9.0 — Duplicate detection tuning</h2>
            <ul class="bullet-list">
                <li>Duplicate checks now match on <code>transaction_date</code>, <code>type</code>, <code>amount</code>, and <code>account_id</code>.</li>
                <li>Pass <code>"force": true</code> in the request body to skip the duplicate check.</li>
            </ul>
        </article>

        <article class="changelog__entry">
            <header class="changelog__header">
                <span class="changelog__date">April 02, 2026</span>
                <span class="changelog__tag changelog__tag--breaking">Breaking</span>
            </header>
            <h2>v0.8.0 — Sanctum token rotation</h2>
            <p>This release introduced the Sanctum bearer-token format. Personal-access tokens issued before this date are invalid.</p>
            <ul class="bullet-list">
                <li>All authenticated endpoints now expect an <code>Authorization: Bearer ...</code> header.</li>
                <li>Call <code>POST /login</code> to obtain a fresh token.</li>
            </ul>
        </article>
    </div>
</section>
@endsection
