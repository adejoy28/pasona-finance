<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Category;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BudgetController extends Controller
{
    /**
     * List all budgets for a given month, with category spending calculated.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $month = $request->input('month');

        if (!$month || !preg_match('/^\d{4}-\d{2}$/', $month)) {
            $month = Carbon::now()->format('Y-m');
        }

        $startOfMonth = Carbon::parse($month . '-01')->startOfMonth();
        $endOfMonth = Carbon::parse($month . '-01')->endOfMonth();

        // 1. Get all expense categories for this user
        $categories = $user->categories()->where('type', 'expense')->get();

        // 2. Get budgets for this month
        $budgets = Budget::where('user_id', $user->id)
            ->where('month', $month)
            ->get()
            ->keyBy('category_id');

        // 3. Get total spending per category in this month
        $spending = $user->transactions()
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->select('category_id', \DB::raw('SUM(amount) as total'))
            ->groupBy('category_id')
            ->pluck('total', 'category_id')
            ->all();

        $items = $categories->map(function ($cat) use ($budgets, $spending) {
            $budget = $budgets->get($cat->id);
            $limit = $budget ? (float) $budget->limit_amount : null;
            $spent = (float) ($spending[$cat->id] ?? 0.0);
            $isGoal = strtolower($cat->name) === 'savings';

            // State calculation: ok, near (>=85%), over (>100%), goal, way
            $state = 'none';
            if ($limit !== null && $limit > 0) {
                $pct = $spent / $limit;
                if ($isGoal) {
                    $state = $pct >= 1.0 ? 'goal' : 'way';
                } else {
                    $state = $pct > 1.0 ? 'over' : ($pct >= 0.85 ? 'near' : 'ok');
                }
            }

            return [
                'id' => $budget ? $budget->id : null,
                'category_id' => $cat->id,
                'category_name' => $cat->name,
                'category_type' => $cat->type,
                'is_goal' => $isGoal,
                'limit_amount' => $limit,
                'spent' => $spent,
                'state' => $state,
                'left' => ($limit !== null && $limit > 0) ? ($limit - $spent) : null,
            ];
        });

        // Summary calculations
        $budgeted = $items->filter(fn ($it) => $it['limit_amount'] !== null && $it['limit_amount'] > 0);
        $plannedTotal = $budgeted->sum('limit_amount');
        $spentTotal = $budgeted->sum('spent');
        $leftTotal = $plannedTotal - $spentTotal;
        $overCount = $budgeted->where('state', 'over')->count();
        $nearCount = $budgeted->where('state', 'near')->count();

        return response()->json([
            'month' => $month,
            'summary' => [
                'planned' => (float) $plannedTotal,
                'spent' => (float) $spentTotal,
                'left' => (float) $leftTotal,
                'pct_used' => $plannedTotal > 0 ? (int) round(($spentTotal / $plannedTotal) * 100) : 0,
                'over_count' => $overCount,
                'near_count' => $nearCount,
            ],
            'categories' => $items->values(),
        ]);
    }

    /**
     * Upsert a budget limit for a single category or bulk update multiple category limits.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Bulk upsert support: { month: "2026-09", budgets: [{ category_id: 1, limit_amount: 50000 }] }
        if ($request->has('budgets') && is_array($request->input('budgets'))) {
            $validated = $request->validate([
                'month' => 'required|date_format:Y-m',
                'budgets' => 'required|array',
                'budgets.*.category_id' => 'required|integer',
                'budgets.*.limit_amount' => 'nullable|numeric|min:0',
            ]);

            $month = $validated['month'];
            $results = [];

            foreach ($validated['budgets'] as $entry) {
                $catId = $entry['category_id'];
                $limit = $entry['limit_amount'];

                // Verify category belongs to user
                $category = $user->categories()->find($catId);
                if (!$category) continue;

                if ($limit === null || (float)$limit <= 0) {
                    Budget::where('user_id', $user->id)
                        ->where('category_id', $catId)
                        ->where('month', $month)
                        ->delete();
                } else {
                    $results[] = Budget::updateOrCreate(
                        ['user_id' => $user->id, 'category_id' => $catId, 'month' => $month],
                        ['limit_amount' => $limit]
                    );
                }
            }

            Cache::forget("user:{$user->id}:summary:{$month}");
            return response()->json(['message' => 'Budgets updated', 'count' => count($results)]);
        }

        // Single category upsert
        $validated = $request->validate([
            'month' => 'required|date_format:Y-m',
            'category_id' => 'required|integer',
            'limit_amount' => 'nullable|numeric|min:0',
        ]);

        $category = $user->categories()->findOrFail($validated['category_id']);
        $month = $validated['month'];
        $limit = $validated['limit_amount'];

        if ($limit === null || (float)$limit <= 0) {
            Budget::where('user_id', $user->id)
                ->where('category_id', $category->id)
                ->where('month', $month)
                ->delete();
            $budget = null;
        } else {
            $budget = Budget::updateOrCreate(
                ['user_id' => $user->id, 'category_id' => $category->id, 'month' => $month],
                ['limit_amount' => $limit]
            );
        }

        Cache::forget("user:{$user->id}:summary:{$month}");

        return response()->json($budget ?: ['message' => 'Budget limit cleared']);
    }

    /**
     * Copy budget limits from the previous month to the target month.
     */
    public function copyPrevious(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'target_month' => 'required|date_format:Y-m',
            'source_month' => 'nullable|date_format:Y-m',
        ]);

        $targetMonth = $validated['target_month'];
        $sourceMonth = $validated['source_month'] ?? Carbon::parse($targetMonth . '-01')->subMonth()->format('Y-m');

        $previousBudgets = Budget::where('user_id', $user->id)
            ->where('month', $sourceMonth)
            ->get();

        $copied = 0;
        foreach ($previousBudgets as $prev) {
            Budget::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'category_id' => $prev->category_id,
                    'month' => $targetMonth,
                ],
                [
                    'limit_amount' => $prev->limit_amount,
                ]
            );
            $copied++;
        }

        Cache::forget("user:{$user->id}:summary:{$targetMonth}");

        return response()->json([
            'message' => "Copied {$copied} budget limits from {$sourceMonth} to {$targetMonth}",
            'count' => $copied,
        ]);
    }
}
