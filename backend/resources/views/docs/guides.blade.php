@extends('layouts.docs')

@section('title', 'Guides')

@section('content')
<div class="page-header">
    <p class="page-header__eyebrow">Guides</p>
    <h1 id="guides">Guides &amp; tutorials</h1>
    <p class="page-header__lead">
        Step-by-step walkthroughs for common integrations with {{ config('api.name') }}.
    </p>
</div>

<section class="section">
    <div class="cards">
        <a href="{{ route('docs.getting-started.authentication') }}" class="card">
            <h3>Building your first integration</h3>
            <p>Register a user, log in, and make your first authenticated request to the API.</p>
            <span class="card__cta">Read guide &rarr;</span>
        </a>

        <a href="{{ route('docs.endpoints.accounts') }}" class="card">
            <h3>Creating and managing accounts</h3>
            <p>Set up bank, mobile money, and cash accounts and understand the calculated balance.</p>
            <span class="card__cta">Read guide &rarr;</span>
        </a>

        <a href="{{ route('docs.endpoints.transactions') }}" class="card">
            <h3>Recording income, expenses, and transfers</h3>
            <p>Use the transactions endpoint, handle the duplicate-detection response, and use bulk sync.</p>
            <span class="card__cta">Read guide &rarr;</span>
        </a>

        <a href="{{ route('docs.endpoints.import') }}" class="card">
            <h3>Importing a bank statement (CSV)</h3>
            <p>Use the preview endpoint to flag duplicates, then commit only the rows you want.</p>
            <span class="card__cta">Read guide &rarr;</span>
        </a>

        <a href="{{ route('docs.endpoints.auth') }}" class="card">
            <h3>Wiring up Google sign-in</h3>
            <p>Redirect users through Google, exchange the callback for a Sanctum token, and complete the session on the frontend.</p>
            <span class="card__cta">Read guide &rarr;</span>
        </a>

        <a href="{{ route('docs.endpoints.summary') }}" class="card">
            <h3>Building the dashboard</h3>
            <p>Render the home screen using a single call to <code>/summary</code>.</p>
            <span class="card__cta">Read guide &rarr;</span>
        </a>
    </div>
</section>
@endsection
