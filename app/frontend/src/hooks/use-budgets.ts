import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
  budgets as budgetsApi,
  goals as goalsApi,
  recurringBills as recurringBillsApi,
  summary as summaryApi,
  accounts as accountsApi,
  categories as categoriesApi,
  type BudgetMonthResponseDto,
  type GoalsResponseDto,
  type RecurringBillsResponseDto,
  type AccountDto,
  type CategoryDto,
} from "@/lib/api";
import { notify } from "@/hooks/use-toast";

export interface DailyPacePoint {
  day: number;
  dateStr: string;
  spent: number;
  cumSpent: number;
  planPace: number;
}

export function useBudgets(initialDate?: Date) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: "budget" | "goals" | "bills" =
    tabParam === "goals"
      ? "goals"
      : tabParam === "bills" || tabParam === "recurring"
      ? "bills"
      : "budget";

  const [monthOffset, setMonthOffset] = useState(0);
  const [activeTab, setActiveTabState] = useState<"budget" | "goals" | "bills">(initialTab);

  useEffect(() => {
    if (tabParam === "goals") {
      setActiveTabState("goals");
    } else if (tabParam === "bills" || tabParam === "recurring") {
      setActiveTabState("bills");
    } else if (tabParam === "budget") {
      setActiveTabState("budget");
    }
  }, [tabParam]);

  const setActiveTab = useCallback(
    (tab: "budget" | "goals" | "bills") => {
      setActiveTabState(tab);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === "budget") {
            next.delete("tab");
          } else {
            next.set("tab", tab === "bills" ? "recurring" : tab);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [budgetData, setBudgetData] = useState<BudgetMonthResponseDto | null>(null);
  const [goalsData, setGoalsData] = useState<GoalsResponseDto | null>(null);
  const [billsData, setBillsData] = useState<RecurringBillsResponseDto | null>(null);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [dailyData, setDailyData] = useState<Array<{ date: string; income: number; expense: number }>>([]);

  const monthDate = useMemo(() => {
    const d = initialDate ? new Date(initialDate) : new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [initialDate, monthOffset]);

  const monthKey = useMemo(() => {
    const y = monthDate.getFullYear();
    const m = String(monthDate.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, [monthDate]);

  const monthLabel = useMemo(() => {
    return monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [monthDate]);

  const nextMonthLabel = useMemo(() => {
    const n = new Date(monthDate);
    n.setMonth(n.getMonth() + 1);
    return n.toLocaleDateString("en-US", { month: "long" });
  }, [monthDate]);

  const nextMonthKey = useMemo(() => {
    const n = new Date(monthDate);
    n.setMonth(n.getMonth() + 1);
    const y = n.getFullYear();
    const m = String(n.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, [monthDate]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, gRes, rRes, accs, cats, sumRes] = await Promise.all([
        budgetsApi.getBudgets(monthKey).catch(() => null),
        goalsApi.listGoals().catch(() => null),
        recurringBillsApi.listRecurringBills().catch(() => null),
        accountsApi.listAccounts().catch(() => []),
        categoriesApi.listCategories().catch(() => []),
        summaryApi.getSummary({ month: monthKey }).catch(() => null),
      ]);

      if (bRes) setBudgetData(bRes);
      if (gRes) setGoalsData(gRes);
      if (rRes) setBillsData(rRes);
      setAccounts(accs);
      setCategories(cats);

      if (sumRes && sumRes.daily_breakdown) {
        setDailyData(
          sumRes.daily_breakdown.map((d: any) => ({
            date: d.date,
            income: Number(d.income || 0),
            expense: Number(d.expense || 0),
          }))
        );
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load budget data");
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Pace line points calculation
  const pacePoints: DailyPacePoint[] = useMemo(() => {
    const year = monthDate.getFullYear();
    const monthIndex = monthDate.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const spendingByDay = new Map<number, number>();
    for (const d of dailyData) {
      const dt = new Date(d.date + "T00:00:00");
      if (dt.getFullYear() === year && dt.getMonth() === monthIndex) {
        const dayNum = dt.getDate();
        spendingByDay.set(dayNum, (spendingByDay.get(dayNum) || 0) + d.expense);
      }
    }

    const plannedTotal = budgetData?.summary.planned || 0;
    const pts: DailyPacePoint[] = [];
    let runningSpend = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const spentThisDay = spendingByDay.get(day) || 0;
      runningSpend += spentThisDay;
      const linearPace = plannedTotal > 0 ? Math.round((plannedTotal * day) / daysInMonth) : 0;

      pts.push({
        day,
        dateStr: `${monthDate.toLocaleDateString("en-US", { month: "short" })} ${day}`,
        spent: spentThisDay,
        cumSpent: runningSpend,
        planPace: linearPace,
      });
    }

    return pts;
  }, [monthDate, dailyData, budgetData]);

  // Actions
  const saveCategoryLimit = useCallback(
    async (categoryId: number, limitAmount: number | null) => {
      try {
        await budgetsApi.setBudgetLimit({
          month: monthKey,
          category_id: categoryId,
          limit_amount: limitAmount,
        });
        notify.success("Limit updated");
        await loadAll();
      } catch (err: any) {
        notify.error(err?.message || "Could not save limit");
        throw err;
      }
    },
    [monthKey, loadAll]
  );

  const saveBulkLimits = useCallback(
    async (limits: Array<{ category_id: number; limit_amount: number | null }>) => {
      try {
        await budgetsApi.bulkSetBudgetLimits({
          month: monthKey,
          budgets: limits,
        });
        notify.success("Plan saved");
        await loadAll();
      } catch (err: any) {
        notify.error(err?.message || "Could not save plan");
        throw err;
      }
    },
    [monthKey, loadAll]
  );

  const copyPreviousMonth = useCallback(
    async (targetMonth: string, sourceMonth?: string) => {
      try {
        const res = await budgetsApi.copyPreviousMonthBudgets({
          target_month: targetMonth,
          source_month: sourceMonth,
        });
        notify.success(`Plan copied to ${targetMonth}`);
        await loadAll();
        return res;
      } catch (err: any) {
        notify.error(err?.message || "Could not copy plan");
        throw err;
      }
    },
    [loadAll]
  );

  const createGoal = useCallback(
    async (input: {
      name: string;
      target_amount: number;
      target_date: string;
      account_id?: number | null;
      color?: string | null;
    }) => {
      try {
        await goalsApi.createGoal(input);
        notify.success("Goal created");
        await loadAll();
      } catch (err: any) {
        notify.error(err?.message || "Could not create goal");
        throw err;
      }
    },
    [loadAll]
  );

  const contributeGoal = useCallback(
    async (goalId: number, amount: number, accountId: number, date?: string) => {
      try {
        await goalsApi.contributeToGoal(goalId, { amount, account_id: accountId, date });
        notify.success("Money added to goal");
        await loadAll();
      } catch (err: any) {
        notify.error(err?.message || "Could not record contribution");
        throw err;
      }
    },
    [loadAll]
  );

  const deleteGoal = useCallback(
    async (goalId: number) => {
      try {
        await goalsApi.deleteGoal(goalId);
        notify.info("Goal deleted");
        await loadAll();
      } catch (err: any) {
        notify.error(err?.message || "Could not delete goal");
        throw err;
      }
    },
    [loadAll]
  );

  const createRecurringBill = useCallback(
    async (input: {
      name: string;
      amount: number;
      type: "expense" | "income";
      account_id: number;
      category_id?: number | null;
      frequency: "weekly" | "monthly" | "yearly";
      next_due: string;
    }) => {
      try {
        await recurringBillsApi.createRecurringBill(input);
        notify.success("Recurring item saved");
        await loadAll();
      } catch (err: any) {
        notify.error(err?.message || "Could not save recurring item");
        throw err;
      }
    },
    [loadAll]
  );

  const markBillPaid = useCallback(
    async (billId: number) => {
      try {
        const res = await recurringBillsApi.markRecurringBillPaid(billId);
        notify.success(res.message || "Marked paid");
        await loadAll();
      } catch (err: any) {
        notify.error(err?.message || "Could not update recurring item");
        throw err;
      }
    },
    [loadAll]
  );

  const deleteRecurringBill = useCallback(
    async (billId: number) => {
      try {
        await recurringBillsApi.deleteRecurringBill(billId);
        notify.info("Recurring item deleted");
        await loadAll();
      } catch (err: any) {
        notify.error(err?.message || "Could not delete recurring item");
        throw err;
      }
    },
    [loadAll]
  );

  return {
    monthOffset,
    setMonthOffset,
    monthDate,
    monthKey,
    monthLabel,
    nextMonthLabel,
    nextMonthKey,
    activeTab,
    setActiveTab,
    loading,
    error,
    refresh: loadAll,
    budgetData,
    goalsData,
    billsData,
    accounts,
    categories,
    pacePoints,
    saveCategoryLimit,
    saveBulkLimits,
    copyPreviousMonth,
    createGoal,
    contributeGoal,
    deleteGoal,
    createRecurringBill,
    markBillPaid,
    deleteRecurringBill,
  };
}
