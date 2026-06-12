<?php

namespace App\Console\Commands;

use App\Models\Announcement;
use Illuminate\Console\Command;

/**
 * Schedule a broadcast email announcement.
 *
 * Usage:
 *   php artisan announcement:schedule reminder-announcement --at="2026-06-11 18:00" --subject="Daily reminders are now live"
 *   php artisan announcement:schedule account-deletion --at="2026-06-12 10:00" --template="emails.account-deletion" --subject="Account deletion is here"
 */
class ScheduleAnnouncement extends Command
{
    protected $signature = 'announcement:schedule
        {name : Unique slug, e.g. "reminder-announcement"}
        {--at= : Datetime string to send (default: now)}
        {--subject= : Email subject line}
        {--template= : Blade template path (default: emails.{name})}
        {--vars= : Optional JSON of template variables}';

    protected $description = 'Schedule a broadcast email announcement to all users.';

    public function handle(): int
    {
        $name     = $this->argument('name');
        $at       = $this->option('at') ?: now()->toDateTimeString();
        $subject  = $this->option('subject') ?: throw new \RuntimeException('--subject is required');
        $template = $this->option('template') ?: "emails.{$name}";
        $vars     = $this->option('vars');

        Announcement::updateOrCreate(
            ['name' => $name],
            [
                'subject'       => $subject,
                'template'      => $template,
                'template_vars' => $vars ? json_decode($vars, true) : null,
                'scheduled_at'  => $at,
                'sent_at'       => null,
            ]
        );

        $this->info("Announcement '{$name}' scheduled for {$at}.");

        return self::SUCCESS;
    }
}
