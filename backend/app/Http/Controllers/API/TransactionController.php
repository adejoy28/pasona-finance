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
        $query = $request->user()->transactions()
            ->with(['account', 'toAccount', 'category'])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc');

        if ($request->filled('account_id')) {
            $id = (int) $request->input('account_id');
            $query->where(function ($q) use ($id) {
                $q->where('account_id', $id)
                  ->orWhere('to_account_id', $id);
            });
        }

        return response()->json($query->paginate(50));
    }

    /**
     * Create a new transaction.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Check if the user has any accounts
        if ($request->user()->accounts()->count() === 0) {
            return response()->json([
                'message' => 'You must create at least one account before adding transactions.'
            ], 403);
        }

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
        if (!$request->force && Transaction::isPotentialDuplicate(
            $request->user()->id,
            $validated['transaction_date'],
            $validated['type'],
            $validated['amount'],
            $validated['account_id'],
        )) {
            return response()->json([
                'message' => 'Potential duplicate detected.',
                'is_duplicate' => true
            ], 409);
        }

        $transaction = $request->user()->transactions()->create($validated);

        return response()->json($transaction, 201);
    }

    /**
     * Bulk store for offline sync using Queue Jobs.
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

        $transactions = collect($request->transactions)->map(function ($item) use ($request) {
            $item['user_id'] = $request->user()->id;
            $item['is_synced'] = true;
            return $item;
        })->toArray();

        // Dispatch to background queue as per requirements
        \App\Jobs\ProcessSync::dispatch($transactions);

        return response()->json([
            'message' => 'Sync process started in the background.'
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
