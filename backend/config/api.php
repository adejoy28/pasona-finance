<?php

return [
    /*
    |--------------------------------------------------------------------------
    | API Base URL
    |--------------------------------------------------------------------------
    |
    | The base URL used throughout the public documentation site. Override this
    | in your .env file by setting API_BASE_URL=https://api.yourdomain.com
    |
    */
    'base_url' => env('API_BASE_URL', '/api'),

    /*
    |--------------------------------------------------------------------------
    | API Display Name
    |--------------------------------------------------------------------------
    */
    'name' => env('API_DISPLAY_NAME', 'Pasona Finance Tracker API'),

    /*
    |--------------------------------------------------------------------------
    | API Version
    |--------------------------------------------------------------------------
    */
    'version' => env('API_VERSION', 'v1'),
];
