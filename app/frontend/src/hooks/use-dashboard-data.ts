/**
 * useDashboardData Hook
 *
 * Implements Specification Section 3: "One data source for the whole screen".
 * Returns a single view model. Widgets receive their numbers from it as props.
 * No widget may fetch or compute totals itself.
 *
 * Enforces:
 * - spent = sum of expense transactions in month where category is spending (excludes saving-kind categories and transfers).
 * - saved = sum of expense transactions in saving-kind categories.
 * - net = income - spent - saved (equals balance delta for month without transfers).
 * - streakDays = client-side consecutive days ending today/yesterday.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  accounts as accountsApi,
  categories as categoriesApi,
  summary as summaryApi,
  transactions as transactionsApi,
  budgets as budgetsApi,
  goals as goalsApi,
  recurringBills as recurringBillsApi,
  type AccountDto,
  type CategoryDto,
  type SummaryDto,
  type TransactionDto,
  type BudgetMonthResponseDto,
  type GoalsResponseDto,
  type RecurringBillsResponseDto,
} from "@/lib/api";
import {
  calculateMonthlyTotals,
  calculateNet,
  isSavingCategory,
  toNumber,
} from "@/lib/dashboard-math";
import { calculateStreak } from "@/lib/quick-log";
import { countQueuedTransactions } from "@/lib/offline/queue";
import { useMe } from "@/hooks/use-me";
import { detectDuplicatePairs, getDismissedPairIds } from "@/lib/duplicate-detector";

export interface RecurringBill {
  id: string | number;
  name: string;
  amount: number;
  nextDue: string; // YYYY-MM-DD
  frequency?: string;
  accountName?: string;
  daysUntilDue: number;
  isOverdue: boolean;
}

export interface GoalItem {
  id: string | number;
  name: string;
  targetAmount: number;
  savedAmount: number;
  monthlyAmountNeeded?: number;
}

export interface AttentionItem {
  id: string;
  type: "overdue" | "duplicate" | "over_budget" | "near_budget" | "verify_email" | "pending_sync";
  title: string;
  detail: string;
  linkTo: string;
}

export interface SetupTodoItem {
  id: string;
  label: string;
  linkTo: string;
  completed: boolean;
}

export interface DashboardViewModel {
  balanceTotal: number;
  accountCount: number;
  accounts: AccountDto[];
  categories: CategoryDto[];
  income: number;
  spent: number;
  saved: number;
  net: number;
  spentChangeVsLastMonth: number | null; // e.g. -12 (12% lower) or 12 (12% higher)
  lastMonthName: string | null;
  budget: {
    planned: number;
    used: number;
    left: number;
    over: number;
    pctUsed: number;
  } | null;
  categoryBreakdown: {
    category_id?: number | null;
    category_name: string;
    total: number;
    pct?: number;
  }[];
  uncategorizedShare: number; // e.g. 0.35 (35%)
  trend6: {
    month: string;
    spent: number;
    isCurrent?: boolean;
  }[];
  recent: TransactionDto[]; // last 5 transactions of any type
  today: {
    count: number;
    spent: number;
    loggedToday: boolean;
  };
  streakDays: number;
  bills: RecurringBill[];
  goals: GoalItem[];
  attention: AttentionItem[];
  setupTodos: SetupTodoItem[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export interface DashboardCacheEntry {
  summary: SummaryDto;
  accounts: AccountDto[];
  categories: CategoryDto[];
  monthTx: TransactionDto[];
  recentTx: TransactionDto[];
  prevMonthSpent: number | null;
  budgetData?: BudgetMonthResponseDto | null;
  goalsData?: GoalsResponseDto | null;
  billsData?: RecurringBillsResponseDto | null;
  timestamp: number;
}

const dataCache = new Map<string, DashboardCacheEntry>();

export function invalidateDashboardDataCache(): void {
  dataCache.clear();
}

export function getDashboardCacheEntry(monthKey: string): DashboardCacheEntry | undefined {
  return dataCache.get(monthKey);
}

export function useDashboardData(monthDate: Date): DashboardViewModel {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = monthDate.getFullYear();
  const monthNum = monthDate.getMonth() + 1;
  const monthKey = `${year}-${pad(monthNum)}`;
  const monthFrom = `${monthKey}-01`;
  const monthEnd = new Date(year, monthNum, 0);
  const monthTo = `${monthKey}-${pad(monthEnd.getDate())}`;

  // Previous month calculations for spentChangeVsLastMonth
  const prevMonthDate = new Date(year, monthDate.getMonth() - 1, 1);
  const prevMonthName = prevMonthDate.toLocaleDateString("en-US", { month: "long" });
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${pad(prevMonthDate.getMonth() + 1)}`;
  const prevMonthFrom = `${prevMonthKey}-01`;
  const prevMonthEnd = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0);
  const prevMonthTo = `${prevMonthKey}-${pad(prevMonthEnd.getDate())}`;

  const cached = dataCache.get(monthKey);

  const [summary, setSummary] = useState<SummaryDto | null>(cached?.summary ?? null);
  const [accountDtos, setAccountDtos] = useState<AccountDto[]>(cached?.accounts ?? []);
  const [categories, setCategories] = useState<CategoryDto[]>(cached?.categories ?? []);
  const [monthTx, setMonthTx] = useState<TransactionDto[]>(cached?.monthTx ?? []);
  const [recentTx, setRecentTx] = useState<TransactionDto[]>(cached?.recentTx ?? []);
  const [prevMonthSpent, setPrevMonthSpent] = useState<number | null>(cached?.prevMonthSpent ?? null);
  const [budgetData, setBudgetData] = useState<BudgetMonthResponseDto | null>(cached?.budgetData ?? null);
  const [goalsData, setGoalsData] = useState<GoalsResponseDto | null>(cached?.goalsData ?? null);
  const [billsData, setBillsData] = useState<RecurringBillsResponseDto | null>(cached?.billsData ?? null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [loading, setLoading] = useState(!cached);

  const userQuery = useMe();
  const user = userQuery.data;

  const load = useCallback(async () => {
    try {
      const [sumRes, accRes, catRes, mTxRes, allTxRes, prevTxRes, offlineCount, bRes, gRes, rRes] =
        await Promise.all([
          summaryApi.getSummary({ from: monthFrom, to: monthTo, month: monthKey }),
          accountsApi.listAccounts(),
          categoriesApi.listCategories().catch(() => []),
          transactionsApi.listTransactions({ from: monthFrom, to: monthTo, per_page: 500 }),
          transactionsApi.listTransactions({ per_page: 100 }).catch(() => ({ data: [] })),
          transactionsApi
            .listTransactions({ from: prevMonthFrom, to: prevMonthTo, per_page: 500 })
            .catch(() => ({ data: [] })),
          countQueuedTransactions().catch(() => 0),
          budgetsApi.getBudgets(monthKey).catch(() => null),
          goalsApi.listGoals().catch(() => null),
          recurringBillsApi.listRecurringBills().catch(() => null),
        ]);

      // Calculate previous month spent (excluding savings categories and transfers)
      const prevTotals = calculateMonthlyTotals(prevTxRes.data ?? []);
      const prevSpent = prevTotals.spent;

      setSummary(sumRes);
      setAccountDtos(accRes);
      setCategories(catRes);
      setMonthTx(mTxRes.data ?? []);
      setRecentTx(allTxRes.data ?? []);
      setPrevMonthSpent(prevSpent > 0 ? prevSpent : null);
      if (bRes) setBudgetData(bRes);
      if (gRes) setGoalsData(gRes);
      if (rRes) setBillsData(rRes);
      setPendingSyncCount(offlineCount);

      dataCache.set(monthKey, {
        summary: sumRes,
        accounts: accRes,
        categories: catRes,
        monthTx: mTxRes.data ?? [],
        recentTx: allTxRes.data ?? [],
        prevMonthSpent: prevSpent > 0 ? prevSpent : null,
        budgetData: bRes,
        goalsData: gRes,
        billsData: rRes,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("[useDashboardData] Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [monthFrom, monthTo, monthKey, prevMonthFrom, prevMonthTo]);

  useEffect(() => {
    const entry = dataCache.get(monthKey);
    if (entry) {
      setSummary(entry.summary);
      setAccountDtos(entry.accounts);
      setCategories(entry.categories);
      setMonthTx(entry.monthTx);
      setRecentTx(entry.recentTx);
      setPrevMonthSpent(entry.prevMonthSpent);
      setBudgetData(entry.budgetData ?? null);
      setGoalsData(entry.goalsData ?? null);
      setBillsData(entry.billsData ?? null);
      setLoading(false);
    } else {
      setLoading(true);
    }
    void load();
  }, [monthKey, load]);

  const [duplicateVersion, setDuplicateVersion] = useState(0);

  useEffect(() => {
    const handleDuplicates = () => setDuplicateVersion((v) => v + 1);
    const handleMutation = () => {
      invalidateDashboardDataCache();
      void load();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void load();
      }
    };

    window.addEventListener("pasona:duplicates-changed", handleDuplicates);
    window.addEventListener("pasona:data-mutated", handleMutation);
    window.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pasona:duplicates-changed", handleDuplicates);
      window.removeEventListener("pasona:data-mutated", handleMutation);
      window.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [load]);

  // Saving category IDs set
  const savingsCategoryIds = useMemo(() => {
    return new Set(
      categories.filter((c) => isSavingCategory(c.name)).map((c) => c.id)
    );
  }, [categories]);

  // Pure financial totals (spent excludes savings and transfers; saved includes saving categories; net = income - spent - saved)
  const { income, spent, saved, net } = useMemo(() => {
    return calculateMonthlyTotals(monthTx, savingsCategoryIds);
  }, [monthTx, savingsCategoryIds]);

  // Balance Total
  const balanceTotal = useMemo(() => {
    if (summary && summary.total_balance !== undefined) {
      return toNumber(summary.total_balance);
    }
    return accountDtos.reduce((sum, a) => sum + toNumber(a.balance ?? a.starting_balance), 0);
  }, [summary, accountDtos]);

  // Accounts list
  const accounts = accountDtos;
  const accountCount = accounts.length;

  // Spent change vs last month (percent)
  const spentChangeVsLastMonth = useMemo(() => {
    if (prevMonthSpent === null || prevMonthSpent === 0) return null;
    if (spent === 0 && prevMonthSpent > 0) return -100;
    const diff = spent - prevMonthSpent;
    return Math.round((diff / prevMonthSpent) * 100);
  }, [spent, prevMonthSpent]);

  // Monthly Budget (from Phase 7 API or fallback to localStorage)
  const budget = useMemo(() => {
    if (budgetData && budgetData.summary.planned > 0) {
      const planned = budgetData.summary.planned;
      const used = spent;
      const left = Math.max(0, planned - used);
      const over = Math.max(0, used - planned);
      const pctUsed = Math.round((used / planned) * 100);
      return { planned, used, left, over, pctUsed };
    }
    if (typeof window === "undefined") return null;
    const rawBudget =
      localStorage.getItem(`pasona.budget.${monthKey}`) ||
      localStorage.getItem("pasona.monthly_budget");
    if (!rawBudget) return null;

    const planned = parseFloat(rawBudget);
    if (!Number.isFinite(planned) || planned <= 0) return null;

    const used = spent;
    const left = Math.max(0, planned - used);
    const over = Math.max(0, used - planned);
    const pctUsed = Math.round((used / planned) * 100);

    return { planned, used, left, over, pctUsed };
  }, [budgetData, monthKey, spent]);

  // Category Breakdown (spending kinds only, savings excluded)
  const categoryBreakdown = useMemo(() => {
    const map = new Map<number | string, { name: string; total: number }>();
    let totalSpending = 0;

    for (const tx of monthTx) {
      if (tx.type !== "expense") continue;
      const isSaving =
        (tx.category_id && savingsCategoryIds.has(tx.category_id)) ||
        isSavingCategory(tx.category?.name);
      if (isSaving) continue;

      const amt = Math.abs(toNumber(tx.amount));
      totalSpending += amt;
      const catKey = tx.category_id ?? "uncat";
      const catName = tx.category?.name || "Uncategorized";

      const cur = map.get(catKey) || { name: catName, total: 0 };
      cur.total += amt;
      map.set(catKey, cur);
    }

    return Array.from(map.entries())
      .map(([id, val]) => ({
        category_id: typeof id === "number" ? id : null,
        category_name: val.name,
        total: val.total,
        pct: totalSpending > 0 ? Math.round((val.total / totalSpending) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [monthTx, savingsCategoryIds]);

  // Uncategorized share of spent
  const uncategorizedShare = useMemo(() => {
    if (spent <= 0) return 0;
    const uncatItem = categoryBreakdown.find((c) => c.category_name === "Uncategorized");
    return uncatItem ? uncatItem.total / spent : 0;
  }, [categoryBreakdown, spent]);

  // 6-Month Trend Data: Prioritize real server-aggregated monthly data from /api/summary.
  // Falls back to zeroed historical months if summary payload has not loaded yet,
  // preventing synthetic multipliers from distorting user spending history.
  const trend6 = useMemo(() => {
    if (summary?.monthly_trend && summary.monthly_trend.length > 0) {
      return summary.monthly_trend.map((pt) => ({
        month: pt.month,
        spent: toNumber(pt.spent),
        isCurrent: pt.month_key === monthKey,
      }));
    }
    const pts: { month: string; spent: number; isCurrent?: boolean }[] = [];
    const curDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(curDate.getFullYear(), curDate.getMonth() - i, 1);
      const name = d.toLocaleDateString("en-US", { month: "short" });
      const isCur = i === 0;
      const ptSpent = isCur ? spent : 0;
      pts.push({ month: name, spent: ptSpent, isCurrent: isCur });
    }
    return pts;
  }, [summary?.monthly_trend, monthKey, spent]);

  // Recent transactions (last 5 of any type, newest first)
  const recent = useMemo(() => {
    const list = recentTx.length ? recentTx : monthTx;
    return [...list]
      .sort((a, b) => (a.transaction_date < b.transaction_date ? 1 : -1))
      .slice(0, 5);
  }, [recentTx, monthTx]);

  // Today calculations
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayTx = useMemo(() => {
    const list = recentTx.length ? recentTx : monthTx;
    return list.filter((t) => t.transaction_date && t.transaction_date.slice(0, 10) === todayStr);
  }, [recentTx, monthTx, todayStr]);

  const todaySpent = useMemo(() => {
    return todayTx
      .filter((t) => t.type === "expense" && !isSavingCategory(t.category?.name))
      .reduce((sum, t) => sum + Math.abs(toNumber(t.amount)), 0);
  }, [todayTx]);

  const { streak: streakDays, loggedToday } = useMemo(() => {
    const list = recentTx.length ? recentTx : monthTx;
    return calculateStreak(list);
  }, [recentTx, monthTx]);

  // Recurring Bills (from Phase 7 API or fallback to localStorage)
  const bills: RecurringBill[] = useMemo(() => {
    if (billsData?.bills && billsData.bills.length > 0) {
      return billsData.bills
        .map((b) => ({
          id: b.id,
          name: b.name,
          amount: b.amount,
          nextDue: b.next_due,
          frequency: b.frequency,
          accountName: b.account_name || undefined,
          daysUntilDue: b.days_until_due,
          isOverdue: b.is_overdue,
        }))
        .filter((b) => b.isOverdue || b.daysUntilDue <= 14)
        .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
        .slice(0, 3);
    }
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("pasona.recurring_bills");
      if (stored) {
        const parsed: RecurringBill[] = JSON.parse(stored);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return parsed
          .map((b) => {
            const target = new Date(b.nextDue);
            target.setHours(0, 0, 0, 0);
            const daysUntilDue = Math.round(
              (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            return {
              ...b,
              daysUntilDue,
              isOverdue: daysUntilDue < 0,
            };
          })
          .filter((b) => b.isOverdue || b.daysUntilDue <= 14)
          .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
          .slice(0, 3);
      }
    } catch {
      // ignore
    }
    return [];
  }, [billsData]);

  // Goals (from Phase 7 API or fallback to localStorage)
  const goals: GoalItem[] = useMemo(() => {
    if (goalsData?.goals && goalsData.goals.length > 0) {
      return goalsData.goals.slice(0, 2).map((g) => ({
        id: g.id,
        name: g.name,
        targetAmount: g.target_amount,
        savedAmount: g.saved_amount,
        monthlyAmountNeeded: g.monthly_needed,
        color: g.color || undefined,
      }));
    }
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("pasona.goals");
      if (stored) {
        const parsed: GoalItem[] = JSON.parse(stored);
        return parsed.slice(0, 2);
      }
    } catch {
      // ignore
    }
    return [];
  }, [goalsData]);

  // Potential duplicate transactions detection matching duplicate-detector.ts
  const duplicateCount = useMemo(() => {
    void duplicateVersion;
    const combinedTx = [...monthTx, ...recentTx];
    const txMap = new Map<number, TransactionDto>();
    for (const t of combinedTx) {
      if (t.id) txMap.set(t.id, t);
    }
    const list = Array.from(txMap.values());
    const dismissed = getDismissedPairIds();
    const pairs = detectDuplicatePairs(list, dismissed);
    return pairs.filter((p) => p.kind === "dup").length;
  }, [recentTx, monthTx, duplicateVersion]);

  // Over budget categories count
  const overBudgetCategoriesCount = useMemo(() => {
    if (budgetData?.summary?.over_count !== undefined && budgetData.summary.over_count > 0) {
      return budgetData.summary.over_count;
    }
    if (!budget) return 0;
    return budget.over > 0 ? 1 : 0;
  }, [budgetData, budget]);

  // Needs Attention items per Specification Section 5.3 (Ranked, Max 3 rows)
  const attention: AttentionItem[] = useMemo(() => {
    const items: AttentionItem[] = [];

    // 1. Overdue bill: "{Bill name} is {n} day(s) overdue", detail "NGN x was due."
    const overdueBill = bills.find((b) => b.isOverdue);
    if (overdueBill) {
      const days = Math.abs(overdueBill.daysUntilDue);
      items.push({
        id: "att-overdue",
        type: "overdue",
        title: `${overdueBill.name} is ${days} ${days === 1 ? "day" : "days"} overdue`,
        detail: `${toNumber(overdueBill.amount).toLocaleString()} was due.`,
        linkTo: "/budgets?tab=recurring",
      });
    }

    // 2. Possible duplicates: "{n} possible duplicate(s)", detail "Review so nothing is counted twice."
    if (duplicateCount > 0) {
      items.push({
        id: "att-dup",
        type: "duplicate",
        title: `${duplicateCount} possible ${duplicateCount === 1 ? "duplicate" : "duplicates"}`,
        detail: "Review so nothing is counted twice.",
        linkTo: "/transactions/duplicates",
      });
    }

    // 3. Over budget: "Over budget in {n} category/categories", detail "Open budgets to see which."
    if (overBudgetCategoriesCount > 0) {
      items.push({
        id: "att-over-budget",
        type: "over_budget",
        title: `Over budget in ${overBudgetCategoriesCount} ${
          overBudgetCategoriesCount === 1 ? "category" : "categories"
        }`,
        detail: "Open budgets to see which.",
        linkTo: "/budgets",
      });
    }

    // 4. Budget near limit (>= 85% used and none over): "You are close to your budget limit"
    if (
      budget &&
      budget.pctUsed >= 85 &&
      budget.pctUsed <= 100 &&
      overBudgetCategoriesCount === 0
    ) {
      items.push({
        id: "att-near-budget",
        type: "near_budget",
        title: "You are close to your budget limit",
        detail: `${budget.pctUsed}% of your monthly budget is used.`,
        linkTo: "/budgets",
      });
    }

    // 5. Email not verified: "Verify your email", detail "Needed for imports and syncing."
    if (user && !user.email_verified_at) {
      items.push({
        id: "att-verify-email",
        type: "verify_email",
        title: "Verify your email",
        detail: "Needed for imports and syncing.",
        linkTo: "/settings",
      });
    }

    // 6. Changes waiting to sync (offline queue > 0): "{n} changes waiting to sync"
    if (pendingSyncCount > 0) {
      items.push({
        id: "att-pending-sync",
        type: "pending_sync",
        title: `${pendingSyncCount} ${
          pendingSyncCount === 1 ? "change" : "changes"
        } waiting to sync`,
        detail: "They are saved on this device.",
        linkTo: "/transactions",
      });
    }

    // Maximum 3 rows
    return items.slice(0, 3);
  }, [bills, duplicateCount, overBudgetCategoriesCount, budget, user, pendingSyncCount]);

  // Finish Setting Up items per Specification Section 5.8 (Show only unmet ones)
  const setupTodos: SetupTodoItem[] = useMemo(() => {
    const todos: SetupTodoItem[] = [];

    // "Set a monthly budget" (unmet if budget === null)
    if (budget === null) {
      todos.push({
        id: "todo-budget",
        label: "Set a monthly budget",
        linkTo: "/budgets",
        completed: false,
      });
    }

    // "Add a recurring bill or salary" (unmet if bills are empty)
    if (bills.length === 0) {
      todos.push({
        id: "todo-recurring",
        label: "Add a recurring bill or salary",
        linkTo: "/budgets?tab=recurring",
        completed: false,
      });
    }

    // "Create a savings goal" (unmet if goals are empty)
    if (goals.length === 0) {
      todos.push({
        id: "todo-goal",
        label: "Create a savings goal",
        linkTo: "/budgets?tab=goals",
        completed: false,
      });
    }

    // "Add another account" (only if the user has exactly 1 account)
    if (accountCount === 1) {
      todos.push({
        id: "todo-account",
        label: "Add another account",
        linkTo: "/accounts",
        completed: false,
      });
    }

    return todos;
  }, [budget, bills.length, goals.length, accountCount]);

  return {
    balanceTotal,
    accountCount,
    accounts,
    categories,
    income,
    spent,
    saved,
    net,
    spentChangeVsLastMonth,
    lastMonthName: prevMonthName,
    budget,
    categoryBreakdown,
    uncategorizedShare,
    trend6,
    recent,
    today: {
      count: todayTx.length,
      spent: todaySpent,
      loggedToday,
    },
    streakDays,
    bills,
    goals,
    attention,
    setupTodos,
    loading,
    refresh: load,
  };
}
