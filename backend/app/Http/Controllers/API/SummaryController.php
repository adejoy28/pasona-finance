<?php

namespace App\Http\Controllers\API;

/**
 * SummaryController File
 * 
 * Provides aggregated data for the dashboard.
 */

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Carbon\Carbon;

/**
 * SummaryController Class
 * 
 * Aggregates financial data for the current month.
 */
class SummaryController extends Controller
{
    /**
     * Get the dashboard summary data.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        // 1. Account Balances — single batched query instead of N+1.
        $accounts = $user->accounts;
        $balances = Account::balancesFor($user->id, $accounts->pluck('id')->all());
        $accounts->each(function ($account) use ($balances) {
            $account->setAttribute('balance', $balances[$account->id] ?? 0.0);
            $account->append('balance');
        });
        $totalBalance = array_sum($balances);

        // 2. Monthly Income vs Expense
        $monthlyIncome = $user->transactions()
            ->where('type', 'income')
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $monthlyExpense = $user->transactions()
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        // 3. Category Breakdown (Expenses)
        $categoryBreakdown = $user->transactions()
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->select('category_id', \DB::raw('SUM(amount) as total'))
            ->groupBy('category_id')
            ->with('category')
            ->get()
            ->map(function ($item) {
                return [
                    'category_name' => $item->category ? $item->category->name : 'Uncategorized',
                    'total' => $item->total,
                ];
            });

        return response()->json([
            'total_balance' => $totalBalance,
            'accounts' => $accounts,
            'monthly_summary' => [
                'income' => $monthlyIncome,
                'expense' => $monthlyExpense,
                'net' => $monthlyIncome - $monthlyExpense,
            ],
            'category_breakdown' => $categoryBreakdown,
        ]);
    }
}
