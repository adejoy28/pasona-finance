<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Models\Transaction;

class ProcessSync implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $transactions;

    public function __construct(array $transactions)
    {
        $this->transactions = $transactions;
    }

    public function handle(): void
    {
        foreach ($this->transactions as $index => $data) {
            if (empty($data['user_id'])) {
                throw new \RuntimeException(
                    "ProcessSync row #{$index} is missing user_id; refusing to insert."
                );
            }
        }

        $chunks = array_chunk($this->transactions, 100);

        foreach ($chunks as $chunk) {
            DB::transaction(function () use ($chunk) {
                $inserts = $this->uniqueInBatch($chunk);
                if (empty($inserts)) {
                    return;
                }
                $inserts = $this->filterExistingInDb($inserts);
                if (empty($inserts)) {
                    return;
                }

                $now = now();
                foreach ($inserts as &$row) {
                    $row['created_at'] = $now;
                    $row['updated_at'] = $now;
                }
                unset($row);

                Transaction::insert($inserts);
            });
        }

        // Bust caches for all affected users. ProcessSync handles bulk
        // offline sync which may span multiple users (though typically
        // one). Each user's account balances and monthly summary are now
        // stale and must be recomputed on next request.
        $userIds = array_unique(array_column($this->transactions, 'user_id'));
        $monthKey = now()->format('Y-m');
        foreach ($userIds as $uid) {
            Cache::forget("user:{$uid}:accounts:balances");
            Cache::forget("user:{$uid}:summary:{$monthKey}");
        }
    }

    private function uniqueInBatch(array $rows): array
    {
        $seen = [];
        $unique = [];
        foreach ($rows as $data) {
            $fp = sprintf(
                '%d|%s|%s|%.2f|%d',
                (int) $data['user_id'],
                $data['transaction_date'],
                $data['type'],
                (float) $data['amount'],
                (int) $data['account_id'],
            );
            if (isset($seen[$fp])) {
                continue;
            }
            $seen[$fp] = true;
            $unique[] = $data;
        }
        return $unique;
    }

    private function filterExistingInDb(array $rows): array
    {
        $userId = (int) $rows[0]['user_id'];

        $cases = [];
        $bindings = [];

        foreach ($rows as $data) {
            $cases[] = '(transaction_date = ? AND type = ? AND amount = ? AND account_id = ?)';
            $bindings[] = $data['transaction_date'];
            $bindings[] = $data['type'];
            $bindings[] = (float) $data['amount'];
            $bindings[] = (int) $data['account_id'];
        }

        $existing = DB::table('transactions')
            ->where('user_id', $userId)
            ->whereRaw('(' . implode(' OR ', $cases) . ')', $bindings)
            ->select('transaction_date', 'type', 'amount', 'account_id')
            ->get()
            ->map(fn($row) => sprintf(
                '%s|%s|%.2f|%d',
                $row->transaction_date,
                $row->type,
                (float) $row->amount,
                (int) $row->account_id,
            ))
            ->values()->all();

        $existingSet = array_flip($existing);

        return array_values(
            array_filter($rows, function ($data) use ($existingSet) {
                $fp = sprintf(
                    '%s|%s|%.2f|%d',
                    $data['transaction_date'],
                    $data['type'],
                    (float) $data['amount'],
                    (int) $data['account_id'],
                );
                return !isset($existingSet[$fp]);
            })
        );
    }
}
