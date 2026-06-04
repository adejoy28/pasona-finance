{{--
    "Try it" trigger button — sits in the endpoint header on the left.
    Clicking it pre-fills the right-sidebar request builder with this
    endpoint's method, path, and (optional) request body, and surfaces
    any path parameters as inline inputs.

    Usage:
        @include('partials.tryit-trigger', [
            'method' => 'POST',                // GET | POST | PUT | PATCH | DELETE
            'path'   => '/accounts',           // may contain {id} placeholders
            'body'   => '{"name":"Foo"}',      // optional, JSON
            'auth'   => true,                  // whether a bearer token is required
            'title'  => 'Create an account',   // optional label
        ])
--}}
@php
    $method = strtoupper($method ?? 'GET');
    $path   = $path   ?? '/';
    $body   = $body   ?? '';
    $auth   = (bool) ($auth ?? false);
    $title  = $title  ?? null;
@endphp

<button
    type="button"
    class="tryit-trigger"
    data-tryit-trigger
    data-method="{{ $method }}"
    data-path="{{ $path }}"
    @if($body !== '') data-body="{{ $body }}" @endif
    data-auth="{{ $auth ? '1' : '0' }}"
    @if($title) data-title="{{ $title }}" @endif
    aria-label="Try {{ $method }} {{ $path }} in the right sidebar"
>
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/>
    </svg>
    <span>Try it</span>
</button>
