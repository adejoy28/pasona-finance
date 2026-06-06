<?php

use App\Http\Controllers\EmailPreviewController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Public-facing documentation site routes. All routes render Blade views and
| do not require authentication.
|
*/

Route::get('/', fn () => redirect()->route('docs.index'));

Route::prefix('docs')->name('docs.')->group(function () {
    Route::get('/', fn () => view('docs.index'))->name('index');

    // Getting Started
    Route::prefix('getting-started')->name('getting-started.')->group(function () {
        Route::get('/overview', fn () => view('docs.getting-started.overview'))->name('overview');
        Route::get('/authentication', fn () => view('docs.getting-started.authentication'))->name('authentication');
        Route::get('/errors', fn () => view('docs.getting-started.errors'))->name('errors');
        Route::get('/rate-limiting', fn () => view('docs.getting-started.rate-limiting'))->name('rate-limiting');
    });

    // API Reference — Pasona Finance Tracker resources
    Route::prefix('endpoints')->name('endpoints.')->group(function () {
        Route::get('/auth',        fn () => view('docs.endpoints.auth'))->name('auth');
        Route::get('/accounts',    fn () => view('docs.endpoints.accounts'))->name('accounts');
        Route::get('/categories',  fn () => view('docs.endpoints.categories'))->name('categories');
        Route::get('/transactions',fn () => view('docs.endpoints.transactions'))->name('transactions');
        Route::get('/import',      fn () => view('docs.endpoints.import'))->name('import');
        Route::get('/summary',     fn () => view('docs.endpoints.summary'))->name('summary');
    });

    Route::get('/guides', fn () => view('docs.guides'))->name('guides');
    Route::get('/changelog', fn () => view('docs.changelog'))->name('changelog');
});

// Dev-only browser preview of every email template. Disabled in production.
if (! app()->environment('production')) {
    Route::get('/email-preview', [EmailPreviewController::class, 'index'])->name('email-preview.index');
    Route::get('/email-preview/{template}', [EmailPreviewController::class, 'show'])->name('email-preview.show');
}
