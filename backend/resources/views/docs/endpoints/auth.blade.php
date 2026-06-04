@extends('layouts.docs')

@section('title', 'Authentication API')

@php
    $base = config('api.base_url');
@endphp

@section('content')
<div class="page-header">
    <p class="page-header__eyebrow">API Reference</p>
    <h1 id="auth">Authentication</h1>
    <p class="page-header__lead">
        Register, log in, manage your session, and recover your password. The API uses
        <strong>Laravel Sanctum</strong> bearer tokens for protected routes.
    </p>
</div>

{{-- ─────────────────────────── ENDPOINT: Register ─────────────────────────── --}}
<section class="endpoint" id="register">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'POST'])
        <code class="endpoint__url">{{ $base }}/register</code>
        @include('partials.tryit-trigger', [
            'method' => 'POST',
            'path'   => '/register',
            'auth'   => false,
            'title'  => 'Register a new account',
        ])
    </header>
    <h2 class="endpoint__title">Register a new account</h2>
    <p>Creates a new user and immediately returns a Sanctum access token.</p>

    <h3>Request body</h3>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
                <tr>
                    <td><code>name</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>Full name. Max <code>255</code> characters.</td>
                </tr>
                <tr>
                    <td><code>email</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>Must be a valid, unique email address.</td>
                </tr>
                <tr>
                    <td><code>password</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>Minimum <code>8</code> characters.</td>
                </tr>
                <tr>
                    <td><code>password_confirmation</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>Must match <code>password</code>.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <h3>Request body example</h3>
    @include('partials.code-block', [
        'id'       => 'register-req',
        'language' => 'json',
        'title'    => 'REQUEST',
        'code'     => '{
  "name": "Jane Doe",
  "email": "[email protected]",
  "password": "supersecret123",
  "password_confirmation": "supersecret123"
}',
    ])

    <h3>Responses</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
            <button class="response-tabs__tab is-active" data-resp="200">200</button>
            <button class="response-tabs__tab" data-resp="422">422</button>
        </div>
        <div class="response-tabs__panel is-active" data-resp-panel="200">
            @include('partials.code-block', [
                'id'       => 'register-200',
                'language' => 'json',
                'title'    => '200 OK',
                'code'     => '{
  "access_token": "1|abc123def456...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "[email protected]"
  }
}',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="422">
            @include('partials.code-block', [
                'id'       => 'register-422',
                'language' => 'json',
                'title'    => '422 Unprocessable Entity',
                'code'     => '{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email has already been taken."],
    "password": ["The password must be at least 8 characters."]
  }
}',
            ])
        </div>
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Login ─────────────────────────── --}}
<section class="endpoint" id="login">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'POST'])
        <code class="endpoint__url">{{ $base }}/login</code>
        @include('partials.tryit-trigger', [
            'method' => 'POST',
            'path'   => '/login',
            'body'   => "{\n  \"email\": \"[email protected]\",\n  \"password\": \"supersecret123\"\n}",
            'auth'   => false,
            'title'  => 'Log in',
        ])
    </header>
    <h2 class="endpoint__title">Log in</h2>
    <p>Authenticates a user with email and password and returns a Sanctum access token.</p>

    <h3>Request body</h3>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
                <tr>
                    <td><code>email</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>The user's email address.</td>
                </tr>
                <tr>
                    <td><code>password</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>The user's password.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <h3>Responses</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
            <button class="response-tabs__tab is-active" data-resp="200">200</button>
            <button class="response-tabs__tab" data-resp="422">422</button>
        </div>
        <div class="response-tabs__panel is-active" data-resp-panel="200">
            @include('partials.code-block', [
                'id'       => 'login-200',
                'language' => 'json',
                'title'    => '200 OK',
                'code'     => '{
  "access_token": "1|abc123def456...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "[email protected]"
  }
}',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="422">
            @include('partials.code-block', [
                'id'       => 'login-422',
                'language' => 'json',
                'title'    => '422 Unprocessable Entity',
                'code'     => '{
  "message": "The provided credentials are incorrect.",
  "errors": {
    "email": ["The provided credentials are incorrect."]
  }
}',
            ])
        </div>
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Me ─────────────────────────── --}}
<section class="endpoint" id="me">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'GET'])
        <code class="endpoint__url">{{ $base }}/me</code>
        @include('partials.tryit-trigger', [
            'method' => 'GET',
            'path'   => '/me',
            'auth'   => true,
            'title'  => 'Get current user',
        ])
    </header>
    <h2 class="endpoint__title">Get current user</h2>
    <p>Returns the authenticated user's profile. <strong>Requires a valid bearer token.</strong></p>

    <h3>Responses</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
            <button class="response-tabs__tab is-active" data-resp="200">200</button>
            <button class="response-tabs__tab" data-resp="401">401</button>
        </div>
        <div class="response-tabs__panel is-active" data-resp-panel="200">
            @include('partials.code-block', [
                'id'       => 'me-200',
                'language' => 'json',
                'title'    => '200 OK',
                'code'     => '{
  "id": 1,
  "name": "Jane Doe",
  "email": "[email protected]",
  "google_id": null,
  "avatar": null,
  "email_verified_at": null
}',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="401">
            @include('partials.code-block', [
                'id'       => 'me-401',
                'language' => 'json',
                'title'    => '401 Unauthorized',
                'code'     => '{ "message": "Unauthenticated." }',
            ])
        </div>
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Logout ─────────────────────────── --}}
<section class="endpoint" id="logout">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'POST'])
        <code class="endpoint__url">{{ $base }}/logout</code>
        @include('partials.tryit-trigger', [
            'method' => 'POST',
            'path'   => '/logout',
            'auth'   => true,
            'title'  => 'Log out',
        ])
    </header>
    <h2 class="endpoint__title">Log out</h2>
    <p>Revokes the bearer token used for the current request. <strong>Requires authentication.</strong></p>

    <h3>Responses</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
            <button class="response-tabs__tab is-active" data-resp="200">200</button>
        </div>
        <div class="response-tabs__panel is-active" data-resp-panel="200">
            @include('partials.code-block', [
                'id'       => 'logout-200',
                'language' => 'json',
                'title'    => '200 OK',
                'code'     => '{ "message": "Successfully logged out" }',
            ])
        </div>
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Forgot Password ─────────────────────────── --}}
<section class="endpoint" id="forgot-password">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'POST'])
        <code class="endpoint__url">{{ $base }}/forgot-password</code>
        @include('partials.tryit-trigger', [
            'method' => 'POST',
            'path'   => '/forgot-password',
            'body'   => "{\n  \"email\": \"[email protected]\"\n}",
            'auth'   => false,
            'title'  => 'Request a password reset link',
        ])
    </header>
    <h2 class="endpoint__title">Request a password reset link</h2>
    <p>Sends a password-reset email to the given address if the user exists.</p>

    <h3>Request body</h3>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
                <tr>
                    <td><code>email</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>The user's email address.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <h3>Responses</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
            <button class="response-tabs__tab is-active" data-resp="200">200</button>
            <button class="response-tabs__tab" data-resp="422">422</button>
        </div>
        <div class="response-tabs__panel is-active" data-resp-panel="200">
            @include('partials.code-block', [
                'id'       => 'forgot-200',
                'language' => 'json',
                'title'    => '200 OK',
                'code'     => '{ "message": "We have e-mailed your password reset link!" }',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="422">
            @include('partials.code-block', [
                'id'       => 'forgot-422',
                'language' => 'json',
                'title'    => '422 Unprocessable Entity',
                'code'     => '{
  "errors": {
    "email": ["We can\'t find a user with that e-mail address."]
  }
}',
            ])
        </div>
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Reset Password ─────────────────────────── --}}
<section class="endpoint" id="reset-password">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'POST'])
        <code class="endpoint__url">{{ $base }}/reset-password</code>
        @include('partials.tryit-trigger', [
            'method' => 'POST',
            'path'   => '/reset-password',
            'body'   => "{\n  \"token\": \"reset-token-from-email\",\n  \"email\": \"[email protected]\",\n  \"password\": \"newsecret123\",\n  \"password_confirmation\": \"newsecret123\"\n}",
            'auth'   => false,
            'title'  => 'Reset password',
        ])
    </header>
    <h2 class="endpoint__title">Reset password</h2>
    <p>Finalises a password reset using the token emailed by the forgot-password endpoint.</p>

    <h3>Request body</h3>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
                <tr>
                    <td><code>token</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>Reset token from the password reset email.</td>
                </tr>
                <tr>
                    <td><code>email</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>Email of the account being reset.</td>
                </tr>
                <tr>
                    <td><code>password</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>The new password (min <code>8</code> chars).</td>
                </tr>
                <tr>
                    <td><code>password_confirmation</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>Must match <code>password</code>.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <h3>Responses</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
            <button class="response-tabs__tab is-active" data-resp="200">200</button>
            <button class="response-tabs__tab" data-resp="422">422</button>
        </div>
        <div class="response-tabs__panel is-active" data-resp-panel="200">
            @include('partials.code-block', [
                'id'       => 'reset-200',
                'language' => 'json',
                'title'    => '200 OK',
                'code'     => '{ "message": "Your password has been reset!" }',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="422">
            @include('partials.code-block', [
                'id'       => 'reset-422',
                'language' => 'json',
                'title'    => '422 Unprocessable Entity',
                'code'     => '{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["This password reset token is invalid."]
  }
}',
            ])
        </div>
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Google Login ─────────────────────────── --}}
<section class="endpoint" id="google-login">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'GET'])
        <code class="endpoint__url">{{ $base }}/auth/google</code>
    </header>
    <h2 class="endpoint__title">Redirect to Google</h2>
    <p>Returns a JSON payload containing the Google OAuth redirect URL. The frontend should send the user to that URL to begin the sign-in flow.</p>

    <h3>Response</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
            <button class="response-tabs__tab is-active" data-resp="200">200</button>
        </div>
        <div class="response-tabs__panel is-active" data-resp-panel="200">
            @include('partials.code-block', [
                'id'       => 'google-redirect-200',
                'language' => 'json',
                'title'    => '200 OK',
                'code'     => '{
  "url": "https://accounts.google.com/o/oauth2/auth?client_id=...&redirect_uri=...&response_type=code&scope=openid%20profile%20email"
}',
            ])
        </div>
    </div>
