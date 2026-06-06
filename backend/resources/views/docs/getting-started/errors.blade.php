@extends('layouts.docs')

@section('title', 'Errors')

@php
    $base = config('api.base_url');
@endphp

@section('content')
<div class="page-header">
    <p class="page-header__eyebrow">Getting Started</p>
    <h1 id="errors">Errors</h1>
    <p class="page-header__lead">
        {{ config('api.name') }} uses conventional HTTP status codes to indicate the success or failure of every request.
        Codes in the <code>2xx</code> range indicate success, <code>4xx</code> indicate a client error, and <code>5xx</code> indicate a server error.
    </p>
</div>

<section class="section">
    <h2 id="status-codes">Status codes</h2>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Code</th><th>Meaning</th><th>When you'll see it</th></tr></thead>
            <tbody>
                <tr><td><span class="status-pill status-pill--success">200</span></td><td>OK</td><td>Request succeeded.</td></tr>
                <tr><td><span class="status-pill status-pill--success">201</span></td><td>Created</td><td>Resource was created.</td></tr>
                <tr><td><span class="status-pill status-pill--success">204</span></td><td>No Content</td><td>Success, no body returned (e.g. DELETE).</td></tr>
                <tr><td><span class="status-pill status-pill--warn">400</span></td><td>Bad Request</td><td>The request is malformed.</td></tr>
                <tr><td><span class="status-pill status-pill--warn">401</span></td><td>Unauthorized</td><td>Missing or invalid API key.</td></tr>
                <tr><td><span class="status-pill status-pill--warn">403</span></td><td>Forbidden</td><td>The key is valid but not allowed for this action.</td></tr>
                <tr><td><span class="status-pill status-pill--warn">404</span></td><td>Not Found</td><td>Resource doesn't exist.</td></tr>
                <tr><td><span class="status-pill status-pill--warn">409</span></td><td>Conflict</td><td>e.g. duplicate resource.</td></tr>
                <tr><td><span class="status-pill status-pill--warn">422</span></td><td>Unprocessable Entity</td><td>Validation failed.</td></tr>
                <tr><td><span class="status-pill status-pill--warn">429</span></td><td>Too Many Requests</td><td>You've hit the rate limit.</td></tr>
                <tr><td><span class="status-pill status-pill--danger">500</span></td><td>Server Error</td><td>Something went wrong on our end.</td></tr>
            </tbody>
        </table>
    </div>
</section>

<section class="section">
    <h2 id="error-shape">Error response shape</h2>
    <p>All error responses share a common JSON shape:</p>

    @include('partials.code-block', [
        'id'       => 'error-shape',
        'language' => 'json',
        'title'    => 'ERROR JSON',
        'code'     => '{
  "message": "A short, human-readable summary.",
  "errors": {
    "email": ["The email field is required."]
  }
}',
    ])
    <p class="muted">The <code>errors</code> object is only included for <code>422</code> validation responses.</p>
</section>

<section class="section">
    <h2 id="validation-422">422 — Validation</h2>
    <p>Returned when the request body fails validation rules.</p>

    @include('partials.code-block', [
        'id'       => 'error-422',
        'language' => 'json',
        'title'    => '422 Unprocessable Entity',
        'code'     => '{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}',
    ])
</section>

<section class="section">
    <h2 id="auth-401">401 — Unauthenticated</h2>
    @include('partials.code-block', [
        'id'       => 'error-401',
        'language' => 'json',
        'title'    => '401 Unauthorized',
        'code'     => '{
  "message": "Unauthenticated."
}',
    ])
</section>

<section class="section">
    <h2 id="forbidden-403">403 — Forbidden</h2>
    <p>The token is valid but the user is not allowed to perform this action.</p>
    @include('partials.code-block', [
        'id'       => 'error-403',
        'language' => 'json',
        'title'    => '403 Forbidden',
        'code'     => '{
  "message": "This action is unauthorized."
}',
    ])

    <h3>403 from the <code>verified</code> middleware</h3>
    <p>Bulk writers (<code>/transactions/sync</code>, <code>/import/store</code>, <code>/import/kuda/store</code>) require a verified email. The response includes a hint so the SPA can show a verification banner:</p>
    @include('partials.code-block', [
        'id'       => 'error-403-verified',
        'language' => 'json',
        'title'    => '403 Forbidden (email not verified)',
        'code'     => '{
  "message": "Your email address is not verified.",
  "requires_verified_email": true
}',
    ])
</section>

<section class="section">
    <h2 id="not-found-404">404 — Not Found</h2>
    @include('partials.code-block', [
        'id'       => 'error-404',
        'language' => 'json',
        'title'    => '404 Not Found',
        'code'     => '{
  "message": "The requested resource was not found."
}',
    ])
</section>

<section class="section">
    <h2 id="server-500">500 — Server Error</h2>
    @include('partials.code-block', [
        'id'       => 'error-500',
        'language' => 'json',
        'title'    => '500 Server Error',
        'code'     => '{
  "message": "Something went wrong on our end. Please try again."
}',
    ])
    <p class="muted">
        Retry <code>5xx</code> responses using exponential backoff. If the issue persists,
        contact <a href="mailto:[email protected]">support</a> with the request ID from the response headers.
    </p>
</section>
@endsection

@push('code-examples')
@php
    $base = config('api.base_url');
    $errCurl = "# Inspect the HTTP status code
curl -i {$base}/summary";

    $errJs = "const res = await fetch(url, { headers });

if (!res.ok) {
  const error = await res.json();
  console.error(res.status, error.message);
  if (error.errors) console.table(error.errors);
  throw new Error(error.message);
}

return res.json();";

    $errPhp = "\$res = json_decode(\$body, true);
if (\$status >= 400) {
    throw new RuntimeException(\$res['message'] ?? 'Unknown error', \$status);
}
return \$res;";

    $errPython = "try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
except requests.HTTPError as e:
    body = e.response.json()
    print(body.get('message'))
    raise";
@endphp

<div class="code-panel__sticky">
    <h4 class="code-panel__title">Handle errors safely</h4>
    @include('partials.code-tabs', [
        'id'     => 'error-handling-snippet',
        'curl'   => $errCurl,
        'js'     => $errJs,
        'php'    => $errPhp,
        'python' => $errPython,
    ])
</div>
@endpush
