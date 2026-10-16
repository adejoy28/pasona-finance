@extends('layouts.docs')

@section('title', 'Overview')

@php
    $base = config('api.base_url');
@endphp

@section('content')
<div class="page-header">
    <p class="page-header__eyebrow">Getting Started</p>
    <h1 id="overview">Overview</h1>
    <p class="page-header__lead">
        {{ config('api.name') }} is a JSON-based REST API for the Pasona Finance Tracker.
        All requests are made over HTTPS and authenticated using a Sanctum bearer token.
    </p>
</div>

<section class="section">
    <h2 id="base-url">Base URL</h2>
    <p>Every endpoint in this documentation is relative to the following base URL:</p>
    @include('partials.code-block', [
        'id'       => 'base-url-block',
        'language' => 'bash',
        'title'    => 'BASE URL',
        'code'     => $base,
    ])
</section>

<section class="section">
    <h2 id="conventions">Conventions</h2>
    <ul class="bullet-list">
        <li>All request bodies and responses are <strong>JSON</strong>.</li>
        <li>Timestamps follow <strong>ISO 8601</strong> (e.g. <code>2026-06-03T12:00:00Z</code>).</li>
        <li>Monetary amounts are returned as <strong>strings with two decimals</strong> on stored values and as <strong>numbers</strong> on calculated values like <code>balance</code> and <code>monthly_summary</code>.</li>
        <li>All resource IDs are <strong>integers</strong>.</li>
    </ul>
</section>

<section class="section">
    <h2 id="required-headers">Required headers</h2>
    <p>Every request must include the following headers:</p>

    <div class="table-wrap">
        <table class="params-table">
            <thead>
                <tr><th>Header</th><th>Value</th><th>Description</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td><code>Accept</code></td>
                    <td><code>application/json</code></td>
                    <td>Tells the API to return a JSON response.</td>
                </tr>
                <tr>
                    <td><code>Content-Type</code></td>
                    <td><code>application/json</code></td>
                    <td>Required when sending a request body.</td>
                </tr>
                <tr>
                    <td><code>Authorization</code></td>
                    <td><code>Bearer {token}</code></td>
                    <td>Your API key. Required for all protected endpoints.</td>
                </tr>
            </tbody>
        </table>
    </div>
</section>

<section class="section">
    <h2 id="environments">Environments</h2>
    <p>The API runs alongside the Laravel backend. In development, the same base URL is used for both local and production traffic — just point your client at the backend's host.</p>

    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Environment</th><th>Base URL</th><th>Notes</th></tr></thead>
            <tbody>
                <tr>
                    <td><span class="env-pill env-pill--sandbox">Local</span></td>
                    <td><code>http://localhost:8000{{ $base }}</code></td>
                    <td>Default Laravel <code>php artisan serve</code> port.</td>
                </tr>
                <tr>
                    <td><span class="env-pill env-pill--live">Live</span></td>
                    <td><code>{{ $base }}</code></td>
                    <td>Production. Configure with the <code>API_BASE_URL</code> env variable.</td>
                </tr>
            </tbody>
        </table>
    </div>
</section>

<section class="section">
    <h2 id="next-steps">Next steps</h2>
    <ul class="next-steps">
        <li><a href="{{ route('docs.getting-started.authentication') }}">Authentication &rarr;</a></li>
        <li><a href="{{ route('docs.getting-started.errors') }}">Errors &rarr;</a></li>
        <li><a href="{{ route('docs.getting-started.rate-limiting') }}">Rate Limiting &rarr;</a></li>
    </ul>
</section>
@endsection

@push('code-examples')
@php
    $base = config('api.base_url');
    $curlCode = "curl {$base}/summary \\
  -H \"Authorization: Bearer YOUR_TOKEN\" \\
  -H \"Accept: application/json\"";

    $jsCode = "fetch('{$base}/summary', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(r => r.json()).then(console.log);";

    $phpCode = "\$response = file_get_contents('{$base}/summary', false, stream_context_create([
    'http' => [ 'header' => 'Authorization: Bearer YOUR_TOKEN' ]
]));
echo \$response;";

    $pythonCode = "import requests
r = requests.get('{$base}/summary',
    headers={'Authorization': f'Bearer {token}'})
print(r.json())";
@endphp

<div class="code-panel__sticky">
    <h4 class="code-panel__title">Make an authenticated request</h4>
    @include('partials.code-tabs', [
        'id'     => 'overview-snippet',
        'curl'   => $curlCode,
        'js'     => $jsCode,
        'php'    => $phpCode,
        'python' => $pythonCode,
    ])
</div>
@endpush
