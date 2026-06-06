@extends('emails._layout', [
    'eyebrow' => 'Account security',
])

@section('content')
    <span class="eyebrow">Locking things back down</span>
    <h1 class="heading">Hey {{ $notifiable->name ?? 'there' }} &#x1F512;</h1>
    <p class="lede">
        Someone (hopefully you) just asked to reset the Pasona password for
        <strong style="color:var(--slate-900);">{{ $notifiable->getEmailForPasswordReset() }}</strong>.
        If that was you, use the button below to pick a new one.
    </p>

    @include('emails._button', ['url' => $actionUrl, 'label' => 'Reset my password'])

    <p class="fineprint">
        This link expires in <strong style="color:var(--slate-600);">60 minutes</strong>, so don't sit on it.
    </p>

    <div class="verify" style="background: var(--rose-50); border-color: var(--rose-100);">
        <p class="verify__label" style="color: var(--rose-600);">Didn't request this?</p>
        <p style="color: #881337;">If you didn't ask for a reset, you can safely ignore this email — your password will stay exactly as it is. If you see repeated resets you didn't trigger, <a href="mailto:security@adebayosystems.com.ng" style="color: #9f1239; text-decoration: underline;">let us know</a> so we can lock things down.</p>
    </div>

    <hr class="rule">

    <div class="panel panel--indigo">
        <p class="panel__label">A quick reminder</p>
        <div class="step step--blue">
            <div class="step__num">&#x1F511;</div>
            <div class="step__text">Pasona will <strong>never</strong> ask for your password in an email or DM.</div>
        </div>
        <div class="step step--emerald">
            <div class="step__num">&#x2705;</div>
            <div class="step__text">Use a password manager — your future self will thank you.</div>
        </div>
        <div class="step step--amber">
            <div class="step__num">&#x26A0;&#xFE0F;</div>
            <div class="step__text">Public Wi-Fi + password resets = bad combo. Wait till you're home.</div>
        </div>
    </div>

    <p class="signoff">
        Stay safe,<br>
        <strong>The Pasona crew</strong>
    </p>

    <div class="subcopy">
        Button not cooperating? Paste this URL into your browser:<br>
        <a href="{{ $actionUrl }}">{{ $actionUrl }}</a>
    </div>
@endsection
