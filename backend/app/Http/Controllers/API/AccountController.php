<?php

namespace App\Http\Controllers\API;

/**
 * AccountController File
 * 
 * Handles CRUD operations for financial accounts.
 */

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
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
     * Cached for 1 hour under "user:{id}:accounts:balances". The cache
     * includes both the account list and their computed balances so the
     * dashboard can render in a single round-trip. Cache is busted on
     * every write: account CRUD (this controller) and transaction writes
     * (TransactionController, ImportController, ProcessSync job) because
     * transactions change account balances.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $key = "user:{$user->id}:accounts:balances";

        // Cache the entire accounts-with-balances payload. The closure
        // runs only on cache miss — typically once per hour per user.
        $accounts = Cache::remember($key, now()->addHour(), function () use ($user) {
            $accounts = $user->accounts;
            $balances = Account::balancesFor($user->id, $accounts->pluck('id')->all());
            $accounts->each(function ($account) use ($balances) {
                $account->setAttribute('balance', $balances[$account->id] ?? 0.0);
                $account->append('balance');
            });
            return $accounts;
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
            'currency' => 'required|string|size:3|alpha:alpha',
            'starting_balance' => 'required|numeric',
            'notes' => 'nullable|string',
        ]);

        $account = $request->user()->accounts()->create($validated);

        // Bust accounts cache (new account added) and summary cache
        // (total_balance changes when a new account with starting_balance appears).
        Cache::forget("user:{$request->user()->id}:accounts:balances");
        Cache::forget("user:{$request->user()->id}:summary:" . now()->format('Y-m'));

        AppNotification::push(
            $request->user(),
            'account_created',
            'New account added',
            "Your {$validated['type']} account \"{$validated['name']}\" is ready to use.",
            ['account_id' => $account->id],
        );

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
            'currency' => 'sometimes|required|string|size:3|alpha:alpha',
            'starting_balance' => 'sometimes|required|numeric',
            'notes' => 'nullable|string',
        ]);

        $account->update($validated);

        // Bust accounts cache (name/type/balance changed) and summary cache.
        Cache::forget("user:{$request->user()->id}:accounts:balances");
        Cache::forget("user:{$request->user()->id}:summary:" . now()->format('Y-m'));

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

        $userId = $account->user_id;

        DB::transaction(function () use ($account) {
            $account->transactions()->delete();
            $account->receivedTransfers()->delete();
            $account->delete();
        });

        // Bust both caches — account removed, total_balance and list change.
        Cache::forget("user:{$userId}:accounts:balances");
        Cache::forget("user:{$userId}:summary:" . now()->format('Y-m'));

        return response()->json(null, 204);
    }
}
