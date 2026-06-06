<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;
use Exception;

class SocialAuthController extends Controller
{
    /**
     * Redirect to Google for authentication.
     */
    public function redirectToGoogle()
    {
        return response()->json([
            'url' => Socialite::driver('google')->stateless()->redirect()->getTargetUrl()
        ]);
    }

    /**
     * Handle Google callback.
     * Redirects to the frontend with the issued Sanctum token only. User
     * details are intentionally omitted from the URL — the frontend must
     * call GET /api/me with the token to hydrate the session, rather
     * than trusting a user payload baked into the redirect target
     * (which would land in browser history, server logs, and the
     * Referer header of any subsequent outbound request).
     */
    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                ]);
            } else {
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'password' => null, // No password for social login
                ]);
            }

            // Google has already confirmed the email address, so
            // there is nothing to verify. Mark it verified for the
            // benefit of any future "verified" middleware on
            // sensitive endpoints. Existing users whose email
            // matches a Google account are also flipped verified
            // (idempotent — hasVerifiedEmail is a no-op when true).
            if (! $user->hasVerifiedEmail()) {
                $user->forceFill(['email_verified_at' => now()])->save();
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            $frontendUrl = env('FRONTEND_URL', 'http://localhost:8080');
            return redirect("{$frontendUrl}/login?token={$token}");
        } catch (Exception $e) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:8080');
            return redirect("{$frontendUrl}/login?error=" . urlencode('Google authentication failed: ' . $e->getMessage()));
        }
    }
}
