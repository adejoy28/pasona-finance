@extends('layouts.docs')

@section('title', 'Accounts API')

@php
    $base = config('api.base_url');
@endphp

@section('content')
<div class="page-header">
    <p class="page-header__eyebrow">API Reference</p>
    <h1 id="accounts">Accounts</h1>
    <p class="page-header__lead">
        Manage the financial accounts the user tracks — bank, mobile money, and cash accounts.
        Every response includes a calculated <code>balance</code> attribute derived from
        the account's starting balance plus its transactions.
    </p>
</div>

{{-- ─────────────────────────── ENDPOINT: List Accounts ─────────────────────────── --}}
<section class="endpoint" id="list-accounts">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'GET'])
        <code class="endpoint__url">{{ $base }}/accounts</code>
        @include('partials.tryit-trigger', [
            'method' => 'GET',
            'path'   => '/accounts',
            'auth'   => true,
            'title'  => 'List accounts',
        ])
    </header>
    <h2 class="endpoint__title">List accounts</h2>
    <p>Returns every account owned by the authenticated user, each with its calculated <code>balance</code>.</p>

    <h3>Responses</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
            <button class="response-tabs__tab is-active" data-resp="200">200</button>
            <button class="response-tabs__tab" data-resp="401">401</button>
        </div>
        <div class="response-tabs__panel is-active" data-resp-panel="200">
            @include('partials.code-block', [
                'id'       => 'list-accounts-200',
                'language' => 'json',
                'title'    => '200 OK',
                'code'     => '[
  {
    "id": 1,
    "user_id": 1,
    "name": "GTBank Checking",
    "type": "bank",
    "starting_balance": "1000.00",
    "notes": null,
    "created_at": "2026-06-03T12:00:00Z",
    "updated_at": "2026-06-03T12:00:00Z",
    "balance": 1350.00
  },
  {
    "id": 2,
    "user_id": 1,
    "name": "MTN MoMo",
    "type": "mobile",
    "starting_balance": "200.00",
    "notes": "Personal mobile money",
    "created_at": "2026-06-03T12:00:00Z",
    "updated_at": "2026-06-03T12:00:00Z",
    "balance": 75.50
  }
]',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="401">
            @include('partials.code-block', [
                'id'       => 'list-accounts-401',
                'language' => 'json',
                'title'    => '401 Unauthorized',
                'code'     => '{ "message": "Unauthenticated." }',
            ])
        </div>
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Create Account ─────────────────────────── --}}
<section class="endpoint" id="create-account">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'POST'])
        <code class="endpoint__url">{{ $base }}/accounts</code>
        @include('partials.tryit-trigger', [
            'method' => 'POST',
            'path'   => '/accounts',
            'body'   => "{\n  \"name\": \"GTBank Checking\",\n  \"type\": \"bank\",\n  \"starting_balance\": 1000.00,\n  \"notes\": \"Primary salary account\"\n}",
            'auth'   => true,
            'title'  => 'Create an account',
        ])
    </header>
    <h2 class="endpoint__title">Create an account</h2>
    <p>Creates a new financial account for the authenticated user.</p>

    <h3>Request body</h3>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
                <tr>
                    <td><code>name</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>Display name. Max <code>255</code> characters.</td>
                </tr>
                <tr>
                    <td><code>type</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>One of: <code>bank</code>, <code>mobile</code>, <code>cash</code>.</td>
                </tr>
                <tr>
                    <td><code>starting_balance</code></td>
                    <td><span class="type-pill">number</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>Opening balance for the account.</td>
                </tr>
                <tr>
                    <td><code>notes</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--no">Optional</span></td>
                    <td>Free-form notes.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <h3>Request body example</h3>
    @include('partials.code-block', [
        'id'       => 'create-account-req',
        'language' => 'json',
        'title'    => 'REQUEST',
        'code'     => '{
  "name": "GTBank Checking",
  "type": "bank",
  "starting_balance": 1000.00,
  "notes": "Primary salary account"
}',
    ])

    <h3>Responses</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
            <button class="response-tabs__tab is-active" data-resp="201">201</button>
            <button class="response-tabs__tab" data-resp="422">422</button>
            <button class="response-tabs__tab" data-resp="401">401</button>
        </div>
        <div class="response-tabs__panel is-active" data-resp-panel="201">
            @include('partials.code-block', [
                'id'       => 'create-account-201',
                'language' => 'json',
                'title'    => '201 Created',
                'code'     => '{
  "id": 1,
  "user_id": 1,
  "name": "GTBank Checking",
  "type": "bank",
  "starting_balance": "1000.00",
  "notes": "Primary salary account",
  "created_at": "2026-06-03T12:00:00Z",
  "updated_at": "2026-06-03T12:00:00Z",
  "balance": 1000.00
}',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="422">
            @include('partials.code-block', [
                'id'       => 'create-account-422',
                'language' => 'json',
                'title'    => '422 Unprocessable Entity',
                'code'     => '{
  "message": "The given data was invalid.",
  "errors": {
    "type": ["The selected type is invalid."]
  }
}',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="401">
            @include('partials.code-block', [
                'id'       => 'create-account-401',
                'language' => 'json',
                'title'    => '401 Unauthorized',
                'code'     => '{ "message": "Unauthenticated." }',
            ])
        </div>
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Retrieve Account ─────────────────────────── --}}
<section class="endpoint" id="get-account">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'GET'])
        <code class="endpoint__url">{{ $base }}/accounts/<span class="path-param">{id}</span></code>
        @include('partials.tryit-trigger', [
            'method' => 'GET',
            'path'   => '/accounts/{id}',
            'auth'   => true,
            'title'  => 'Retrieve an account',
        ])
    </header>
    <h2 class="endpoint__title">Retrieve an account</h2>
    <p>Returns a single account by ID, including its calculated <code>balance</code>.</p>

    <h3>Path parameters</h3>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
                <tr>
                    <td><code>id</code></td>
                    <td><span class="type-pill">integer</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>The account's unique identifier.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <h3>Responses</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
            <button class="response-tabs__tab is-active" data-resp="200">200</button>
            <button class="response-tabs__tab" data-resp="403">403</button>
            <button class="response-tabs__tab" data-resp="404">404</button>
        </div>
        <div class="response-tabs__panel is-active" data-resp-panel="200">
            @include('partials.code-block', [
                'id'       => 'get-account-200',
                'language' => 'json',
                'title'    => '200 OK',
                'code'     => '{
  "id": 1,
  "user_id": 1,
  "name": "GTBank Checking",
  "type": "bank",
  "starting_balance": "1000.00",
  "notes": null,
  "created_at": "2026-06-03T12:00:00Z",
  "updated_at": "2026-06-03T12:00:00Z",
  "balance": 1350.00
}',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="403">
            @include('partials.code-block', [
                'id'       => 'get-account-403',
                'language' => 'json',
                'title'    => '403 Forbidden',
                'code'     => '{ "message": "This action is unauthorized." }',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="404">
            @include('partials.code-block', [
                'id'       => 'get-account-404',
                'language' => 'json',
                'title'    => '404 Not Found',
                'code'     => '{ "message": "No query results for model [App\\Models\\Account] #99" }',
            ])
        </div>
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Update Account ─────────────────────────── --}}
<section class="endpoint" id="update-account">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'PUT'])
        <code class="endpoint__url">{{ $base }}/accounts/<span class="path-param">{id}</span></code>
        @include('partials.tryit-trigger', [
            'method' => 'PUT',
            'path'   => '/accounts/{id}',
            'body'   => "{\n  \"name\": \"GTBank Checking (Updated)\"\n}",
            'auth'   => true,
            'title'  => 'Update an account',
        ])
    </header>
    <h2 class="endpoint__title">Update an account</h2>
    <p>Updates one or more fields of an existing account. Only the fields you send are updated.</p>

    <h3>Request body</h3>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
                <tr><td><code>name</code></td><td><span class="type-pill">string</span></td><td><span class="required-pill required-pill--no">Optional</span></td><td>Display name. Max <code>255</code> characters.</td></tr>
                <tr><td><code>type</code></td><td><span class="type-pill">string</span></td><td><span class="required-pill required-pill--no">Optional</span></td><td>One of: <code>bank</code>, <code>mobile</code>, <code>cash</code>.</td></tr>
                <tr><td><code>starting_balance</code></td><td><span class="type-pill">number</span></td><td><span class="required-pill required-pill--no">Optional</span></td><td>New starting balance.</td></tr>
                <tr><td><code>notes</code></td><td><span class="type-pill">string</span></td><td><span class="required-pill required-pill--no">Optional</span></td><td>Free-form notes.</td></tr>
            </tbody>
        </table>
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Delete Account ─────────────────────────── --}}
<section class="endpoint" id="delete-account">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'DELETE'])
        <code class="endpoint__url">{{ $base }}/accounts/<span class="path-param">{id}</span></code>
        @include('partials.tryit-trigger', [
            'method' => 'DELETE',
            'path'   => '/accounts/{id}',
            'auth'   => true,
            'title'  => 'Delete an account',
        ])
    </header>
    <h2 class="endpoint__title">Delete an account</h2>
    <p>Permanently deletes an account and all of its associated transactions. This action cannot be undone.</p>

    <h3>Response</h3>
    @include('partials.code-block', [
        'id'       => 'delete-account-204',
        'language' => 'http',
        'title'    => '204 No Content',
        'code'     => 'HTTP/1.1 204 No Content',
    ])
