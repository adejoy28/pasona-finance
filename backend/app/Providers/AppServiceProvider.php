<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by(
                $request->user()?->id ?: $request->ip()
            );
        });

        // Tighter limit for the email-availability probe on the auth
        // screen. The frontend debounces to 500ms, so a real user fires
        // at most a handful of requests while typing one email — 30/min
        // is plenty for the UX. The cap exists to make scripted email
        // enumeration (OWASP A07:2021) noticeably expensive.
        RateLimiter::for('check-email', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });
    }
}
