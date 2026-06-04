<?php

namespace App\Http\Controllers\API;

/**
 * AccountController File
 * 
 * Handles CRUD operations for financial accounts.
 */

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * AccountController Class
 * 
 * Manage user accounts (Bank, Mobile Money, Cash).
 */
class AccountController extends Controller
{
    /**
     * List all accounts for the authenticated user with their calculated balances.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $accounts = $user->accounts;

        $balances = Account::balancesFor($user->id, $accounts->pluck('id')->all());

        $accounts->each(function ($account) use ($balances) {
            $account->setAttribute('balance', $balances[$account->id] ?? 0.0);
            $account->append('balance');
        });

        return response()->json($accounts);
    }

    /**
     * Create a new financial account.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('accounts', 'name')->where('user_id', $request->user()->id),
            ],
            'type' => 'required|in:bank,mobile,cash',
            'starting_balance' => 'required|numeric',
            'notes' => 'nullable|string',
        ]);

        $account = $request->user()->accounts()->create($validated);

        return response()->json($account, 201);
    }

    /**
     * Display a specific account.
     * 
     * @param Account $account
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Account $account)
    {
        $this->authorize('view', $account);
        $account->append('balance');
        return response()->json($account);
    }

    /**
     * Update an existing account.
     * 
     * @param Request $request
     * @param Account $account
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, Account $account)
    {
        $this->authorize('update', $account);

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('accounts', 'name')
                    ->where('user_id', $request->user()->id)
                    ->ignore($account->id),
            ],
            'type' => 'sometimes|required|in:bank,mobile,cash',
            'starting_balance' => 'sometimes|required|numeric',
            'notes' => 'nullable|string',
        ]);

        $account->update($validated);

        return response()->json($account);
    }

    /**
     * Delete an account.
     * 
     * @param Account $account
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Account $account)
    {
        $this->authorize('delete', $account);
        $account->delete();

        return response()->json(null, 204);
    }
}
