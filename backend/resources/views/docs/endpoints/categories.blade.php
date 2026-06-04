@extends('layouts.docs')

@section('title', 'Categories API')

@php
    $base = config('api.base_url');
@endphp

@section('content')
<div class="page-header">
    <p class="page-header__eyebrow">API Reference</p>
    <h1 id="categories">Categories</h1>
    <p class="page-header__lead">
        Organise transactions into income and expense categories. Every new user is seeded with a
        default set; the response returns those plus any additional categories the user has created.
    </p>
</div>

{{-- ─────────────────────────── ENDPOINT: List Categories ─────────────────────────── --}}
<section class="endpoint" id="list-categories">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'GET'])
        <code class="endpoint__url">{{ $base }}/categories</code>
        @include('partials.tryit-trigger', [
            'method' => 'GET',
            'path'   => '/categories',
            'auth'   => true,
            'title'  => 'List categories',
        ])
    </header>
    <h2 class="endpoint__title">List categories</h2>
    <p>Returns the authenticated user's categories, including the seeded defaults.</p>

    <h3>Response</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
            <button class="response-tabs__tab is-active" data-resp="200">200</button>
            <button class="response-tabs__tab" data-resp="401">401</button>
        </div>
        <div class="response-tabs__panel is-active" data-resp-panel="200">
            @include('partials.code-block', [
                'id'       => 'list-categories-200',
                'language' => 'json',
                'title'    => '200 OK',
                'code'     => '[
  {
    "id": 1,
    "user_id": 1,
    "name": "Salary",
    "type": "income"
  },
  {
    "id": 2,
    "user_id": 1,
    "name": "Groceries",
    "type": "expense"
  },
  {
    "id": 17,
    "user_id": 1,
    "name": "Side Hustle",
    "type": "income"
  }
]',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="401">
            @include('partials.code-block', [
                'id'       => 'list-categories-401',
                'language' => 'json',
                'title'    => '401 Unauthorized',
                'code'     => '{ "message": "Unauthenticated." }',
            ])
        </div>
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Create Category ─────────────────────────── --}}
<section class="endpoint" id="create-category">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'POST'])
        <code class="endpoint__url">{{ $base }}/categories</code>
        @include('partials.tryit-trigger', [
            'method' => 'POST',
            'path'   => '/categories',
            'body'   => "{\n  \"name\": \"Side Hustle\",\n  \"type\": \"income\"\n}",
            'auth'   => true,
            'title'  => 'Create a category',
        ])
    </header>
    <h2 class="endpoint__title">Create a category</h2>
    <p>Creates a custom category owned by the authenticated user.</p>

    <h3>Request body</h3>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
                <tr>
                    <td><code>name</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>Category name. Max <code>255</code> characters.</td>
                </tr>
                <tr>
                    <td><code>type</code></td>
                    <td><span class="type-pill">string</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>One of: <code>income</code>, <code>expense</code>.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <h3>Request body example</h3>
    @include('partials.code-block', [
        'id'       => 'create-category-req',
        'language' => 'json',
        'title'    => 'REQUEST',
        'code'     => '{
  "name": "Side Hustle",
  "type": "income"
}',
    ])

    <h3>Responses</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
            <button class="response-tabs__tab is-active" data-resp="201">201</button>
            <button class="response-tabs__tab" data-resp="422">422</button>
        </div>
        <div class="response-tabs__panel is-active" data-resp-panel="201">
            @include('partials.code-block', [
                'id'       => 'create-category-201',
                'language' => 'json',
                'title'    => '201 Created',
                'code'     => '{
  "id": 17,
  "user_id": 1,
  "name": "Side Hustle",
  "type": "income"
}',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="422">
            @include('partials.code-block', [
                'id'       => 'create-category-422',
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

{{-- ─────────────────────────── ENDPOINT: Retrieve Category ─────────────────────────── --}}
<section class="endpoint" id="get-category">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'GET'])
        <code class="endpoint__url">{{ $base }}/categories/<span class="path-param">{id}</span></code>
        @include('partials.tryit-trigger', [
            'method' => 'GET',
            'path'   => '/categories/{id}',
            'auth'   => true,
            'title'  => 'Retrieve a category',
        ])
    </header>
    <h2 class="endpoint__title">Retrieve a category</h2>
    <p>Returns a single category by ID.</p>

    <h3>Path parameters</h3>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
                <tr>
                    <td><code>id</code></td>
                    <td><span class="type-pill">integer</span></td>
                    <td><span class="required-pill required-pill--yes">Required</span></td>
                    <td>The category's unique identifier.</td>
                </tr>
            </tbody>
        </table>
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Update Category ─────────────────────────── --}}
<section class="endpoint" id="update-category">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'PUT'])
        <code class="endpoint__url">{{ $base }}/categories/<span class="path-param">{id}</span></code>
        @include('partials.tryit-trigger', [
            'method' => 'PUT',
            'path'   => '/categories/{id}',
            'body'   => "{\n  \"name\": \"Freelance Work\"\n}",
            'auth'   => true,
            'title'  => 'Update a category',
        ])
    </header>
    <h2 class="endpoint__title">Update a category</h2>
    <p>Updates a category owned by the authenticated user. Duplicate <code>(name, type)</code> pairs are blocked by a unique key and return <code>422</code>.</p>

    <h3>Request body</h3>
    <div class="table-wrap">
        <table class="params-table">
            <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
                <tr><td><code>name</code></td><td><span class="type-pill">string</span></td><td><span class="required-pill required-pill--no">Optional</span></td><td>New category name.</td></tr>
                <tr><td><code>type</code></td><td><span class="type-pill">string</span></td><td><span class="required-pill required-pill--no">Optional</span></td><td>One of: <code>income</code>, <code>expense</code>.</td></tr>
            </tbody>
        </table>
    </div>

    <h3>Responses</h3>
    <div class="response-tabs" data-response-tabs>
        <div class="response-tabs__head" role="tablist">
        <button class="response-tabs__tab is-active" data-resp="200">200</button>
        <button class="response-tabs__tab" data-resp="422">422</button>
        </div>
        <div class="response-tabs__panel" data-resp-panel="200">
            @include('partials.code-block', [
                'id'       => 'update-category-200',
                'language' => 'json',
                'title'    => '200 OK',
                'code'     => '{
  "id": 17,
  "user_id": 1,
  "name": "Freelance Work",
  "type": "income"
}',
            ])
        </div>
        <div class="response-tabs__panel" data-resp-panel="422">
            @include('partials.code-block', [
                'id'       => 'update-category-422',
                'language' => 'json',
                'title'    => '422 Unprocessable Entity',
                'code'     => '{
  "message": "The given data was invalid.",
  "errors": {
    "name": ["The name has already been taken."]
  }
}',
            ])
        </div>
    </div>
