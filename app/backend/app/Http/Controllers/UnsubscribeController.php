<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\View\View;

class UnsubscribeController extends Controller
{
    /**
     * Handle one-click unsubscribe requests (RFC 8058 compliant).
     * Supports both GET (user clicking link in browser) and POST (mail client 1-click unsubscribe).
     */
    public function __invoke(Request $request, User $user): Response|View
    {
        if (! $request->hasValidSignature()) {
            abort(403, 'Invalid or expired unsubscribe link.');
        }

        $type = $request->query('type', 'all');

        match ($type) {
            'reminder' => $user->update(['reminder_frequency' => 'off']),
            'marketing' => $user->update(['marketing_opt_in' => false]),
            default => $user->update([
                'reminder_frequency' => 'off',
                'marketing_opt_in'   => false,
            ]),
        };

        if ($request->isMethod('POST')) {
            return response("Unsubscribed successfully.\n", 200, [
                'Content-Type' => 'text/plain',
            ]);
        }

        $frontend = rtrim((string) config('app.frontend_url'), '/');

        $message = match ($type) {
            'reminder'  => 'You have been unsubscribed from daily reminder emails.',
            'marketing' => 'You have been unsubscribed from product updates and newsletters.',
            default     => 'You have been unsubscribed from reminder and promotional emails.',
        };

        return view('emails.unsubscribed', [
            'user'        => $user,
            'type'        => $type,
            'message'     => $message,
            'settingsUrl' => $frontend . '/settings',
        ]);
    }
}
