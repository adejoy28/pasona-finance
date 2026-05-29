<?php

namespace App\Http\Controllers\API;

/**
 * TransactionController File
 * 
 * Handles CRUD operations for financial transactions.
 * Includes duplicate detection and offline sync processing.
 */

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * TransactionController Class
 * 
 * Manage income, expense, and transfer records.
 */
class TransactionController extends Controller
{
    /**
     * List transactions for the user.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $transactions = $request->user()->transactions()
            ->with(['account', 'toAccount', 'category'])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($transactions);
    }

    /**
     * Create a new transaction.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'nullable|exists:accounts,id',
            'type' => 'required|in:income,expense,transfer',
            'category_id' => 'nullable|exists:categories,id',
            'amount' => 'required|numeric',
            'description' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:255',
            'transaction_date' => 'required|date',
            'force' => 'nullable|boolean', // If true, skip duplicate check
        ]);

        // Duplicate Detection Logic
        if (!$request->force) {
            $isDuplicate = Transaction::where('user_id', $request->user()->id)
                ->where('transaction_date', $validated['transaction_date'])
                ->where('type', $validated['type'])
                ->where('amount', $validated['amount'])
                ->where('account_id', $validated['account_id'])
                ->exists();

            if ($isDuplicate) {
                return response()->json([
                    'message' => 'Potential duplicate detected.',
                    'is_duplicate' => true
                ], 409);
            }
        }

        $transaction = $request->user()->transactions()->create($validated);

        return response()->json($transaction, 201);
    }

    /**
     * Bulk store for offline sync.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sync(Request $request)
    {
        $request->validate([
            'transactions' => 'required|array',
            'transactions.*.account_id' => 'required|exists:accounts,id',
            'transactions.*.type' => 'required|in:income,expense,transfer',
            'transactions.*.amount' => 'required|numeric',
            'transactions.*.transaction_date' => 'required|date',
        ]);

        $synced = [];
        
        DB::transaction(function () use ($request, &$synced) {
            foreach ($request->transactions as $item) {
                // We typically skip duplicate checks during sync unless specified,
                // as the user already confirmed them offline.
                $item['user_id'] = $request->user()->id;
                $item['is_synced'] = true;
                $synced[] = Transaction::create($item);
            }
        });

        return response()->json([
            'message' => count($synced) . ' transactions synced successfully.',
            'data' => $synced
        ]);
    }

    /**
     * Display a transaction.
     */
    public function show(Transaction $transaction)
    {
        $this->authorize('view', $transaction);
        return response()->json($transaction->load(['account', 'toAccount', 'category']));
    }

    /**
     * Update a transaction.
     */
    public function update(Request $request, Transaction $transaction)
    {
        $this->authorize('update', $transaction);

        $validated = $request->validate([
            'account_id' => 'sometimes|required|exists:accounts,id',
            'to_account_id' => 'nullable|exists:accounts,id',
            'type' => 'sometimes|required|in:income,expense,transfer',
            'category_id' => 'nullable|exists:categories,id',
            'amount' => 'sometimes|required|numeric',
            'description' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:255',
            'transaction_date' => 'sometimes|required|date',
        ]);

        $transaction->update($validated);

        return response()->json($transaction);
    }

    /**
     * Delete a transaction.
     */
    public function destroy(Transaction $transaction)
    {
        $this->authorize('delete', $transaction);
        $transaction->delete();

        return response()->json(null, 204);
    }
}
