<?php

use App\Http\Controllers\API\AccountController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\ForgotPasswordController;
use App\Http\Controllers\API\ImportController;
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

// Social Login (Google)
Route::get('auth/google', [SocialAuthController::class, 'redirectToGoogle']);
Route::get('auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback']);

// Password Reset
Route::post('forgot-password', [ForgotPasswordController::class, 'sendResetLinkEmail']);
Route::post('reset-password', [ResetPasswordController::class, 'reset']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Accounts
    Route::apiResource('accounts', AccountController::class);

    // Categories
    Route::apiResource('categories', CategoryController::class);

    // Transactions
    Route::apiResource('transactions', TransactionController::class);
    Route::post('transactions/sync', [TransactionController::class, 'sync']);

    // Import
    Route::post('import/preview', [ImportController::class, 'preview']);
    Route::post('import/store', [ImportController::class, 'store']);

    // Dashboard Summary
    Route::get('summary', [SummaryController::class, 'index']);
});
