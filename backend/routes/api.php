<?php

use App\Http\Controllers\API\AccountController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\EmailVerificationController;
use App\Http\Controllers\API\ForgotPasswordController;
use App\Http\Controllers\API\Import\ImportController;
use App\Http\Controllers\API\Import\KudaImportController;
use App\Http\Controllers\API\Import\OpayImportController;
use App\Http\Controllers\API\ResetPasswordController;
use App\Http\Controllers\API\SocialAuthController;
use App\Http\Controllers\API\SummaryController;
use App\Http\Controllers\API\TransactionController;
use Illuminate\Support\Facades\Route;

/**
 * API Routes File
 *
 * Defines all endpoints for the Pasona Finance Tracker.
 * Most routes are protected by Sanctum middleware.
 */

// Public Routes
Route::get('/', function () {
    return response()->json(['message' => 'Welcome to the Pasona Finance Tracker API!']);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Email-availability probe used by the register/login screens to show
// "Sign in instead" / "Register instead" hints. Public (a user has to
// be able to check before signing in) and rate-limited per IP to
// discourage scripted enumeration.
Route::get('/auth/check-email', [AuthController::class, 'checkEmail'])
    ->middleware('throttle:check-email');

// Social Login (Google)
Route::get('auth/google', [SocialAuthController::class, 'redirectToGoogle']);
Route::get('auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback']);

// Password Reset
Route::post('forgot-password', [ForgotPasswordController::class, 'sendResetLinkEmail']);
Route::post('reset-password', [ResetPasswordController::class, 'reset']);

// Email verification link (signed). Public — the URL itself is the
// proof that the user clicked their own email.
Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware('signed')
    ->name('api.email.verify');

// Protected Routes
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    // Auth
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Email verification (resend / status)
    Route::get('/email/verification-status', [EmailVerificationController::class, 'status']);
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'send'])
        ->middleware('throttle:6,1'); // ≤6 resends per minute

    // Accounts
    Route::apiResource('accounts', AccountController::class);

    // Categories
    Route::apiResource('categories', CategoryController::class);

    // Transactions
    Route::apiResource('transactions', TransactionController::class);
    Route::post('transactions/sync', [TransactionController::class, 'sync'])
        ->middleware('verified'); // batch sync writes > 1 row at a time

    // Import — large CSV / bank-statement ingest is gated by
    // verified email so we have a way to reach the user if
    // something goes wrong with the import.
    Route::post('import/preview', [ImportController::class, 'preview']);
    Route::post('import/store', [ImportController::class, 'store'])
        ->middleware('verified');
    Route::post('import/kuda/preview', [KudaImportController::class, 'preview']);
    Route::post('import/kuda/store', [KudaImportController::class, 'store'])
        ->middleware('verified');
    Route::post('import/opay/preview', [OpayImportController::class, 'preview']);
    Route::post('import/opay/store', [OpayImportController::class, 'store'])
        ->middleware('verified');

    // Dashboard Summary
    Route::get('summary', [SummaryController::class, 'index']);
});
