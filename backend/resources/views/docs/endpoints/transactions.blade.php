@extends('layouts.docs')

@section('title', 'Transactions API')

@php
    $base = config('api.base_url');
@endphp

@section('content')
<div class="page-header">
    <p class="page-header__eyebrow">API Reference</p>
    <h1 id="transactions">Transactions</h1>
    <p class="page-header__lead">
        Record income, expenses, and transfers against the user's accounts. The API
        includes duplicate detection and an offline-sync endpoint for batch upload.
    </p>
</div>

{{-- ─────────────────────────── ENDPOINT: List Transactions ─────────────────────────── --}}
<section class="endpoint" id="list-transactions">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'GET'])
        <code class="endpoint__url">{{ $base }}/transactions</code>
    </header>
    <h2 class="endpoint__title">List transactions</h2>
    <p>Returns the authenticated user's transactions, ordered by <code>transaction_date</code> descending, paginated 50 per page. Each row is eager-loaded with its <code>account</code>, <code>toAccount</code>, and <code>category</code>.</p>

    <h3>Response</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
            <button class="response-tabs__tab is-active" data-resp="200">200</button>
            <button class="response-tabs__tab" data-resp="401">401</button>
        </div>
        <div class="response-tabs__panel is-active" data-resp-panel="200">
            @include('partials.code-block', [
                'id'       => 'list-transactions-200',
                'language' => 'json',
                'title'    => '200 OK',
                'code'     => '{
  "current_page": 1,
  "data": [
    {
      "id": 42,
      "user_id": 1,
      "account_id": 1,
      "to_account_id": null,
      "category_id": 2,
      "type": "expense",
      "amount": "25.50",
      "description": "Lunch with team",
      "reference": null,
      "transaction_date": "2026-06-03",
      "is_synced": true,
      "created_at": "2026-06-03T12:00:00Z",
      "updated_at": "2026-06-03T12:00:00Z",
      "account": { "id": 1, "name": "GTBank Checking", "type": "bank" },
      "to_account": null,
      "category": { "id": 2, "name": "Groceries", "type": "expense" }
    }
  ],
  "per_page": 50,
  "total": 1,
  "last_page": 1
}',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="401">
            @include('partials.code-block', [
                'id'       => 'list-transactions-401',
                'language' => 'json',
                'title'    => '401 Unauthorized',
                'code'     => '{ "message": "Unauthenticated." }',
            ])
        </div>
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Create Transaction ─────────────────────────── --}}
<section class="endpoint" id="create-transaction">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'POST'])
        <code class="endpoint__url">{{ $base }}/transactions</code>
    </header>
    <h2 class="endpoint__title">Create a transaction</h2>
    <p>Records a new income, expense, or transfer. The user must have at least one account before creating a transaction.</p>

    <h3>Request body</h3>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
                <tr>
                    <td><code>account_id</code></td>
                    <td><span class="type-pill">integer</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>ID of the account the transaction is recorded against.</td>
                </tr>
                <tr>
                    <td><code>to_account_id</code></td>
                    <td><span class="type-pill">integer</span></td>
                    <td><span class="required-pill required-pill--no">Optional</span></td>
                    <td>Destination account for <code>transfer</code> transactions.</td>
                </tr>
                <tr>
                    <td><code>type</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>One of: <code>income</code>, <code>expense</code>, <code>transfer</code>.</td>
                </tr>
                <tr>
                    <td><code>category_id</code></td>
                    <td><span class="type-pill">integer</span></td>
                    <td><span class="required-pill required-pill--no">Optional</span></td>
                    <td>Category ID. Required for income/expense, optional for transfer.</td>
                </tr>
                <tr>
                    <td><code>amount</code></td>
                    <td><span class="type-pill">number</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>Transaction amount. Always positive.</td>
                </tr>
                <tr>
                    <td><code>description</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--no">Optional</span></td>
                    <td>Short description. Max <code>255</code> characters.</td>
                </tr>
                <tr>
                    <td><code>reference</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--no">Optional</span></td>
                    <td>External reference (e.g. bank transaction ID). Max <code>255</code> characters.</td>
                </tr>
                <tr>
                    <td><code>transaction_date</code></td>
                    <td><span class="type-pill">date</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>Date the transaction occurred. <code>YYYY-MM-DD</code>.</td>
                </tr>
                <tr>
                    <td><code>force</code></td>
                    <td><span class="type-pill">boolean</span></td>
                    <td><span class="required-pill required-pill--no">Optional</span></td>
                    <td>Set to <code>true</code> to skip the duplicate-detection check.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <h3>Request body example</h3>
    @include('partials.code-block', [
        'id'       => 'create-transaction-req',
        'language' => 'json',
        'title'    => 'REQUEST',
        'code'     => '{
  "account_id": 1,
  "category_id": 2,
  "type": "expense",
  "amount": 25.50,
  "description": "Lunch with team",
  "transaction_date": "2026-06-03"
}',
    ])

    <h3>Responses</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
            <button class="response-tabs__tab is-active" data-resp="201">201</button>
            <button class="response-tabs__tab" data-resp="403">403</button>
            <button class="response-tabs__tab" data-resp="409">409</button>
            <button class="response-tabs__tab" data-resp="422">422</button>
        </div>
        <div class="response-tabs__panel is-active" data-resp-panel="201">
            @include('partials.code-block', [
                'id'       => 'create-transaction-201',
                'language' => 'json',
                'title'    => '201 Created',
                'code'     => '{
  "id": 42,
  "user_id": 1,
  "account_id": 1,
  "to_account_id": null,
  "category_id": 2,
  "type": "expense",
  "amount": "25.50",
  "description": "Lunch with team",
  "reference": null,
  "transaction_date": "2026-06-03",
  "is_synced": true,
  "created_at": "2026-06-03T12:00:00Z",
  "updated_at": "2026-06-03T12:00:00Z"
}',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="403">
            @include('partials.code-block', [
                'id'       => 'create-transaction-403',
                'language' => 'json',
                'title'    => '403 Forbidden',
                'code'     => '{ "message": "You must create at least one account before adding transactions." }',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="409">
            @include('partials.code-block', [
                'id'       => 'create-transaction-409',
                'language' => 'json',
                'title'    => '409 Conflict',
                'code'     => '{
  "message": "Potential duplicate detected.",
  "is_duplicate": true
}',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="422">
            @include('partials.code-block', [
                'id'       => 'create-transaction-422',
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
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Sync Transactions ─────────────────────────── --}}
<section class="endpoint" id="sync-transactions">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'POST'])
        <code class="endpoint__url">{{ $base }}/transactions/sync</code>
    </header>
    <h2 class="endpoint__title">Bulk sync (offline)</h2>
    <p>Accepts a batch of transactions recorded offline and dispatches them to a background queue job (<code>App\Jobs\ProcessSync</code>) for processing.</p>

    <h3>Request body</h3>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
                <tr>
                    <td><code>transactions</code></td>
                    <td><span class="type-pill">array</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>Array of transaction objects. Each must include <code>account_id</code>, <code>type</code>, <code>amount</code>, and <code>transaction_date</code>.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <h3>Request body example</h3>
    @include('partials.code-block', [
        'id'       => 'sync-transactions-req',
        'language' => 'json',
        'title'    => 'REQUEST',
        'code'     => '{
  "transactions": [
    {
      "account_id": 1,
      "type": "expense",
      "amount": 12.00,
      "description": "Coffee",
      "transaction_date": "2026-06-02"
    },
    {
      "account_id": 1,
      "type": "expense",
      "amount": 4.50,
      "description": "Bus fare",
      "transaction_date": "2026-06-02"
    }
  ]
}',
    ])

    <h3>Response</h3>
    @include('partials.code-block', [
        'id'       => 'sync-transactions-200',
        'language' => 'json',
        'title'    => '200 OK',
        'code'     => '{ "message": "Sync process started in the background." }',
    ])
</section>

{{-- ─────────────────────────── ENDPOINT: Retrieve Transaction ─────────────────────────── --}}
<section class="endpoint" id="get-transaction">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'GET'])
        <code class="endpoint__url">{{ $base }}/transactions/<span class="path-param">{id}</span></code>
    </header>
    <h2 class="endpoint__title">Retrieve a transaction</h2>
    <p>Returns a single transaction with its <code>account</code>, <code>toAccount</code>, and <code>category</code> relations loaded.</p>
