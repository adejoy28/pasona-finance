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

/**
 * Daily database backup at 04:00 UTC (low-traffic window).
 * Keeps the last 7 backups — older ones are pruned automatically
 * by the command's --prune flag (add when implemented).
 */
Schedule::command('db:backup')
    ->dailyAt('04:00')
    ->withoutOverlapping()
    ->runInBackground();

/**
 * Broadcast announcement worker.
 *
 * Checks the announcements table every minute for scheduled-at timestamps
 * that are due. When found, it mails the Blade template to every user who
 * hasn't already received it.
 *
 * To schedule an announcement:
 *   php artisan announcement:schedule reminder-announcement --at="2026-06-11 18:00" --subject="Daily reminders are now live"
 *   php artisan announcement:schedule account-deletion    --at="2026-06-12 10:00" --subject="Account deletion is now available"
 */
Schedule::command('announcements:send-due')
    ->everyMinute()
    ->withoutOverlapping(5)
    ->onOneServer()
    ->runInBackground();
