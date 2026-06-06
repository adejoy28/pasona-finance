<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
| Schedules are auto-registered by Laravel 12 — anything in this
| closure runs once per scheduler tick. The default `php artisan
| schedule:run` is what cron should hit; for a long-running worker
| use `schedule:work` instead.
*/

/**
 * Daily transaction-logging reminder.
 *
 * The command uses a ±2 minute window internally, so a 5-minute
 * tick rate catches every reminder_time at least once. withoutOverlapping
 * makes sure a slow queue worker can't double-fire the command.
 */
Schedule::command('reminders:send-daily')
    ->everyFiveMinutes()
    ->withoutOverlapping(10)
    ->onOneServer()
    ->runInBackground();