</section>

{{-- ─────────────────────────── ENDPOINT: Update Transaction ─────────────────────────── --}}
<section class="endpoint" id="update-transaction">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'PUT'])
        <code class="endpoint__url">{{ $base }}/transactions/<span class="path-param">{id}</span></code>
    </header>
    <h2 class="endpoint__title">Update a transaction</h2>
    <p>Updates one or more fields of an existing transaction. All fields are optional &mdash; only the fields you send are updated.</p>

    <h3>Request body</h3>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
                <tr><td><code>account_id</code></td><td><span class="type-pill">integer</span></td><td><span class="required-pill required-pill--no">Optional</span></td><td>New source account.</td></tr>
                <tr><td><code>to_account_id</code></td><td><span class="type-pill">integer</span></td><td><span class="required-pill required-pill--no">Optional</span></td><td>New destination account for transfers.</td></tr>
                <tr><td><code>category_id</code></td><td><span class="type-pill">integer</span></td><td><span class="required-pill required-pill--no">Optional</span></td><td>New category.</td></tr>
                <tr><td><code>type</code></td><td><span class="type-pill">string</span></td><td><span class="required-pill required-pill--no">Optional</span></td><td>One of: <code>income</code>, <code>expense</code>, <code>transfer</code>.</td></tr>
                <tr><td><code>amount</code></td><td><span class="type-pill">number</span></td><td><span class="required-pill required-pill--no">Optional</span></td><td>New amount.</td></tr>
                <tr><td><code>description</code></td><td><span class="type-pill">string</span></td><td><span class="required-pill required-pill--no">Optional</span></td><td>New description. Max <code>255</code> characters.</td></tr>
                <tr><td><code>reference</code></td><td><span class="type-pill">string</span></td><td><span class="required-pill required-pill--no">Optional</span></td><td>New reference. Max <code>255</code> characters.</td></tr>
                <tr><td><code>transaction_date</code></td><td><span class="type-pill">date</span></td><td><span class="required-pill required-pill--no">Optional</span></td><td>New date. <code>YYYY-MM-DD</code>.</td></tr>
            </tbody>
        </table>
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Delete Transaction ─────────────────────────── --}}
<section class="endpoint" id="delete-transaction">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'DELETE'])
        <code class="endpoint__url">{{ $base }}/transactions/<span class="path-param">{id}</span></code>
    </header>
    <h2 class="endpoint__title">Delete a transaction</h2>
    <p>Permanently removes a transaction and recalculates the affected account balances.</p>

    <h3>Response</h3>
    @include('partials.code-block', [
        'id'       => 'delete-transaction-204',
        'language' => 'http',
        'title'    => '204 No Content',
        'code'     => 'HTTP/1.1 204 No Content',
    ])
</section>
@endsection

@push('code-examples')
@php
    $base = config('api.base_url');

    $createCurl = "curl -X POST {$base}/transactions \\
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

    $createJs = "const res = await fetch('{$base}/transactions', {
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
});
const transaction = await res.json();";

    $createPhp = "\$ch = curl_init('{$base}/transactions');
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

    $createPython = "import requests

transaction = requests.post(
    '{$base}/transactions',
    headers={
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json',
    },
    json={
        'account_id': 1,
        'category_id': 2,
        'type': 'expense',
        'amount': 25.50,
        'description': 'Lunch with team',
        'transaction_date': '2026-06-03',
    },
).json()";
@endphp

<div class="code-panel__sticky">
    <h4 class="code-panel__title">Code samples</h4>
    <p class="code-panel__lead">Create a transaction</p>
    @include('partials.code-tabs', [
        'id'     => 'transactions-create-snippet',
        'curl'   => $createCurl,
        'js'     => $createJs,
        'php'    => $createPhp,
        'python' => $createPython,
    ])
</div>
@endpush
