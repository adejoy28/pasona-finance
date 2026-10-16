@extends('layouts.docs')

@section('title', 'Rate Limiting')

@php
    $base = config('api.base_url');
@endphp

@section('content')
<div class="page-header">
    <p class="page-header__eyebrow">Getting Started</p>
    <h1 id="rate-limiting">Rate Limiting</h1>
    <p class="page-header__lead">
        To keep the API healthy for everyone, requests are limited per API key.
        When you exceed the limit, the API responds with <code>429 Too Many Requests</code>.
    </p>
</div>

<section class="section">
    <h2 id="limits">Limits</h2>
    <p>Throttling is handled by Laravel's <code>throttle</code> middleware. The exact per-route limits are configured in <code>backend/routes/api.php</code> &mdash; consult the file for the current values. As a guideline, the application targets:</p>

    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Plan</th><th>Requests / minute</th><th>Burst</th></tr></thead>
            <tbody>
                <tr><td>Local / development</td><td>Unlimited</td><td>&mdash;</td></tr>
                <tr><td>Standard</td><td>60</td><td>10</td></tr>
                <tr><td>High-volume partner</td><td>600</td><td>50</td></tr>
            </tbody>
        </table>
    </div>
</section>

<section class="section">
    <h2 id="rate-headers">Response headers</h2>
    <p>Every API response includes the standard Laravel throttle headers so you can track your usage:</p>

    @include('partials.code-block', [
        'id'       => 'rate-headers',
        'language' => 'http',
        'title'    => 'RESPONSE HEADERS',
        'code'     => "X-RateLimit-Limit: 60\nX-RateLimit-Remaining: 47\nRetry-After: 32",
    ])

    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Header</th><th>Description</th></tr></thead>
            <tbody>
                <tr><td><code>X-RateLimit-Limit</code></td><td>Your maximum requests per minute.</td></tr>
                <tr><td><code>X-RateLimit-Remaining</code></td><td>How many requests remain in the current window.</td></tr>
                <tr><td><code>Retry-After</code></td><td>Seconds until the next request will be accepted (only set on <code>429</code> responses).</td></tr>
            </tbody>
        </table>
    </div>
</section>

<section class="section">
    <h2 id="429">When you hit the limit — 429</h2>
    @include('partials.code-block', [
        'id'       => 'rate-429',
        'language' => 'json',
        'title'    => '429 Too Many Requests',
        'code'     => '{
  "message": "Too many requests. Try again in 60 seconds.",
  "retry_after": 60
}',
    ])
</section>

<section class="section">
    <h2 id="best-practices">Best practices</h2>
    <ul class="bullet-list">
                <li>Cache responses where possible (especially list endpoints).</li>
                <li>Implement exponential backoff with jitter for retries.</li>
                <li>Use webhooks instead of polling.</li>
                <li>Batch requests when supported (see the <a href="{{ route('docs.endpoints.transactions') }}">sync endpoint</a>).</li>
    </ul>
</section>
@endsection

@push('code-examples')
@php
    $base = config('api.base_url');
    $rlCurl = "# cURL has no native retry. Wrap in a shell loop:
for i in 1 2 3; do
  curl -sf {$base}/summary && break
  sleep \$((2 ** i))
done";

    $rlJs = "async function withRetry(fn, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      if (e.status !== 429 || i === attempts - 1) throw e;
      await new Promise(r => setTimeout(r, (2 ** i) * 1000 + Math.random() * 500));
    }
  }
}";

    $rlPhp = "function with_retry(callable \$fn, int \$attempts = 5) {
    for (\$i = 0; \$i < \$attempts; \$i++) {
        try { return \$fn(); }
        catch (RuntimeException \$e) {
            if (\$e->getCode() !== 429 || \$i === \$attempts - 1) throw \$e;
            usleep((2 ** \$i) * 1000000 + random_int(0, 500000));
        }
    }
}";

    $rlPython = "import time, random

def with_retry(fn, attempts=5):
    for i in range(attempts):
        try: return fn()
        except requests.HTTPError as e:
            if e.response.status_code != 429 or i == attempts - 1:
                raise
            time.sleep((2 ** i) + random.random())";
@endphp

<div class="code-panel__sticky">
    <h4 class="code-panel__title">Retry with backoff</h4>
    @include('partials.code-tabs', [
        'id'     => 'backoff-snippet',
        'curl'   => $rlCurl,
        'js'     => $rlJs,
        'php'    => $rlPhp,
        'python' => $rlPython,
    ])
</div>
@endpush
