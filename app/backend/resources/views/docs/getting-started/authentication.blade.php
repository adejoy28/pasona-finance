@extends('layouts.docs')

@section('title', 'Authentication')

@php
    $base = config('api.base_url');
    $name = config('api.name');
@endphp

@section('content')
<div class="page-header">
    <p class="page-header__eyebrow">Getting Started</p>
    <h1 id="authentication">Authentication</h1>
    <p class="page-header__lead">
        {{ $name }} uses <strong>Sanctum bearer token</strong> authentication. You receive a token
        when you register or log in, and you must include it in the <code>Authorization</code>
        header of every request to a protected endpoint.
    </p>
</div>

<section class="section">
    <div class="callout callout--warn">
        <strong>Keep your access tokens safe.</strong>
        Never expose bearer tokens in client-side JavaScript, public repositories, or browser-bundled code.
        Treat them like passwords.
    </div>
</section>

<section class="section">
    <h2 id="generate-key">1. Get a token</h2>
    <p>Call <code>POST {{ $base }}/login</code> with your email and password, or <code>POST {{ $base }}/register</code> to create a new account. The response includes an <code>access_token</code> that you can use on every subsequent request.</p>

    @php
        $loginExample = "curl -X POST {$base}/login \\\n  -H \"Accept: application/json\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"email\": \"[email protected]\",\n    \"password\": \"supersecret123\"\n  }'";
    @endphp

    @include('partials.code-block', [
        'id'       => 'auth-get-token',
        'language' => 'bash',
        'title'    => 'REQUEST',
        'code'     => $loginExample,
    ])

    <p>The response includes a Sanctum personal-access token:</p>

    @include('partials.code-block', [
        'id'       => 'auth-get-token-resp',
        'language' => 'json',
        'title'    => 'RESPONSE',
        'code'     => '{
  "access_token": "1|abc123def456...",
  "token_type": "Bearer",
  "user": { "id": 1, "name": "Jane Doe", "email": "[email protected]" }
}',
    ])
</section>

<section class="section">
    <h2 id="bearer-header">2. Pass it in the Authorization header</h2>
    <p>For every authenticated request, add this header:</p>

    @include('partials.code-block', [
        'id'       => 'bearer-header',
        'language' => 'http',
        'title'    => 'HEADER',
        'code'     => "Authorization: Bearer YOUR_ACCESS_TOKEN",
    ])

    <p>You may also need:</p>

    @include('partials.code-block', [
        'id'       => 'common-headers',
        'language' => 'http',
        'title'    => 'COMMON HEADERS',
        'code'     => "Authorization: Bearer YOUR_ACCESS_TOKEN\nAccept: application/json\nContent-Type: application/json",
    ])
</section>

<section class="section">
    <h2 id="full-example">3. Full example: authenticated request</h2>
    <p>
        Below is a complete example of an authenticated <code>POST</code> request to
        <code>{{ $base }}/transactions</code>.
    </p>

    @php
        $fullCurl = "curl -X POST {$base}/transactions \\
  -H \"Authorization: Bearer YOUR_ACCESS_TOKEN\" \\
  -H \"Accept: application/json\" \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"account_id\": 1,
    \"type\": \"expense\",
    \"amount\": 25.50,
    \"description\": \"Lunch with team\",
    \"transaction_date\": \"2026-06-03\"
  }'";

        $fullJs = "const response = await fetch('{$base}/transactions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    account_id: 1,
    type: 'expense',
    amount: 25.50,
    description: 'Lunch with team',
    transaction_date: '2026-06-03',
  }),
});

if (!response.ok) {
  throw new Error(`Request failed: \${response.status}`);
}

const data = await response.json();
console.log(data);";

        $fullPhp = "\$ch = curl_init('{$base}/transactions');
curl_setopt_array(\$ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer YOUR_ACCESS_TOKEN',
        'Accept: application/json',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'account_id'       => 1,
        'type'             => 'expense',
        'amount'           => 25.50,
        'description'      => 'Lunch with team',
        'transaction_date' => '2026-06-03',
    ]),
]);

\$response = curl_exec(\$ch);
\$status   = curl_getinfo(\$ch, CURLINFO_HTTP_CODE);
curl_close(\$ch);

if (\$status >= 400) {
    throw new RuntimeException('Request failed: ' . \$status);
}

print_r(json_decode(\$response, true));";

        $fullPython = "import requests

response = requests.post(
    '{$base}/transactions',
    headers={
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
    json={
        'account_id': 1,
        'type': 'expense',
        'amount': 25.50,
        'description': 'Lunch with team',
        'transaction_date': '2026-06-03',
    },
)
response.raise_for_status()
print(response.json())";
    @endphp

    @include('partials.code-tabs', [
        'id'     => 'auth-full-example',
        'curl'   => $fullCurl,
        'js'     => $fullJs,
        'php'    => $fullPhp,
        'python' => $fullPython,
    ])
</section>

<section class="section">
    <h2 id="rotating">Rotating &amp; revoking tokens</h2>
    <p>
        Call <code>POST {{ $base }}/logout</code> to revoke the token used for the current request.
        If a token is leaked, log in again to receive a fresh one and treat the leaked token as compromised.
    </p>
</section>

<section class="section">
    <h2 id="errors">Authentication errors</h2>
    <p>If your token is missing, malformed, or revoked, the API will respond with <code>401 Unauthorized</code>:</p>

    @include('partials.code-block', [
        'id'       => 'auth-error-401',
        'language' => 'json',
        'title'    => '401 Unauthorized',
        'code'     => '{
  "message": "Unauthenticated."
}',
    ])
</section>

<section class="section">
    <h2 id="email-verification">Email verification (opt-in)</h2>
    <p>
        The <code>User</code> model implements <code>MustVerifyEmail</code>. A verification
        email is queued automatically on <a href="{{ route('docs.endpoints.auth') }}#register">register</a>
        &mdash; the response includes <code>email_verified: false</code> until the user clicks the link.
    </p>
    <p>
        Verification is <strong>not required</strong> to use the API. The only endpoints that
        return a <code>403</code> for unverified users are the <strong>sensitive bulk writers</strong>:
        <code>POST /api/transactions/sync</code>, <code>POST /api/import/store</code>, and
        <code>POST /api/import/kuda/store</code>. Those return
        <code>{ "message": "Your email address is not verified.", "requires_verified_email": true }</code>
        so the frontend can prompt the user to verify.
    </p>
    <p>
        The SPA can poll <code>GET /api/email/verification-status</code> to decide whether
        to render a &ldquo;please confirm your email&rdquo; banner without fetching the full
        profile, and call <code>POST /api/email/verification-notification</code> (throttled
        6/min) to resend the link.
    </p>
    <p>
        Google OAuth (<code>GET /api/auth/google</code>) auto-verifies the user on first
        login, so users who sign in with Google never see the verification banner.
    </p>
    <p>Full reference on the <a href="{{ route('docs.endpoints.auth') }}#email-verification">Authentication</a> page.</p>
</section>
@endsection

@push('code-examples')
@php
    $base = config('api.base_url');
    $quickCurl = "curl {$base}/summary \\
  -H \"Authorization: Bearer YOUR_ACCESS_TOKEN\"";
@endphp

<div class="code-panel__sticky">
    <h4 class="code-panel__title">Quick reference</h4>
    @include('partials.code-block', [
        'id'       => 'auth-quick',
        'language' => 'bash',
        'title'    => 'cURL',
        'code'     => $quickCurl,
    ])

    <p class="muted small">
        Always send requests over HTTPS. Plain HTTP requests are rejected.
    </p>
</div>
@endpush
