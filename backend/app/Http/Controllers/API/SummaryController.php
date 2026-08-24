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
use Illuminate\Support\Facades\Cache;
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
     * Cached for 60 seconds under "user:{id}:summary:{YYYY-MM}". The key
     * includes the current month so it auto-rolls on month boundary. TTL
     * is short (60s) because the summary is the highest-latency read in
     * the app (3 aggregate queries + accounts list) but changes frequently
     * during active use. Cache is busted on every transaction/account write.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $from = $request->input('from');
        $to = $request->input('to');

        if ($from && $to) {
            $startOfMonth = Carbon::parse($from)->startOfDay();
            $endOfMonth = Carbon::parse($to)->endOfDay();
            $monthKey = Carbon::parse($from)->format('Y-m');
        } else {
            $startOfMonth = Carbon::now()->startOfMonth();
            $endOfMonth = Carbon::now()->endOfMonth();
            $monthKey = now()->format('Y-m');
        }

        $key = "user:{$user->id}:summary:{$monthKey}";

        // Cache the entire summary payload. On cache miss, runs 4 queries:
        // accounts list, balances batch, monthly income sum, monthly expense sum,
        // plus the category breakdown. On hit, returns instantly.
        $payload = Cache::remember($key, now()->addSeconds(60), function () use ($user, $startOfMonth, $endOfMonth) {
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
                        'category_id' => $item->category_id,
                        'category_name' => $item->category ? $item->category->name : 'Uncategorized',
                        'total' => $item->total,
                    ];
                });
            // 4. Daily Breakdown
            $dailyTransactions = $user->transactions()
                ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
                ->get(['transaction_date', 'type', 'amount']);

            $dailyBreakdown = $dailyTransactions->groupBy(function($item) {
                return \Carbon\Carbon::parse($item->transaction_date)->format('Y-m-d');
            })->map(function ($dayTransactions, $date) {
                return [
                    'date' => $date,
                    'income' => $dayTransactions->where('type', 'income')->sum('amount'),
                    'expense' => $dayTransactions->where('type', 'expense')->sum('amount'),
                ];
            })->sortKeys()->values();

            return [
                'total_balance' => $totalBalance,
                'accounts' => $accounts,
                'monthly_summary' => [
                    'income' => $monthlyIncome,
                    'expense' => $monthlyExpense,
                    'net' => $monthlyIncome - $monthlyExpense,
                ],
                'category_breakdown' => $categoryBreakdown,
                'daily_breakdown' => $dailyBreakdown,
            ];
        });

        return response()->json($payload);
    }
}
