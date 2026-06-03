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
     * Redirects to frontend with token and user data in URL params.
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

            $token = $user->createToken('auth_token')->plainTextToken;

            // Redirect to frontend with token and user info
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:8080');
            return redirect("{$frontendUrl}/login?token={$token}&user={$user->id}");
        } catch (Exception $e) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:8080');
            return redirect("{$frontendUrl}/login?error=" . urlencode('Google authentication failed: ' . $e->getMessage()));
        }
    }
}