</section>
@endsection

@push('code-examples')
@php
    $base = config('api.base_url');

    $createCurl = "curl -X POST {$base}/accounts \\
  -H \"Authorization: Bearer YOUR_TOKEN\" \\
  -H \"Accept: application/json\" \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"name\": \"GTBank Checking\",
    \"type\": \"bank\",
    \"starting_balance\": 1000.00
  }'";

    $createJs = "const res = await fetch('{$base}/accounts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'GTBank Checking',
    type: 'bank',
    starting_balance: 1000.00,
  }),
});
const account = await res.json();";

    $createPhp = "\$ch = curl_init('{$base}/accounts');
curl_setopt_array(\$ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer YOUR_TOKEN',
        'Accept: application/json',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS     => json_encode([
        'name'             => 'GTBank Checking',
        'type'             => 'bank',
        'starting_balance' => 1000.00,
    ]),
]);
\$account = json_decode(curl_exec(\$ch), true);";

    $createPython = "import requests

account = requests.post(
    '{$base}/accounts',
    headers={
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json',
    },
    json={
        'name': 'GTBank Checking',
        'type': 'bank',
        'starting_balance': 1000.00,
    },
).json()";
@endphp

<div class="code-panel__sticky">
    <h4 class="code-panel__title">Code samples</h4>
    <p class="code-panel__lead">Create an account</p>
    @include('partials.code-tabs', [
        'id'     => 'accounts-create-snippet',
        'curl'   => $createCurl,
        'js'     => $createJs,
        'php'    => $createPhp,
        'python' => $createPython,
    ])
</div>
@endpush
