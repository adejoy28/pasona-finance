<?php

/*
 * CORS configuration for the Pasona Finance API.
 *
 * In dev, the frontend is served by Vite (port 8080) and the API by
 * `php artisan serve` (port 8000), so cross-origin requests need
 * explicit CORS. In production, the SPA and API are typically on
 * different subdomains — the env-driven `FRONTEND_URL` covers both.
 *
 * Sanctum stateful auth (cookie-based) is configured separately in
 * config/sanctum.php. This file only governs the CORS response headers.
 */

$allowedOrigins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', sprintf(
        '%s,%s',
        env('FRONTEND_URL', 'http://localhost:8080'),
    ))),
)));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'auth/*', 'up'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $allowedOrigins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
