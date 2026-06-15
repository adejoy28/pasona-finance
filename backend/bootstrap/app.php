<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(
            \Illuminate\Http\Middleware\HandleCors::class,
            \Illuminate\Http\Middleware\TrustHosts::class,
        );

        // Alias Laravel's "ensure email is verified" middleware so it
        // can be referenced as `verified` in routes/api.php. The
        // API is JSON-only, so we render a 403 JSON envelope
        // instead of redirecting to a web route.
        $middleware->alias([
            'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
            'admin'    => \App\Http\Middleware\AdminMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Make sure unverified-email 403s come back as JSON when the
        // request expects JSON (the API client should never see an
        // HTML login redirect).
        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message'         => $e->getMessage() ?: 'This action is not authorized.',
                    'requires_verified_email' => str_contains(strtolower($e->getMessage()), 'verified'),
                ], Response::HTTP_FORBIDDEN);
            }
        });
    })->create();
