<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

/**
 * EmailVerificationController
 *
 * Exposes three endpoints:
 *
 *   GET  /api/email/verify/{id}/{hash}        — public,  signed URL
 *   POST /api/email/verification-notification — protected
 *   GET  /api/email/verification-status       — protected
 *
 * The link in the verification email points at the SPA (which
 * includes the same backend URL as a query param). The SPA then
 * navigates the user to the backend URL — that GET flips the bit
 * and 302s back to the SPA's dashboard.
 *
 * Verification is OPTIONAL for normal use. The frontend should
 * poll /api/email/verification-status to decide whether to show a
 * "please verify your email" banner; the global API does NOT block
 * unverified users from listing accounts, transactions, etc.
 *
 * Sensitive endpoints (large CSV imports, batch transaction sync)
 * do require a verified email and apply the `verified` middleware.
 */
class EmailVerificationController extends Controller
{
    /**
     * Mark the authenticated user's email as verified — but only
     * if the signed URL is valid and the SHA-1 of the email matches.
     *
     * This route MUST be public (no auth:sanctum) so the SPA can hit
     * it from a fresh tab. Security is provided by URL signature +
     * email hash.
     */
    public function verify(Request $request, int $id, string $hash): RedirectResponse
    {
        $user = \App\Models\User::find($id);

        if (! $user) {
            abort(404);
        }

        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            abort(403, 'Invalid verification hash.');
        }

        if (! $request->hasValidSignature()) {
            abort(403, 'Invalid or expired verification link.');
        }

        $frontend = rtrim((string) env('FRONTEND_URL', 'http://localhost:8080'), '/');

        if ($user->hasVerifiedEmail()) {
            return redirect($frontend . '/dashboard?verified=already');
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return redirect($frontend . '/dashboard?verified=1');
    }

    /**
     * Resend the verification email. Throttled by Laravel's default
     * `VerificationLimiter` (60 sec between sends — see the
     * route-level throttle middleware).
     */
    public function send(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json([
                'message'        => 'Email already verified.',
                'email_verified' => true,
            ]);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json([
            'message'              => 'Verification email queued.',
            'email_verified'       => false,
            'verification_sent_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Lightweight status check for the SPA banner.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'email_verified' => $user?->hasVerifiedEmail() ?? false,
            'email'          => $user?->email,
        ]);
    }
}
