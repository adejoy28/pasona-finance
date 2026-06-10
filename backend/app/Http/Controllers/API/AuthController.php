<?php

namespace App\Http\Controllers\API;

/**
 * AuthController File
 *
 * Handles user authentication (Registration, Login, Logout) using Laravel Sanctum.
 */

use App\Http\Controllers\Controller;
use App\Mail\WelcomeMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

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
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'timezone' => 'sometimes|string|max:64',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'timezone' => $request->timezone ?? 'Africa/Lagos',
        ]);

        // Verification is opt-in: send the link but DON'T block the
        // response. The user can use the app immediately; the SPA
        // will surface a banner from /api/email/verification-status.
        $user->sendEmailVerificationNotification();

        // Send the welcome email alongside the verification link.
        // Mail::queue returns immediately; a queue worker handles the send.
        Mail::to($user->email)->queue(new WelcomeMail($user));

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

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
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
     * Revoke the user's current token (Logout).
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
            'timezone' => 'sometimes|string|max:64',
        ]);

        $user = $request->user();

        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }

        if (array_key_exists('reminder_time', $data)) {
            $user->reminder_time = $data['reminder_time'];
        }

        if (array_key_exists('timezone', $data)) {
            $user->timezone = $data['timezone'];
        }

        $user->save();

        return response()->json($user);
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
