<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\RecurringBill;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class RecurringBillController extends Controller
{
    /**
     * List all recurring bills and income sources for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $bills = $user->recurringBills()
            ->with(['account', 'category'])
            ->orderBy('next_due', 'asc')
            ->get();

        $today = Carbon::today();
        $items = $bills->map(function ($b) use ($today) {
            $due = Carbon::parse($b->next_due);
            $daysUntilDue = (int) $today->diffInDays($due, false);

            return [
                'id' => $b->id,
                'name' => $b->name,
                'amount' => (float) $b->amount,
                'type' => $b->type,
                'account_id' => $b->account_id,
                'account_name' => $b->account ? $b->account->name : null,
                'category_id' => $b->category_id,
                'category_name' => $b->category ? $b->category->name : null,
                'frequency' => $b->frequency,
                'next_due' => $b->next_due->format('Y-m-d'),
                'days_until_due' => $daysUntilDue,
                'is_overdue' => $daysUntilDue < 0,
                'is_due_today' => $daysUntilDue === 0,
                'is_due_soon' => $daysUntilDue > 0 && $daysUntilDue <= 7,
            ];
        });

        // 30-day projection calculation
        $next30 = $items->filter(fn ($it) => $it['days_until_due'] >= 0 && $it['days_until_due'] <= 30);
        $goingOut = $next30->where('type', 'expense')->sum('amount');
        $comingIn = $next30->where('type', 'income')->sum('amount');
        $net30 = $comingIn - $goingOut;

        return response()->json([
            'summary' => [
                'next_30_days_net' => (float) $net30,
                'next_30_days_outgoing' => (float) $goingOut,
                'next_30_days_incoming' => (float) $comingIn,
                'next_30_days_count' => $next30->count(),
                'total_count' => $items->count(),
            ],
            'bills' => $items->values(),
        ]);
    }

    /**
     * Create a new recurring bill or income item.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:expense,income',
            'account_id' => 'required|integer|exists:accounts,id',
            'category_id' => 'nullable|integer|exists:categories,id',
            'frequency' => 'required|in:weekly,monthly,yearly',
            'next_due' => 'required|date',
        ]);

        $user->accounts()->findOrFail($validated['account_id']);
        if (!empty($validated['category_id'])) {
            $user->categories()->findOrFail($validated['category_id']);
        }

        $bill = $user->recurringBills()->create($validated);

        return response()->json($bill->load(['account', 'category']), 201);
    }

    /**
     * Update a recurring bill.
     */
    public function update(Request $request, RecurringBill $recurringBill)
    {
        $this->authorize('update', $recurringBill);
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'amount' => 'sometimes|numeric|min:0.01',
            'type' => 'sometimes|in:expense,income',
            'account_id' => 'sometimes|integer|exists:accounts,id',
            'category_id' => 'nullable|integer|exists:categories,id',
            'frequency' => 'sometimes|in:weekly,monthly,yearly',
            'next_due' => 'sometimes|date',
        ]);

        if (!empty($validated['account_id'])) {
            $user->accounts()->findOrFail($validated['account_id']);
        }
        if (!empty($validated['category_id'])) {
            $user->categories()->findOrFail($validated['category_id']);
        }

        $recurringBill->update($validated);

        return response()->json($recurringBill->load(['account', 'category']));
    }

    /**
     * Delete a recurring bill.
     */
    public function destroy(RecurringBill $recurringBill)
    {
        $this->authorize('delete', $recurringBill);
        $recurringBill->delete();

        return response()->json(['message' => 'Recurring item deleted']);
    }

    /**
     * Mark a recurring item as paid or received.
     * Records a transaction and advances next_due.
     */
    public function markPaid(Request $request, RecurringBill $recurringBill)
    {
        $this->authorize('update', $recurringBill);
        $user = $request->user();

        $todayIso = Carbon::now()->format('Y-m-d');

        $result = DB::transaction(function () use ($user, $recurringBill, $todayIso) {
            $tx = $user->transactions()->create([
                'account_id' => $recurringBill->account_id,
                'category_id' => $recurringBill->category_id,
                'type' => $recurringBill->type,
                'amount' => $recurringBill->amount,
                'transaction_date' => $todayIso,
                'description' => $recurringBill->name,
            ]);

            $previousDue = $recurringBill->next_due;
            $recurringBill->advanceNextDue();

            return [
                'transaction' => $tx,
                'bill' => $recurringBill->fresh()->load(['account', 'category']),
                'previous_due' => $previousDue,
            ];
        });

        // Bust caches
        Cache::forget("user:{$user->id}:accounts:balances");
        Cache::forget("user:{$user->id}:summary:" . Carbon::now()->format('Y-m'));

        $label = $recurringBill->type === 'income' ? 'received' : 'paid';

        return response()->json([
            'message' => "Marked {$recurringBill->name} as {$label}",
            'transaction' => $result['transaction'],
            'bill' => $result['bill'],
            'previous_due' => $result['previous_due'],
        ]);
    }
}
