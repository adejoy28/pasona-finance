<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillDefaultCategories extends Command
{
    protected $signature = 'categories:backfill-defaults
        {--chunk=100 : Number of users to process per chunk}
        {--dry-run : Show what would happen without writing}';

    protected $description = 'Give every existing user an editable copy of the default categories (skips users who already have any).';

    public function handle(): int
    {
        $defaults = User::DEFAULT_CATEGORIES;
        $defaultsByKey = [];
        foreach ($defaults as $cat) {
            $defaultsByKey[$cat['type'].':'.$cat['name']] = $cat;
        }

        $chunkSize = (int) $this->option('chunk');
        $dryRun = (bool) $this->option('dry-run');
        $now = now();

        $totalUsers = User::query()->count();
        $this->info("Scanning {$totalUsers} user(s) for missing default categories.");

        if ($dryRun) {
            $this->warn('Dry run — no changes will be written.');
        }

        $totalUsersTouched = 0;
        $totalRowsInserted = 0;

        User::query()->select(['id'])->chunkById($chunkSize, function ($users) use ($defaultsByKey, $dryRun, $now, &$totalUsersTouched, &$totalRowsInserted) {
            $existing = DB::table('categories')
                ->whereIn('user_id', $users->pluck('id'))
                ->select(['user_id', 'name', 'type'])
                ->get();

            $existingKey = [];
            foreach ($existing as $row) {
                $existingKey[$row->user_id][$row->type.':'.$row->name] = true;
            }

            $rows = [];
            $usersTouched = 0;

            foreach ($users as $user) {
                $have = $existingKey[$user->id] ?? [];
                $added = 0;
                foreach ($defaultsByKey as $key => $cat) {
                    if (isset($have[$key])) {
                        continue;
                    }
                    $rows[] = [
                        'user_id'    => $user->id,
                        'name'       => $cat['name'],
                        'type'       => $cat['type'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                    $added++;
                }
                if ($added > 0) {
                    $usersTouched++;
                }
            }

            if (! empty($rows) && ! $dryRun) {
                DB::transaction(function () use ($rows) {
                    Category::insert($rows);
                });
            }

            $totalUsersTouched += $usersTouched;
            $totalRowsInserted += count($rows);

            $this->line("  scanned ".count($users)." user(s), ".count($rows)." row(s) ".($dryRun ? 'would be ' : '')."inserted...");
        });

        $verb = $dryRun ? 'Would insert' : 'Inserted';
        $this->info("{$verb} {$totalRowsInserted} category row(s) across {$totalUsersTouched} user(s).");

        return self::SUCCESS;
    }
}
