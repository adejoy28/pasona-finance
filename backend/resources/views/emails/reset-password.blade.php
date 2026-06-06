@component('mail::message')
# Hey {{ $notifiable->name ?? 'there' }} — locking things back down 🔒

Someone (hopefully you) just asked to reset the Pasona password for
**{{ $notifiable->getEmailForPasswordReset() }}**. If that was you,
use the button below to pick a new one.

@component('mail::button', ['url' => $actionUrl, 'color' => 'primary'])
Reset my password
@endcomponent

This link expires in **60 minutes**, so don't sit on it.

If you didn't request a reset, you can safely ignore this email —
your password will stay exactly as it is.

@component('mail::subcopy')
Button not cooperating? Paste this URL into your browser:
{{ $actionUrl }}
@endcomponent

Stay safe,
**The Pasona crew**
@endcomponent
