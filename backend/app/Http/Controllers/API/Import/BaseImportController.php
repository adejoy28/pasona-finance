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
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;

abstract class BaseImportController extends Controller
{
    /**
     * Parse a bank-specific input and return normalised rows.
     *
     * Each row must include: transaction_date (Y-m-d), description, amount, type.
     * Subclasses may include additional bank-specific fields (e.g. transfer_suggestion)
     * which will be passed through to the preview response unchanged.
     */
    abstract protected function parseRows(Request $request): array;

    /**
     * Store confirmed (non-duplicate) transactions.
     * Wrapped in a DB transaction and chunked so partial failures don't
     * leave dirty data and large imports don't hit DB placeholder limits.
     */
    public function store(Request $request)
    {
        $userId = $request->user()->id;

        $validator = Validator::make($request->all(), [
            'transactions'                        => 'required|array|min:1',
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
                Rule::exists('categories', 'id')->where('user_id', $userId),
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

        $now = now();

        $rows = array_map(fn($item) => array_merge($item, [
            'user_id'    => $userId,
            'is_synced'  => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]), $request->transactions);

        DB::transaction(function () use ($rows) {
            // Insert in chunks to avoid hitting DB placeholder limits
            foreach (array_chunk($rows, 100) as $chunk) {
                Transaction::insert($chunk);
            }
        });

        Cache::forget("user:{$userId}:accounts:balances");
        Cache::forget("user:{$userId}:summary:" . now()->format('Y-m'));

        $count = count($rows);
        AppNotification::send(
            $userId,
            'import_complete',
            'Import complete',
            "Successfully imported {$count} " . ($count === 1 ? 'transaction' : 'transactions') . '.',
            ['count' => $count, 'url' => '/transactions'],
        );

        return response()->json([
            'message' => 'Successfully imported ' . $count . ' transactions.',
        ], 201);
    }

    /**
     * Build the preview response: dedupe → decorate → return.
     * Subclasses call this from their public preview() after validating input.
     *
     * Passes the target account_id to fetchExisting() so the duplicate
     * fingerprint includes the account — matching Transaction::isPotentialDuplicate().
     */
    protected function buildPreviewResponse(Request $request, array $rows)
    {
        if (empty($rows)) {
            return response()->json(['message' => 'No valid transactions found in file.'], 422);
        }

        $accountId = (int) $request->account_id;
        $existing = $this->fetchExisting($rows, $request->user()->id, $accountId);

        $preview = array_map(
            fn($row) => $this->decoratePreviewRow($row, $existing, $request),
            $rows
        );

        return response()->json($preview);
    }

    /**
     * Add account_id + duplicate flag to a preview row.
     * Override to add bank-specific fields (e.g. transfer_suggestion).
     *
     * The duplicate key now includes account_id so that the same amount
     * on a different account is NOT flagged as a duplicate — matching
     * the manual-entry behaviour in TransactionController::store.
     */
    protected function decoratePreviewRow(array $row, Collection $existing, Request $request): array
    {
        $rowWithAccount = array_merge($row, ['account_id' => $request->account_id]);

        return array_merge($rowWithAccount, [
            'is_duplicate' => $existing->has($this->duplicateKey($rowWithAccount)),
        ]);
    }

    /**
     * Build a lookup set of existing transactions for duplicate detection.
     *
     * Key format: "YYYY-MM-DD:type:amount:account_id"
     *
     * One query for the whole batch — builds a set of (date, type, amount, account_id)
     * keys that already exist for this user+account, then each preview row
     * checks the set. This matches Transaction::isPotentialDuplicate() which
     * uses (user_id, transaction_date, type, amount, account_id).
     */
    protected function fetchExisting(array $parsed, int $userId, int $accountId): Collection
    {
        $existing = Transaction::where('user_id', $userId)
            ->where('account_id', $accountId)
            ->where(function ($q) use ($parsed) {
                foreach ($parsed as $p) {
                    $q->orWhere(function ($sub) use ($p) {
                        $sub->where('transaction_date', $p['transaction_date'])
                            ->where('type', $p['type'])
                            ->where('amount', $p['amount']);
                    });
                }
            })
            ->select(['transaction_date', 'type', 'amount', 'account_id'])
            ->get();

        return $existing->mapWithKeys(
            fn($t) => [$this->duplicateKey($t->toArray()) => true]
        );
    }

    /**
     * Build the duplicate-detection key for a row or Transaction model.
     *
     * Includes account_id so that the same amount on a different account
     * is not treated as a duplicate — aligning with Transaction::isPotentialDuplicate().
     */
    protected function duplicateKey(array $row): string
    {
        return $row['transaction_date'] . ':' . $row['type'] . ':' . (string) $row['amount'] . ':' . (string) ($row['account_id'] ?? '');
    }

    /**
     * Parse ₦ amounts: strips ₦ symbol, commas, and whitespace.
     */
    protected function parseAmount($value): float
    {
        if (empty($value)) return 0.0;
        $clean = preg_replace('/[^\d.]/', '', str_replace(',', '', (string) $value));
        return $clean === '' ? 0.0 : (float) $clean;
    }

    /**
     * Parse a date value via Carbon::parse.
     * On total failure, logs a warning and returns today's date so the
     * pipeline doesn't break — callers should validate or filter upstream.
     *
     * Subclasses with a known format (e.g. Kuda's DD/MM/YY HH:MM:SS) should
     * override this to try their format first, then fall through to parent.
     */
    protected function parseDate($value): string
    {
        try {
            return Carbon::parse(trim((string) $value))->format('Y-m-d');
        } catch (\Exception $e) {
            Log::warning(static::class . ': unparseable date', ['value' => $value]);
            return Carbon::now()->format('Y-m-d');
        }
    }
}