</section>

{{-- ─────────────────────────── ENDPOINT: Delete Category ─────────────────────────── --}}
<section class="endpoint" id="delete-category">
    <header class="endpoint__header">
        @include('partials.method-badge', ['method' => 'DELETE'])
        <code class="endpoint__url">{{ $base }}/categories/<span class="path-param">{id}</span></code>
        @include('partials.tryit-trigger', [
            'method' => 'DELETE',
            'path'   => '/categories/{id}',
            'auth'   => true,
            'title'  => 'Delete a category',
        ])
    </header>
    <h2 class="endpoint__title">Delete a category</h2>
    <p>Deletes a category owned by the authenticated user, including the seeded defaults.</p>

    <h3>Response</h3>
    @include('partials.code-block', [
        'id'       => 'delete-category-204',
        'language' => 'http',
        'title'    => '204 No Content',
        'code'     => 'HTTP/1.1 204 No Content',
    ])
</section>
@endsection

@push('code-examples')
@php
    $base = config('api.base_url');

    $createCurl = "curl -X POST {$base}/categories \\
  -H \"Authorization: Bearer YOUR_TOKEN\" \\
  -H \"Accept: application/json\" \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"name\": \"Side Hustle\",
    \"type\": \"income\"
  }'";

    $createJs = "const res = await fetch('{$base}/categories', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Side Hustle',
    type: 'income',
  }),
});
const category = await res.json();";

    $createPhp = "\$ch = curl_init('{$base}/categories');
curl_setopt_array(\$ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer YOUR_TOKEN',
        'Accept: application/json',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS     => json_encode([
        'name' => 'Side Hustle',
        'type' => 'income',
    ]),
]);
\$category = json_decode(curl_exec(\$ch), true);";

    $createPython = "import requests

category = requests.post(
    '{$base}/categories',
    headers={
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json',
    },
    json={'name': 'Side Hustle', 'type': 'income'},
).json()";
@endphp

<div class="code-panel__sticky">
    <h4 class="code-panel__title">Code samples</h4>
    <p class="code-panel__lead">Create a category</p>
    @include('partials.code-tabs', [
        'id'     => 'categories-create-snippet',
        'curl'   => $createCurl,
        'js'     => $createJs,
        'php'    => $createPhp,
        'python' => $createPython,
    ])
</div>
@endpush
