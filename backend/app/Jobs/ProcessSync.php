<?php

namespace App\Jobs;

/**
 * ProcessSync Job
 * 
 * Handles the background processing of offline-synced transactions.
 * Ensures data integrity and consistency when a user flushes their local queue.
 */

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
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
     * Iterates through the transaction payload and persists them to the DB.
     * Logic is wrapped in a queue to handle large batches without blocking the API.
     */
    public function handle(): void
    {
        foreach ($this->transactions as $data) {
            Transaction::create($data);
        }
    }
}