</section>

<section class="endpoint" id="google-callback">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'GET'])
        <code class="endpoint__url">{{ $base }}/auth/google/callback</code>
    </header>
    <h2 class="endpoint__title">Google OAuth callback</h2>
    <p>Handled automatically by Google. On success the user is redirected to <code>FRONTEND_URL/login?token=...&amp;user=...</code>. On failure they are redirected with an <code>error</code> query string.</p>

    <h3>Response</h3>
    <p>HTTP <code>302</code> redirect. Body is empty.</p>
</section>
@endsection

@push('code-examples')
@php
    $base = config('api.base_url');

    $loginCurl = "curl -X POST {$base}/login \\
  -H \"Accept: application/json\" \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"email\": \"[email protected]\",
    \"password\": \"supersecret123\"
  }'";

    $loginJs = "const res = await fetch('{$base}/login', {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: '[email protected]',
    password: 'supersecret123',
  }),
});

const { access_token, user } = await res.json();
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
\$token   = \$response['access_token'];";

    $loginPython = "import requests

response = requests.post(
    '{$base}/login',
    headers={'Accept': 'application/json'},
    json={
        'email': '[email protected]',
        'password': 'supersecret123',
    },
)
data = response.json()
token = data['access_token']";
@endphp

<div class="code-panel__sticky">
    <h4 class="code-panel__title">Code samples</h4>
    <p class="code-panel__lead">Log in and store the bearer token</p>
    @include('partials.code-tabs', [
        'id'     => 'auth-login-snippet',
        'curl'   => $loginCurl,
        'js'     => $loginJs,
        'php'    => $loginPhp,
        'python' => $loginPython,
    ])
</div>
@endpush
