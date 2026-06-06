@component('mail::message')
# {{ $greeting }}, {{ $user->name }} 👋

{{-- Lead paragraph --}}
@if ($loggedToday)
@php
    $verb = ['crushed', 'nailed', 'wrapped up', 'taken care of'][array_rand(['crushed', 'nailed', 'wrapped up', 'taken care of'])];
@endphp
You already {{ $verb }} today's logging — nice. This is your friendly
nudge to do a quick gut-check before the day ends. Anything missing
from the {{ $count }} transaction{{ $count === 1 ? '' : 's' }} you
logged? A tip, a taxi, that 2 a.m. order?
@else
It's **{{ $reminderTime }}** — your self-imposed money minute.
The Pasona app isn't on the Play Store just yet, but your books
don't care about that. Open the web app and log the day in under
two minutes.
@endif

@component('mail::panel')
**{{ $todayIncome > 0 ? '₦' . number_format($todayIncome, 2) . ' in' : 'No income yet' }}** &
**{{ $todayExpense > 0 ? '₦' . number_format($todayExpense, 2) . ' out' : 'no spend logged' }}**
today across {{ $accountsCount }} {{ \Illuminate\Support\Str::plural('account', $accountsCount) }}.
@endcomponent

@component('mail::button', ['url' => $addUrl, 'color' => 'primary'])
Log today's transactions
@endcomponent

---

**Two-minute version:**
1. Open [{{ $appUrl }}]({{ $appUrl }})
2. Tap **+ New transaction**
3. Pick the account, drop the amount, hit save

Do that for the small stuff *now* and you'll never have to do the
"where did all my money go" autopsy later. That's the whole game.

@component('mail::subcopy')
Don't want these pings? Update your reminder time (or turn them off)
in your [Pasona settings]({{ $settingsUrl }}).
@endcomponent

See you tomorrow,
**The Pasona crew**
@endcomponent
