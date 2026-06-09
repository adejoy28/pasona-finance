<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackupDatabase extends Command
{
    protected $signature = 'db:backup
        {--description= : Optional label for the backup file}';

    protected $description = 'Dump the database to a timestamped SQL file in storage/backups/';

    public function handle(): int
    {
        $connection = config('database.default');
        $config = config("database.connections.$connection");

        if ($connection !== 'pgsql') {
            $this->error("Backup is only implemented for PostgreSQL (current: $connection).");
            return self::FAILURE;
        }

        $dir = storage_path('backups');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $label = $this->option('description')
            ? '-' . preg_replace('/[^a-zA-Z0-9_-]+/', '_', $this->option('description'))
            : '';
        $timestamp = now()->format('Y-m-d_Hi');
        $filename = "{$timestamp}{$label}.sql";
        $path = "$dir/$filename";

        $host = $config['host'];
        $port = $config['port'];
        $db   = $config['database'];
        $user = $config['username'];
        $pass = addslashes($config['password']);

        $cmd = sprintf(
            'PGPASSWORD="%s" pg_dump --host=%s --port=%s --username=%s --dbname=%s --no-owner --no-acl --format=plain --file=%s 2>&1',
            $pass,
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($user),
            escapeshellarg($db),
            escapeshellarg($path),
        );

        $this->line("Dumping database to <comment>$filename</comment> ...");
        $start = now();
        exec($cmd, $output, $exitCode);

        if ($exitCode !== 0) {
            $this->error('pg_dump failed:');
            foreach ($output as $line) {
                $this->line("  $line");
            }
            return self::FAILURE;
        }

        $size = filesize($path);
        $elapsed = $start->diffInSeconds(now());
        $this->info("Backup saved: $filename ($size bytes, {$elapsed}s)");

        return self::SUCCESS;
    }
}
