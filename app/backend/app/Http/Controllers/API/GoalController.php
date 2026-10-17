<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Goal;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class GoalController extends Controller
{
    /**
     * List all financial goals for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $goals = $user->goals()->with('account')->orderBy('target_date', 'asc')->get();

        $today = Carbon::today();
        $items = $goals->map(function ($goal) use ($today) {
            $targetDate = Carbon::parse($goal->target_date);
            $monthsRemaining = max(1, ($targetDate->year - $today->year) * 12 + ($targetDate->month - $today->month));
            $daysRemaining = (int) $today->diffInDays($targetDate, false);
            $remainingAmount = max(0, (float)$goal->target_amount - (float)$goal->saved_amount);
            $monthlyNeeded = $remainingAmount > 0 ? (float) ceil($remainingAmount / $monthsRemaining) : 0.0;
            $percent = (float)$goal->target_amount > 0 ? min(100, round(((float)$goal->saved_amount / (float)$goal->target_amount) * 100)) : 0;

            return [
                'id' => $goal->id,
                'name' => $goal->name,
                'target_amount' => (float) $goal->target_amount,
                'saved_amount' => (float) $goal->saved_amount,
                'target_date' => $goal->target_date->format('Y-m-d'),
                'account_id' => $goal->account_id,
                'account_name' => $goal->account ? $goal->account->name : null,
                'color' => $goal->color ?: '#2a78d6',
                'months_remaining' => $monthsRemaining,
                'days_remaining' => $daysRemaining,
                'monthly_needed' => $monthlyNeeded,
                'percent' => $percent,
                'is_completed' => (float)$goal->saved_amount >= (float)$goal->target_amount,
            ];
        });

        $totalSaved = $items->sum('saved_amount');
        $totalTarget = $items->sum('target_amount');

        return response()->json([
            'summary' => [
                'total_saved' => (float) $totalSaved,
                'total_target' => (float) $totalTarget,
                'count' => $items->count(),
                'percent' => $totalTarget > 0 ? min(100, round(($totalSaved / $totalTarget) * 100)) : 0,
            ],
            'goals' => $items->values(),
        ]);
    }

    /**
     * Create a new savings goal.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:1',
            'target_date' => 'required|date|after:today',
            'account_id' => 'nullable|integer|exists:accounts,id',
            'color' => 'nullable|string|max:32',
        ]);

        if (!empty($validated['account_id'])) {
            $user->accounts()->findOrFail($validated['account_id']);
        }

        $goal = $user->goals()->create([
            'name' => $validated['name'],
            'target_amount' => $validated['target_amount'],
            'saved_amount' => 0,
            'target_date' => $validated['target_date'],
            'account_id' => $validated['account_id'] ?? null,
            'color' => $validated['color'] ?? null,
        ]);

        return response()->json($goal, 201);
    }

    /**
     * Update a savings goal.
     */
    public function update(Request $request, Goal $goal)
    {
        $this->authorize('update', $goal);
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'target_amount' => 'sometimes|numeric|min:1',
            'target_date' => 'sometimes|date',
            'account_id' => 'nullable|integer|exists:accounts,id',
            'color' => 'nullable|string|max:32',
        ]);

        if (isset($validated['account_id']) && $validated['account_id']) {
            $user->accounts()->findOrFail($validated['account_id']);
        }

        $goal->update($validated);

        return response()->json($goal);
    }

    /**
     * Delete a goal.
     */
    public function destroy(Goal $goal)
    {
        $this->authorize('delete', $goal);
        $goal->delete();

        return response()->json(['message' => 'Goal deleted']);
    }

    /**
     * Contribute money towards a goal.
     * Creates an expense transaction categorized under 'Savings' and increments saved_amount.
     */
    public function contribute(Request $request, Goal $goal)
    {
        $this->authorize('update', $goal);
        $user = $request->user();

        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'account_id' => 'required|integer|exists:accounts,id',
            'date' => 'nullable|date',
        ]);

        $account = $user->accounts()->findOrFail($validated['account_id']);
        $amount = (float) $validated['amount'];
        $date = $validated['date'] ?? Carbon::now()->format('Y-m-d');

        // Find or create a 'Savings' category for this user
        $savingsCat = $user->categories()->where('name', 'Savings')->first();
        if (!$savingsCat) {
            $savingsCat = $user->categories()->create([
                'name' => 'Savings',
                'type' => 'expense',
            ]);
            Cache::forget("user:{$user->id}:categories");
        }

        $result = DB::transaction(function () use ($user, $account, $savingsCat, $goal, $amount, $date) {
            $tx = $user->transactions()->create([
                'account_id' => $account->id,
                'category_id' => $savingsCat->id,
                'type' => 'expense',
                'amount' => $amount,
                'transaction_date' => $date,
                'description' => 'Saving: ' . $goal->name,
            ]);

            $goal->increment('saved_amount', $amount);

            return [
                'goal' => $goal->fresh(),
                'transaction' => $tx,
            ];
        });

        // Bust caches
        Cache::forget("user:{$user->id}:accounts:balances");
        Cache::forget("user:{$user->id}:summary:" . Carbon::parse($date)->format('Y-m'));

        return response()->json([
            'message' => "Added money to {$goal->name}",
            'goal' => $result['goal'],
            'transaction' => $result['transaction'],
        ]);
    }
}
