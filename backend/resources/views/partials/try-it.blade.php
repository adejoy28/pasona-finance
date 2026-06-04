{{--
    Interactive "Try it" request builder for the right-hand sidebar.
    Lets a developer send a real request to the API from the docs page.

    Usage:
        @include('partials.try-it', ['defaultEndpoint' => '/summary'])

    Persists the bearer token in localStorage (key: docs:tryit:token) so the
    developer doesn't have to retype it on every page load.
--}}
@php
    $defaultMethod   = $defaultMethod   ?? 'GET';
    $defaultEndpoint = $defaultEndpoint ?? '/summary';
    $defaultBody     = $defaultBody     ?? '';
@endphp

<div class="try-it" data-tryit>
    <h4 class="try-it__title">Try it</h4>
    <p class="try-it__lead">Send a real request to the API from here.</p>

    <form class="try-it__form" data-tryit-form novalidate>
        <div class="try-it__row try-it__row--method-path">
            <label class="try-it__field try-it__field--method">
                <span class="try-it__label">Method</span>
                <select class="try-it__input" data-tryit-method aria-label="HTTP method">
                    <option value="GET"    @selected($defaultMethod === 'GET')>GET</option>
                    <option value="POST"   @selected($defaultMethod === 'POST')>POST</option>
                    <option value="PUT"    @selected($defaultMethod === 'PUT')>PUT</option>
                    <option value="PATCH"  @selected($defaultMethod === 'PATCH')>PATCH</option>
                    <option value="DELETE" @selected($defaultMethod === 'DELETE')>DELETE</option>
                </select>
            </label>

        <label class="try-it__field try-it__field--path">
            <span class="try-it__label">Endpoint</span>
            <div class="try-it__path">
                <code class="try-it__base" data-tryit-base>{{ config('api.base_url') }}</code>
                <input
                    type="text"
                    class="try-it__input try-it__input--path"
                    data-tryit-path
                    value="{{ $defaultEndpoint }}"
                    spellcheck="false"
                    autocomplete="off"
                    placeholder="/summary"
                    aria-label="Endpoint path"
                >
            </div>
        </label>
    </div>

        <div class="try-it__field" data-tryit-params-wrap hidden>
            <span class="try-it__label">Path parameters</span>
            <div class="try-it__params" data-tryit-params></div>
        </div>

        <label class="try-it__field">
            <span class="try-it__label">
                Bearer token
                <span class="try-it__label-hint" data-tryit-auth-hint hidden>Required</span>
            </span>
            <input
                type="password"
                class="try-it__input"
                data-tryit-token
                placeholder="Paste your access token from /login"
                spellcheck="false"
                autocomplete="off"
                aria-label="Bearer access token"
            >
        </label>

        <label class="try-it__field" data-tryit-body-wrap hidden>
            <span class="try-it__label">Request body (JSON)</span>
            <textarea
                class="try-it__input try-it__input--body"
                data-tryit-body
                rows="6"
                spellcheck="false"
                placeholder='{ "account_id": 1, "type": "expense", "amount": 25.50 }'
                aria-label="Request body JSON"
            >{{ $defaultBody }}</textarea>
        </label>

        <button type="submit" class="try-it__send" data-tryit-send>
            <span class="try-it__send-label">Send request</span>
        </button>
    </form>

    <div class="try-it__response" data-tryit-response hidden>
        <div class="try-it__response-head">
            <span class="try-it__status" data-tryit-status></span>
            <span class="try-it__time" data-tryit-time></span>
        </div>
        <pre class="try-it__body"><code data-tryit-body-out></code></pre>
    </div>
</div>
