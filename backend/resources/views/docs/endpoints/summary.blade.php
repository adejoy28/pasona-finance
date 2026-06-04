@extends('layouts.docs')

@section('title', 'Summary API')

@php
    $base = config('api.base_url');
@endphp

@section('content')
<div class="page-header">
    <p class="page-header__eyebrow">API Reference</p>
    <h1 id="summary">Summary</h1>
    <p class="page-header__lead">
        Aggregated data for the dashboard — total balance, monthly income/expense,
        and an expense breakdown by category for the current calendar month.
    </p>
</div>

{{-- ─────────────────────────── ENDPOINT: Dashboard Summary ─────────────────────────── --}}
<section class="endpoint" id="get-summary">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'GET'])
        <code class="endpoint__url">{{ $base }}/summary</code>
        @include('partials.tryit-trigger', [
            'method' => 'GET',
            'path'   => '/summary',
            'auth'   => true,
            'title'  => 'Get dashboard summary',
        ])
    </header>
    <h2 class="endpoint__title">Get dashboard summary</h2>
    <p>Returns the data needed to render the home screen of the app. Always scoped to the current calendar month.</p>

    <h3>Response</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
            <button class="response-tabs__tab is-active" data-resp="200">200</button>
            <button class="response-tabs__tab" data-resp="401">401</button>
        </div>
        <div class="response-tabs__panel is-active" data-resp-panel="200">
            @include('partials.code-block', [
                'id'       => 'summary-200',
                'language' => 'json',
                'title'    => '200 OK',
                'code'     => '{
  "total_balance": 1425.50,
  "accounts": [
    {
      "id": 1,
      "name": "GTBank Checking",
      "type": "bank",
      "starting_balance": "1000.00",
      "balance": 1350.00
    },
    {
      "id": 2,
      "name": "MTN MoMo",
      "type": "mobile",
      "starting_balance": "200.00",
      "balance": 75.50
    }
  ],
  "monthly_summary": {
    "income": 2500.00,
    "expense": 1074.50,
    "net": 1425.50
  },
  "category_breakdown": [
    { "category_name": "Groceries",      "total": 420.00 },
    { "category_name": "Transport",      "total": 180.50 },
    { "category_name": "Eating out",     "total": 230.00 },
    { "category_name": "Uncategorized",  "total": 244.00 }
  ]
}',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="401">
            @include('partials.code-block', [
                'id'       => 'summary-401',
                'language' => 'json',
                'title'    => '401 Unauthorized',
                'code'     => '{ "message": "Unauthenticated." }',
            ])
        </div>
    </div>

    <h3>Response fields</h3>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
            <tbody>
                <tr>
                    <td><code>total_balance</code></td>
                    <td><span class="type-pill">number</span></td>
                    <td>Sum of every account's calculated <code>balance</code>.</td>
                </tr>
                <tr>
                    <td><code>accounts</code></td>
                    <td><span class="type-pill">array</span></td>
                    <td>The user's accounts, each with its calculated <code>balance</code>.</td>
                </tr>
                <tr>
                    <td><code>monthly_summary.income</code></td>
                    <td><span class="type-pill">number</span></td>
                    <td>Total income for the current calendar month.</td>
                </tr>
                <tr>
                    <td><code>monthly_summary.expense</code></td>
                    <td><span class="type-pill">number</span></td>
                    <td>Total expenses for the current calendar month.</td>
                </tr>
                <tr>
                    <td><code>monthly_summary.net</code></td>
                    <td><span class="type-pill">number</span></td>
                    <td>Income minus expense.</td>
                </tr>
                <tr>
                    <td><code>category_breakdown</code></td>
                    <td><span class="type-pill">array</span></td>
                    <td>Expenses grouped by category for the current month. Each row is <code>{ category_name, total }</code>; rows with no category appear as <code>Uncategorized</code>.</td>
                </tr>
            </tbody>
        </table>
    </div>
</section>
@endsection

@push('code-examples')
@php
    $base = config('api.base_url');

    $getCurl = "curl {$base}/summary \\
  -H \"Authorization: Bearer YOUR_TOKEN\" \\
  -H \"Accept: application/json\"";

    $getJs = "const res = await fetch('{$base}/summary', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/json',
  },
});
const summary = await res.json();
console.log(summary.total_balance, summary.monthly_summary);";

    $getPhp = "\$ch = curl_init('{$base}/summary');
curl_setopt_array(\$ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer YOUR_TOKEN',
        'Accept: application/json',
    ],
]);
\$summary = json_decode(curl_exec(\$ch), true);
echo \$summary['total_balance'];";

    $getPython = "import requests

summary = requests.get(
    '{$base}/summary',
    headers={'Authorization': f'Bearer {token}'},
).json()
print(summary['total_balance'], summary['monthly_summary'])";
@endphp

<div class="code-panel__sticky">
    <h4 class="code-panel__title">Code samples</h4>
    <p class="code-panel__lead">Fetch the dashboard summary</p>
    @include('partials.code-tabs', [
        'id'     => 'summary-get-snippet',
        'curl'   => $getCurl,
        'js'     => $getJs,
        'php'    => $getPhp,
        'python' => $getPython,
    ])
</div>
@endpush
