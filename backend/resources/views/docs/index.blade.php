@extends('layouts.docs')

@section('title', 'API Documentation')

@php
    $base = config('api.base_url');
    $name = config('api.name');
@endphp

@section('content')
<section class="hero">
    <p class="hero__eyebrow">Documentation</p>
    <h1 class="hero__title">Start building with {{ $name }}</h1>
    <p class="hero__subtitle">
        A JSON-based REST API for the Pasona Finance Tracker. Authenticate with Sanctum bearer tokens,
        send JSON, get JSON back. No SDKs required to get started.
    </p>
    <div class="hero__actions">
        <a href="{{ route('docs.getting-started.authentication') }}" class="btn btn--primary">Authenticate your first request</a>
        <a href="{{ route('docs.endpoints.transactions') }}" class="btn btn--secondary">Browse the API reference</a>
    </div>

    <div class="hero__base-url">
        <span class="hero__base-label">Base URL</span>
        <code>{{ $base }}</code>
    </div>
</section>

<section class="quick-start">
    <h2>Quick start</h2>
    <p class="muted">Common things developers do in their first hour with {{ $name }}.</p>

    <div class="cards">
        <a href="{{ route('docs.getting-started.authentication') }}" class="card">
            <div class="card__icon card__icon--blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h3>Authentication</h3>
            <p>Register a user, log in, and learn how to send the Sanctum bearer token on every request.</p>
        </a>

        <a href="{{ route('docs.endpoints.transactions') }}" class="card">
            <div class="card__icon card__icon--green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 18l6-6-6-6"/></svg>
            </div>
            <h3>Make your first API call</h3>
            <p>Send a test request to <code>{{ $base }}/summary</code> and inspect the response.</p>
        </a>

        <a href="{{ route('docs.sdks') }}" class="card">
            <div class="card__icon card__icon--purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <h3>Install an SDK</h3>
            <p>Use our official libraries for PHP, JavaScript, Python, and more to speed up integration.</p>
        </a>

        <a href="{{ route('docs.getting-started.errors') }}" class="card">
            <div class="card__icon card__icon--orange">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3>Error handling</h3>
            <p>Understand status codes, validation messages, and how to gracefully handle failures.</p>
        </a>

        <a href="{{ route('docs.guides') }}" class="card">
            <div class="card__icon card__icon--pink">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <h3>Guides &amp; tutorials</h3>
            <p>End-to-end walkthroughs for common use-cases — onboarding, webhooks, reconciliation.</p>
        </a>

        <a href="{{ route('docs.changelog') }}" class="card">
            <div class="card__icon card__icon--cyan">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h3>What's new</h3>
            <p>Stay up to date with the latest API releases, deprecations, and breaking changes.</p>
        </a>
    </div>
</section>

<section class="callout callout--info">
    <strong>Need help?</strong>
    Email <a href="mailto:[email protected]">[email protected]</a> or chat with us in the developer Slack.
</section>
@endsection

@push('code-examples')
@php
    $base = config('api.base_url');
    $curlCode = "curl -X GET {$base}/summary \\
  -H \"Authorization: Bearer YOUR_TOKEN\" \\
  -H \"Accept: application/json\"";

    $jsCode = "const res = await fetch('{$base}/summary', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/json'
  }
});
const data = await res.json();
console.log(data);";

    $phpCode = "\$ch = curl_init('{$base}/summary');
curl_setopt_array(\$ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer YOUR_TOKEN',
        'Accept: application/json',
    ],
]);
\$response = curl_exec(\$ch);
curl_close(\$ch);
echo \$response;";

    $pythonCode = "import requests

response = requests.get(
    '{$base}/summary',
    headers={
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json',
    },
)
print(response.json())";
@endphp

<div class="code-panel__sticky">
    <h4 class="code-panel__title">Your first request</h4>
    <p class="code-panel__lead">Send an authenticated GET request to confirm everything is wired up.</p>

    @include('partials.code-tabs', [
        'id'     => 'first-request',
        'curl'   => $curlCode,
        'js'     => $jsCode,
        'php'    => $phpCode,
        'python' => $pythonCode,
    ])
</div>
@endpush
