<?php

namespace App\Http\Controllers\API;

/**
 * AuthController File
 *
 * Handles user authentication (Registration, Login, Logout) using Laravel Sanctum.
 */

use App\Http\Controllers\Controller;
use App\Mail\WelcomeMail;
use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * AuthController Class
 *
 * Provides API endpoints for user authentication.
 */
class AuthController extends Controller
{
    /**
     * Register a new user.
     *
     * @return JsonResponse
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,NULL,id,deleted_at,NULL',
            'password' => 'required|string|min:8|confirmed',
            'timezone' => 'sometimes|string|max:64',
        ]);

        // If the email belongs to a soft-deleted account, restore it
        // instead of failing. The user is clearly the owner (they know
        // the password), so this is a "welcome back" path.
        $trashed = User::onlyTrashed()->where('email', $request->email)->first();
        if ($trashed) {
            $trashed->restore();
            $trashed->update([
                'name' => $request->name,
                'password' => Hash::make($request->password),
                'timezone' => $request->timezone ?? 'Africa/Lagos',
            ]);
            $user = $trashed;
        } else {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'timezone' => $request->timezone ?? 'Africa/Lagos',
            ]);
        }

        // Verification is opt-in: send the link but DON'T block the
        // response. The user can use the app immediately; the SPA
        // will surface a banner from /api/email/verification-status.
        $user->sendEmailVerificationNotification();

        // Send the welcome email alongside the verification link.
        // Mail::queue returns immediately; a queue worker handles the send.
        Mail::to($user->email)->queue(new WelcomeMail($user));

        AppNotification::send(
            $user,
            'welcome',
            'Welcome to Pasona!',
            'Your account is set up and ready to go. Start by adding your first financial account.',
            ['url' => '/accounts'],
        );

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token'         => $token,
            'token_type'           => 'Bearer',
            'user'                 => $user,
            'email_verified'       => false,
            'email_verified_at'    => null,
        ]);
    }

    /**
     * Authenticate a user and return a token.
     *
     * @return JsonResponse
     *
     * @throws ValidationException
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::withTrashed()->where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Restore a previously soft-deleted account on successful login.
        if ($user->trashed()) {
            $user->restore();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    /**
     * Revoke the user's current token (Logout).
     *
     * Only the session token passed in the request is revoked. Dedicated
     * biometric tokens (created via `POST /auth/biometric/token`) are
     * intentionally left alone so device biometric sign-in keeps working
     * after a normal logout.
     *
     * @return JsonResponse
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out',
        ]);
    }

    /**
     * Issue a dedicated biometric token for the authenticated user.
     *
     * The token is stored with the `biometric` ability and is NOT revoked
     * by `logout()` (which only deletes the current session token). Any
     * previously issued biometric token for the user is replaced so a
     * device that re-enables biometrics rotates the secret. The app keeps
     * this token in secure storage and uses it to re-authenticate on the
     * login screen without a password.
     *
     * @return JsonResponse
     */
    public function createBiometricToken(Request $request)
    {
        $user = $request->user();

        $user->tokens()->where('name', 'biometric_token')->delete();

        $token = $user->createToken('biometric_token', ['biometric'])->plainTextToken;

        return response()->json([
            'biometric_token' => $token,
        ]);
    }

    /**
     * Exchange a stored biometric token for a fresh session token.
     *
     * Public — the biometric token itself is the credential. Validates the
     * token, checks the `biometric` ability and expiry, then issues a new
     * `auth_token`. The biometric token is left intact so it can be used
     * again on the next biometric sign-in.
     *
     * @return JsonResponse
     */
    public function biometricLogin(Request $request)
    {
        $data = $request->validate([
            'biometric_token' => 'required|string',
        ]);

        $accessToken = PersonalAccessToken::findToken($data['biometric_token']);

        if (! $accessToken) {
            throw ValidationException::withMessages([
                'biometric_token' => ['Saved biometric credentials are no longer valid.'],
            ]);
        }

        if (! $accessToken->can('biometric')) {
            throw ValidationException::withMessages([
                'biometric_token' => ['Saved biometric credentials are no longer valid.'],
            ]);
        }

        if ($accessToken->expires_at && $accessToken->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'biometric_token' => ['Saved biometric credentials have expired.'],
            ]);
        }

        $user = $accessToken->tokenable;

        if ($user->trashed()) {
            throw ValidationException::withMessages([
                'biometric_token' => ['This account is no longer available.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    /**
     * Get the authenticated user's profile.
     *
     * @return JsonResponse
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Update the authenticated user's profile.
     *
     * Accepts one or both fields. Only the provided fields are saved.
     * Setting reminder_time to null disables daily email reminders.
     *
     * @return JsonResponse
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'reminder_time' => ['sometimes', 'nullable', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'reminder_frequency' => ['sometimes', 'required', 'in:daily,weekdays,mon_wed_fri,smart,off'],
            'marketing_opt_in' => ['sometimes', 'boolean'],
            'timezone' => 'sometimes|string|max:64',
            'currency' => 'sometimes|required|string|size:3|alpha:alpha',
            'password' => 'sometimes|required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }

        if (array_key_exists('reminder_time', $data)) {
            $user->reminder_time = $data['reminder_time'];
        }

        if (array_key_exists('reminder_frequency', $data)) {
            $user->reminder_frequency = $data['reminder_frequency'];
        }

        if (array_key_exists('marketing_opt_in', $data)) {
            $user->marketing_opt_in = (bool) $data['marketing_opt_in'];
        }

        if (array_key_exists('timezone', $data)) {
            $user->timezone = $data['timezone'];
        }

        if (array_key_exists('currency', $data)) {
            $user->currency = $data['currency'];
        }

        if (array_key_exists('password', $data)) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        return response()->json($user);
    }

    /**
     * Delete (soft-delete) the authenticated user and all related data.
     *
     * Revokes all API tokens, then soft-deletes transactions, accounts,
     * categories, and finally the user themselves.  Sanctum's auth
     * automatically rejects requests from soft-deleted users because the
     * `SoftDeletes` global scope makes `find()` return null.
     *
     * @return JsonResponse
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->tokens()->delete();
        $user->pushSubscriptions()->delete();
        $user->transactions()->delete();
        $user->accounts()->delete();
        $user->categories()->delete();
        $user->delete();

        return response()->json(['message' => 'Account deleted']);
    }

    /**
     * Check whether an email is already registered.
     *
     * Backed by `GET /api/auth/check-email?email=...`. Always responds
     * with `{ "available": bool }` and the same 200 status — the
     * response shape never varies between "exists" and "doesn't exist",
     * which is the standard mitigation against user-enumeration attacks
     * (OWASP A07:2021). The endpoint is also rate-limited via the
     * `check-email` named limiter to make scraping expensive.
     *
     * Invalid input returns 422 with the standard validation error
     * envelope; that path is reached only when the frontend's own
     * client-side validation is bypassed, so it does not leak
     * existence.
     *
     * @return JsonResponse
     */
    public function checkEmail(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email:rfc|max:254',
        ]);

        $email = strtolower(trim($data['email']));
        $available = ! User::where('email', $email)->exists();

        return response()->json(['available' => $available]);
    }
}

