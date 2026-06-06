@extends('emails._layout', [
    'eyebrow' => 'One last step',
])

@section('content')
    <span class="eyebrow">Verify your email</span>
    <h1 class="heading">Hey {{ $firstName }}, let's verify your email.</h1>
    <p class="lede">
        You're one click away from full access to Pasona. Confirm <strong style="color:var(--slate-900);">{{ $email }}</strong> and you're set.
    </p>

    @include('emails._button', ['url' => $actionUrl, 'label' => 'Verify my email'])

    <p class="fineprint">
        This link is good for <strong style="color:var(--slate-600);">60 minutes</strong>. After that, request a fresh one from your Pasona settings.
    </p>

    <hr class="rule">

    <div class="panel">
        <p class="panel__label">What you get</p>
        @include('emails._feature', [
            'tint'  => 'emerald',
            'icon'  => '&#8358;',
            'title' => 'Track every naira',
            'body'  => 'Income, expenses, transfers — all in one place.',
        ])
        @include('emails._feature', [
            'tint'  => 'blue',
            'icon'  => '&#127974;',
            'title' => 'All your accounts, unified',
            'body'  => 'GTBank, OPay, Kuda, cash in your wallet.',
        ])
        @include('emails._feature', [
            'tint'  => 'amber',
            'icon'  => '&#128229;',
            'title' => 'Drop in a bank statement',
            'body'  => 'We handle the parsing and flag duplicates.',
        ])
        @include('emails._feature', [
            'tint'  => 'purple',
            'icon'  => '&#128202;',
            'title' => 'Reports that make sense',
            'body'  => 'Monthly summaries and category breakdowns.',
        ])
    </div>

    <p class="signoff">
        Didn't sign up for Pasona? No worries — just ignore this message and nothing happens to your inbox.<br><br>
        Talk soon,<br>
        <strong>The Pasona team</strong>
    </p>

    <div class="subcopy">
        Having trouble with the button? Paste this URL into your browser:<br>
        <a href="{{ $actionUrl }}">{{ $actionUrl }}</a>
    </div>
@endsection
