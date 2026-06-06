@extends('emails._layout', [
    'eyebrow' => 'Daily money minute',
])

@section('content')
    <span class="eyebrow">{{ $greeting }}, {{ $user->name }} &#x1F44B;</span>
    <h1 class="heading">
        @if ($loggedToday)
            Quick gut-check time.
        @else
            It's {{ $reminderTime }} &mdash; log today's transactions.
        @endif
    </h1>
    <p class="lede">
        @if ($loggedToday)
            You already wrapped up today's logging — nice. This is your friendly nudge to do a quick gut-check before the day ends. Anything missing from the <strong style="color:var(--slate-900);">{{ $count }} transaction{{ $count === 1 ? '' : 's' }}</strong> you logged? A tip, a taxi, that 2 a.m. order?
        @else
            It's <strong style="color:var(--slate-900);">{{ $reminderTime }}</strong> — your self-imposed money minute. The Pasona app isn't on the Play Store just yet, but your books don't care about that. Open the web app and log the day in under two minutes.
        @endif
    </p>

    {{-- Today's stats --}}
    <div class="stats">
        <div class="stat stat--emerald">
            <p class="stat__label">In today</p>
            <p class="stat__value">
                @if ($todayIncome > 0)
                    &#8358;{{ number_format($todayIncome, 2) }}
                @else
                    &mdash;
                @endif
            </p>
            <p class="stat__sub">No income yet</p>
        </div>
        <div class="stat stat--rose">
            <p class="stat__label">Out today</p>
            <p class="stat__value">
                @if ($todayExpense > 0)
                    &#8358;{{ number_format($todayExpense, 2) }}
                @else
                    &mdash;
                @endif
            </p>
            <p class="stat__sub">
                across {{ $accountsCount }} {{ \Illuminate\Support\Str::plural('account', $accountsCount) }}
            </p>
        </div>
    </div>

    @include('emails._button', ['url' => $addUrl, 'label' => "Log today's transactions"])

    <hr class="rule">

    <div class="panel">
        <p class="panel__label">Two-minute version</p>
        <div class="step step--blue">
            <div class="step__num">1</div>
            <div class="step__text">Open <a href="{{ $appUrl }}" style="color:var(--blue-600);text-decoration:underline;">{{ $appUrl }}</a></div>
        </div>
        <div class="step step--emerald">
            <div class="step__num">2</div>
            <div class="step__text">Tap <strong>+ New transaction</strong></div>
        </div>
        <div class="step step--amber">
            <div class="step__num">3</div>
            <div class="step__text">Pick the account, drop the amount, hit save</div>
        </div>
    </div>

    <p class="signoff">
        Do that for the small stuff <em>now</em> and you'll never have to do the "where did all my money go" autopsy later. That's the whole game.<br><br>
        See you tomorrow,<br>
        <strong>The Pasona crew</strong>
    </p>

    <div class="subcopy">
        Don't want these pings? Update your reminder time (or turn them off) in your <a href="{{ $settingsUrl }}">Pasona settings</a>.
    </div>
@endsection
