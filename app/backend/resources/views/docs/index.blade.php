@extends('layouts.docs')

@section('title', 'API Documentation')

@php
    $base = config('api.base_url');
    $name = config('api.name');
@endphp

@section('content')
<section class="hero">
    <p class="hero__eyebrow">Documentation</p>
    <h1 class="hero__title">Pasona Finance Tracker API</h1>
    <p class="hero__subtitle">
        A JSON-based REST API for managing users, accounts, categories, and transactions.
        Authenticate with a Sanctum bearer token, send JSON, get JSON back. Use the
        <strong>Try it</strong> panel on the right to send a real request from this page.
    </p>
    <div class="hero__actions">
        <a href="{{ route('docs.getting-started.authentication') }}" class="btn btn--primary">Authenticate your first request</a>
        <a href="{{ route('docs.endpoints.summary') }}" class="btn btn--secondary">Browse the API reference</a>
    </div>

    <div class="hero__base-url">
        <span class="hero__base-label">Base URL</span>
        <code>{{ $base }}</code>
    </div>
</section>

<section class="quick-start">
    <h2>Quick start</h2>
    <p class="muted">The endpoints you'll reach for most often.</p>

    <div class="cards">
        <a href="{{ route('docs.endpoints.auth') }}" class="card">
            <div class="card__icon card__icon--blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h3>Authentication</h3>
            <p>Register a user, log in to get a bearer token, and revoke it on logout.</p>
        </a>

        <a href="{{ route('docs.endpoints.accounts') }}" class="card">
            <div class="card__icon card__icon--green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/></svg>
            </div>
            <h3>Accounts</h3>
            <p>Manage bank, mobile money, and cash accounts. Balances are calculated from transactions.</p>
        </a>

        <a href="{{ route('docs.endpoints.transactions') }}" class="card">
            <div class="card__icon card__icon--purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3>Transactions</h3>
            <p>Record income, expenses, and transfers. Includes duplicate detection and an offline sync endpoint.</p>
        </a>

        <a href="{{ route('docs.endpoints.summary') }}" class="card">
            <div class="card__icon card__icon--cyan">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            </div>
            <h3>Dashboard summary</h3>
            <p>One call to <code>{{ $base }}/summary</code> returns totals, monthly income/expense, and the category breakdown.</p>
        </a>

        <a href="{{ route('docs.endpoints.import') }}" class="card">
            <div class="card__icon card__icon--orange">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <h3>CSV import</h3>
            <p>Bulk-import a bank statement. Preview flags duplicates, store commits the chosen rows.</p>
        </a>

        <a href="{{ route('docs.getting-started.errors') }}" class="card">
            <div class="card__icon card__icon--pink">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3>Errors &amp; status codes</h3>
            <p>Understand HTTP status codes, validation responses, and how to handle them.</p>
        </a>
    </div>
</section>

<section class="callout callout--info">
    <strong>📬 Now with email.</strong>
    The API ships with a complete mailing system &mdash; <a href="{{ route('docs.endpoints.auth') }}#email-verification">opt-in email verification</a>, <a href="{{ route('docs.endpoints.auth') }}#forgot-password">password reset</a>, and a <a href="{{ route('docs.guides') }}">daily transaction-logging reminder</a>. See the <a href="{{ route('docs.endpoints.auth') }}">Authentication</a> page for the full list of mail-driven endpoints.
</section>

<section class="callout callout--info">
    <strong>Need help?</strong>
    Email <a href="mailto:[email protected]">[email protected]</a> or open an issue on the project repository.
</section>
@endsection

@push('code-examples')
@php
    $base = config('api.base_url');
@endphp

<div class="code-panel__sticky">
    <h4 class="code-panel__title">Sample requests</h4>

    @php
        $loginCurl = "curl -X POST {$base}/login \\
  -H \"Accept: application/json\" \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"email\": \"[email protected]\",
    \"password\": \"supersecret123\"
  }'";

        $loginJs = "const res = await fetch('{$base}/login', {
  method: 'POST',
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: '[email protected]', password: 'supersecret123' }),
});
const { access_token } = await res.json();
localStorage.setItem('token', access_token);";

        $loginPhp = "\$ch = curl_init('{$base}/login');
curl_setopt_array(\$ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Accept: application/json',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS     => json_encode([
        'email'    => '[email protected]',
        'password' => 'supersecret123',
    ]),
]);
\$response = json_decode(curl_exec(\$ch), true);
\$token    = \$response['access_token'];";

        $loginPython = "import requests

res = requests.post(
    '{$base}/login',
    headers={'Accept': 'application/json'},
    json={'email': '[email protected]', 'password': 'supersecret123'},
)
token = res.json()['access_token']";
    @endphp

    <p class="code-panel__lead">1. Log in to get a token</p>
    @include('partials.code-tabs', [
        'id'     => 'index-login',
        'curl'   => $loginCurl,
        'js'     => $loginJs,
        'php'    => $loginPhp,
        'python' => $loginPython,
    ])

    @php
        $txCurl = "curl -X POST {$base}/transactions \\
  -H \"Authorization: Bearer YOUR_TOKEN\" \\
  -H \"Accept: application/json\" \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"account_id\": 1,
    \"category_id\": 2,
    \"type\": \"expense\",
    \"amount\": 25.50,
    \"description\": \"Lunch with team\",
    \"transaction_date\": \"2026-06-03\"
  }'";

        $txJs = "await fetch('{$base}/transactions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    account_id: 1,
    category_id: 2,
    type: 'expense',
    amount: 25.50,
    description: 'Lunch with team',
    transaction_date: '2026-06-03',
  }),
});";

        $txPhp = "\$ch = curl_init('{$base}/transactions');
curl_setopt_array(\$ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer YOUR_TOKEN',
        'Accept: application/json',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS     => json_encode([
        'account_id'       => 1,
        'category_id'      => 2,
        'type'             => 'expense',
        'amount'           => 25.50,
        'description'      => 'Lunch with team',
        'transaction_date' => '2026-06-03',
    ]),
]);
\$transaction = json_decode(curl_exec(\$ch), true);";

        $txPython = "import requests

requests.post(
    '{$base}/transactions',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'account_id': 1,
        'category_id': 2,
        'type': 'expense',
        'amount': 25.50,
        'description': 'Lunch with team',
        'transaction_date': '2026-06-03',
    },
)";
    @endphp

    <p class="code-panel__lead">2. Record a transaction</p>
    @include('partials.code-tabs', [
        'id'     => 'index-transaction',
        'curl'   => $txCurl,
        'js'     => $txJs,
        'php'    => $txPhp,
        'python' => $txPython,
    ])
</div>
@endpush
