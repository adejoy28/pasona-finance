<?php

namespace App\Http\Controllers\API\Import;

/**
 * BaseImportController File
 *
 * Shared scaffolding for all bank-specific import controllers.
 * Subclasses implement parseRows() to return normalised transactions
 * for their bank's file format; preview/store/dedupe/amount/date
 * helpers are inherited from this base.
 *
 * To add a new bank (Opay, Palmpay, Sterling, etc.):
 *   1. Create `XxxImportController extends BaseImportController`
 *   2. Implement `parseRows(Request)` for that bank's file format
 *   3. Optionally override `decoratePreviewRow()` for bank-specific fields
 *   4. Optionally override `parseDate()` for bank-specific date formats
 *   5. Register the two routes in routes/api.php
 */

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

abstract class BaseImportController extends Controller
{

    /**
     * Check existing transactions for a given account and date range.
     * Returns {date, type, amount, reference} tuples for client-side deduplication.
     */
    public function check(Request $request)
    {
        $userId = $request->user()->id;

        $validated = $request->validate([
            'account_id' => [
                'required',
                Rule::exists('accounts', 'id')->where('user_id', $userId),
            ],
            'date_from'  => 'required|date',
            'date_to'    => 'required|date|after_or_equal:date_from',
        ]);

        $transactions = Transaction::where('user_id', $userId)
            ->where('account_id', $validated['account_id'])
            ->whereBetween('transaction_date', [$validated['date_from'], $validated['date_to']])
            ->select(['transaction_date', 'type', 'amount', 'reference'])
            ->get()
            ->map(function ($t) {
                return [
                    'date'      => substr((string) $t->transaction_date, 0, 10),
                    'type'      => $t->type,
                    'amount'    => (float) $t->amount,
                    'reference' => $t->reference,
                ];
            });

        return response()->json($transactions);
    }

    /**
     * Store confirmed (non-duplicate) transactions.
     * Validates input, skips rows whose (user_id, uuid) already exists,
     * stamps import_batch_id, and inserts in chunks within a DB transaction.
     */
    public function store(Request $request)
    {
        $userId = $request->user()->id;

        $validator = Validator::make($request->all(), [
            'import_batch_id'                     => 'nullable|string|max:255',
            'transactions'                        => 'required|array|min:1',
            'transactions.*.uuid'                 => 'required|string|max:255',
            'transactions.*.account_id'           => [
                'required',
                Rule::exists('accounts', 'id')->where('user_id', $userId),
            ],
            'transactions.*.transaction_date'     => 'required|date',
            'transactions.*.amount'               => 'required|numeric|min:0',
            'transactions.*.type'                 => 'required|in:income,expense,transfer',
            'transactions.*.to_account_id'        => [
                'nullable',
                Rule::exists('accounts', 'id')->where('user_id', $userId),
            ],
            'transactions.*.description'          => 'nullable|string|max:255',
            'transactions.*.category_id'          => [
                'nullable',
                Rule::exists('categories', 'id')->where(function ($query) use ($userId) {
                    $query->where('user_id', $userId)->orWhereNull('user_id');
                }),
            ],
            'transactions.*.reference'            => 'nullable|string|max:255',
        ]);

        $validator->after(function ($v) use ($request) {
            foreach ($request->transactions as $i => $t) {
                $type = $t['type'] ?? '';
                if ($type === 'transfer') {
                    if (empty($t['to_account_id'])) {
                        $v->errors()->add("transactions.{$i}.to_account_id", 'Destination account is required for transfers.');
                    } elseif ((int) $t['to_account_id'] === (int) $t['account_id']) {
                        $v->errors()->add("transactions.{$i}.to_account_id", 'Source and destination accounts must be different.');
                    }
                }
            }
        });

        $validator->validate();

        $incomingUuids = array_filter(array_column($request->transactions, 'uuid'));
        $existingUuids = Transaction::where('user_id', $userId)
            ->whereIn('uuid', $incomingUuids)
            ->pluck('uuid')
            ->flip();

        $importBatchId = $request->input('import_batch_id');
        $now = now();

        $rowsToInsert = [];
        $skippedCount = 0;

        foreach ($request->transactions as $item) {
            $uuid = $item['uuid'] ?? null;
            if ($uuid && isset($existingUuids[$uuid])) {
                $skippedCount++;
                continue;
            }

            $type = $item['type'] ?? 'expense';

            $rowsToInsert[] = [
                'uuid'             => $uuid,
                'user_id'          => $userId,
                'account_id'       => $item['account_id'],
                'to_account_id'    => $type === 'transfer' ? ($item['to_account_id'] ?? null) : null,
                'type'             => $type,
                'category_id'      => $type === 'transfer' ? null : ($item['category_id'] ?? null),
                'amount'           => $item['amount'],
                'description'      => $item['description'] ?? null,
                'reference'        => $item['reference'] ?? null,
                'transaction_date' => $item['transaction_date'],
                'import_batch_id'  => $importBatchId,
                'is_synced'        => true,
                'created_at'       => $now,
                'updated_at'       => $now,
            ];
        }

        if (!empty($rowsToInsert)) {
            DB::transaction(function () use ($rowsToInsert) {
                // Insert in chunks to avoid hitting DB placeholder limits
                foreach (array_chunk($rowsToInsert, 100) as $chunk) {
                    Transaction::insert($chunk);
                }
            });

            Cache::forget("user:{$userId}:accounts:balances");
            Cache::forget("user:{$userId}:summary:" . now()->format('Y-m'));

            $count = count($rowsToInsert);
            AppNotification::send(
                $userId,
                'import_complete',
                'Import complete',
                "Successfully imported {$count} " . ($count === 1 ? 'transaction' : 'transactions') . '.',
                ['count' => $count, 'url' => '/transactions'],
            );
        }

        $importedCount = count($rowsToInsert);

        return response()->json([
            'message'         => 'Successfully imported ' . $importedCount . ' transactions.',
            'imported_count'  => $importedCount,
            'skipped_count'   => $skippedCount,
            'import_batch_id' => $importBatchId,
        ], 201);
    }

    /**
     * Soft-deletes all transactions with the given import_batch_id for authenticated user.
     */
    public function undoBatch(Request $request, string $batchId)
    {
        $userId = $request->user()->id;

        $count = Transaction::where('user_id', $userId)
            ->where('import_batch_id', $batchId)
            ->delete();

        if ($count > 0) {
            Cache::forget("user:{$userId}:accounts:balances");
            Cache::forget("user:{$userId}:summary:" . now()->format('Y-m'));
        }

        return response()->json([
            'message'       => "Successfully reverted {$count} imported transactions.",
            'deleted_count' => $count,
        ]);
    }
}

