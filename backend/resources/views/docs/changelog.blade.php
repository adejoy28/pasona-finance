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
