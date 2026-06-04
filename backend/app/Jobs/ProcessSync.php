<?php

namespace App\Jobs;

/**
 * ProcessSync Job
 *
 * Handles the background processing of offline-synced transactions.
 * Runs inside a single DB transaction so a failure mid-batch rolls
 * back the whole payload rather than leaving half-imported data.
 */

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use App\Models\Transaction;

class ProcessSync implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The array of transactions to sync.
     *
     * @var array
     */
    protected $transactions;

    /**
     * Create a new job instance.
     *
     * @param array $transactions
     */
    public function __construct(array $transactions)
    {
        $this->transactions = $transactions;
    }

    /**
     * Execute the job.
     *
     * Every row must have a user_id stamped on it (the controller does
     * this from the authenticated user). Rows missing user_id are
     * rejected — silently dropping them would be a data-integrity hole.
     * The whole batch runs inside a transaction so a single bad row
     * rolls back the entire import.
     *
     * Duplicate detection mirrors `TransactionController::store`: each
     * row is checked against both in-batch duplicates and the
     * `transactions` table using the same fingerprint
     * (user_id, transaction_date, type, amount, account_id). Duplicates
     * are silently skipped, not raised — offline sync is meant to be
     * idempotent and the client already considers a row "saved" once it
     * is queued.
     */
    public function handle(): void
    {
        foreach ($this->transactions as $index => $data) {
            if (empty($data['user_id'])) {
                throw new \RuntimeException(
                    "ProcessSync row #{$index} is missing user_id; refusing to insert."
                );
            }
        }

        DB::transaction(function () {
            $seen = [];

            foreach ($this->transactions as $data) {
                $fingerprint = sprintf(
                    '%d|%s|%s|%.2f|%d',
                    (int) $data['user_id'],
                    $data['transaction_date'],
                    $data['type'],
                    (float) $data['amount'],
                    (int) $data['account_id'],
                );

                if (isset($seen[$fingerprint])) {
                    continue;
                }
                $seen[$fingerprint] = true;

                if (Transaction::isPotentialDuplicate(
                    (int) $data['user_id'],
                    $data['transaction_date'],
                    $data['type'],
                    (float) $data['amount'],
                    (int) $data['account_id'],
                )) {
                    continue;
                }

                Transaction::create($data);
            }
        });
    }
}
