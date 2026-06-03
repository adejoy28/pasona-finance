@extends('layouts.docs')

@section('title', 'Import API')

@php
    $base = config('api.base_url');
@endphp

@section('content')
<div class="page-header">
    <p class="page-header__eyebrow">API Reference</p>
    <h1 id="import">Import</h1>
    <p class="page-header__lead">
        Bulk-import transactions from a bank-statement CSV. <code>preview</code> parses the
        CSV and flags rows that look like duplicates of existing transactions; <code>store</code>
        commits the chosen rows.
    </p>
</div>

{{-- ─────────────────────────── ENDPOINT: Preview CSV ─────────────────────────── --}}
<section class="endpoint" id="import-preview">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'POST'])
        <code class="endpoint__url">{{ $base }}/import/preview</code>
    </header>
    <h2 class="endpoint__title">Preview a CSV import</h2>
    <p>Parses a CSV string and returns each row tagged with a duplicate flag. The expected header row is <code>Date, Description, Amount, Dr/Cr</code>.</p>

    <h3>Request body</h3>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
                <tr>
                    <td><code>csv_content</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>The raw CSV text (newlines separating rows).</td>
                </tr>
                <tr>
                    <td><code>account_id</code></td>
                    <td><span class="type-pill">integer</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>Account the imported transactions will belong to.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <h3>Request body example</h3>
    @include('partials.code-block', [
        'id'       => 'import-preview-req',
        'language' => 'json',
        'title'    => 'REQUEST',
        'code'     => '{
  "account_id": 1,
  "csv_content": "Date,Description,Amount,Dr/Cr\n2026-06-01,Coffee shop,4.50,Dr\n2026-06-02,Salary,2500.00,Cr\n2026-06-03,Grocery store,32.10,Dr"
}',
    ])

    <h3>Response</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
            <button class="response-tabs__tab is-active" data-resp="200">200</button>
            <button class="response-tabs__tab" data-resp="422">422</button>
        </div>
        <div class="response-tabs__panel is-active" data-resp-panel="200">
            @include('partials.code-block', [
                'id'       => 'import-preview-200',
                'language' => 'json',
                'title'    => '200 OK',
                'code'     => '[
  {
    "transaction_date": "2026-06-01",
    "description": "Coffee shop",
    "amount": 4.50,
    "type": "expense",
    "is_duplicate": false,
    "account_id": 1
  },
  {
    "transaction_date": "2026-06-02",
    "description": "Salary",
    "amount": 2500.00,
    "type": "income",
    "is_duplicate": false,
    "account_id": 1
  },
  {
    "transaction_date": "2026-06-03",
    "description": "Grocery store",
    "amount": 32.10,
    "type": "expense",
    "is_duplicate": true,
    "account_id": 1
  }
]',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="422">
            @include('partials.code-block', [
                'id'       => 'import-preview-422',
                'language' => 'json',
                'title'    => '422 Unprocessable Entity',
                'code'     => '{
  "message": "The given data was invalid.",
  "errors": {
    "account_id": ["The selected account_id is invalid."]
  }
}',
            ])
        </div>
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Store CSV ─────────────────────────── --}}
<section class="endpoint" id="import-store">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'POST'])
        <code class="endpoint__url">{{ $base }}/import/store</code>
    </header>
    <h2 class="endpoint__title">Commit an import</h2>
    <p>Persists the chosen rows from a preview as real transactions on the user's account.</p>

    <h3>Request body</h3>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
                <tr>
                    <td><code>transactions</code></td>
                    <td><span class="type-pill">array</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>Array of transaction objects. Each must include <code>account_id</code>, <code>transaction_date</code>, <code>amount</code>, and <code>type</code>.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <h3>Request body example</h3>
    @include('partials.code-block', [
        'id'       => 'import-store-req',
        'language' => 'json',
        'title'    => 'REQUEST',
        'code'     => '{
  "transactions": [
    {
      "account_id": 1,
      "transaction_date": "2026-06-01",
      "description": "Coffee shop",
      "amount": 4.50,
      "type": "expense"
    },
    {
      "account_id": 1,
      "transaction_date": "2026-06-02",
      "description": "Salary",
      "amount": 2500.00,
      "type": "income"
    }
  ]
}',
    ])

    <h3>Response</h3>
    @include('partials.code-block', [
        'id'       => 'import-store-200',
        'language' => 'json',
        'title'    => '200 OK',
        'code'     => '{ "message": "Successfully imported 2 transactions." }',
    ])
</section>
@endsection

@push('code-examples')
@php
    $base = config('api.base_url');

    $previewCurl = "curl -X POST {$base}/import/preview \\
  -H \"Authorization: Bearer YOUR_TOKEN\" \\
  -H \"Accept: application/json\" \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"account_id\": 1,
    \"csv_content\": \"Date,Description,Amount,Dr/Cr\\n2026-06-01,Coffee shop,4.50,Dr\\n2026-06-02,Salary,2500.00,Cr\"
  }'";

    $previewJs = "const res = await fetch('{$base}/import/preview', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    account_id: 1,
    csv_content: [
      'Date,Description,Amount,Dr/Cr',
      '2026-06-01,Coffee shop,4.50,Dr',
      '2026-06-02,Salary,2500.00,Cr',
    ].join('\\n'),
  }),
});
const preview = await res.json();";

    $previewPhp = "\$payload = json_encode([
    'account_id'  => 1,
    'csv_content' => \"Date,Description,Amount,Dr/Cr\\n2026-06-01,Coffee shop,4.50,Dr\\n2026-06-02,Salary,2500.00,Cr\",
]);

\$ch = curl_init('{$base}/import/preview');
curl_setopt_array(\$ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer YOUR_TOKEN',
        'Accept: application/json',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => \$payload,
]);
\$preview = json_decode(curl_exec(\$ch), true);";

    $previewPython = "import requests

preview = requests.post(
    '{$base}/import/preview',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'account_id': 1,
        'csv_content': (
            'Date,Description,Amount,Dr/Cr\\n'
            '2026-06-01,Coffee shop,4.50,Dr\\n'
            '2026-06-02,Salary,2500.00,Cr'
        ),
    },
).json()";
@endphp

<div class="code-panel__sticky">
    <h4 class="code-panel__title">Code samples</h4>
    <p class="code-panel__lead">Preview a CSV import</p>
    @include('partials.code-tabs', [
        'id'     => 'import-preview-snippet',
        'curl'   => $previewCurl,
        'js'     => $previewJs,
        'php'    => $previewPhp,
        'python' => $previewPython,
    ])
</div>
@endpush
