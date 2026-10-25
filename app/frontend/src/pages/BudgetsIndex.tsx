import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  Plus,
  Target,
  Repeat,
  Tag,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Settings as SettingsIcon,
} from "lucide-react";
import { FinanceNavbar } from "@/components/finance/Navbar";
import { NotificationBell } from "@/components/finance/NotificationBell";
import { MonthDropdown, getUserInitials } from "@/components/finance/ScreenHeader";
import { SpendingAgainstPlanChart } from "@/components/finance/SpendingAgainstPlanChart";
import { BudgetsSkeleton } from "@/components/finance/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { GoalCard } from "@/components/finance/GoalCard";
import { RecurringBillRow } from "@/components/finance/RecurringBillRow";
import { EditPlanDialog } from "@/components/finance/EditPlanDialog";
import { NewGoalDialog } from "@/components/finance/NewGoalDialog";
import { AddToGoalDialog } from "@/components/finance/AddToGoalDialog";
import { NewRecurringBillDialog } from "@/components/finance/NewRecurringBillDialog";
import { EditCategoryLimitDialog } from "@/components/finance/EditCategoryLimitDialog";
import { useBudgets } from "@/hooks/use-budgets";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { useMe } from "@/hooks/use-me";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { fadeSlideUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { getCategoryColor } from "@/lib/category-colors";
import type { BudgetCategoryItemDto, GoalDto } from "@/lib/api";

export function BudgetsIndex() {
  const { data: user } = useMe();
  const userCurrency = user?.currency || DEFAULT_CURRENCY;
  const { renderAmount, renderCompactAmount } = usePrivacyMode();

  const {
    monthOffset,
    setMonthOffset,
    monthLabel,
    nextMonthLabel,
    nextMonthKey,
    activeTab,
    setActiveTab,
    loading,
    error,
    budgetData,
    nextBudgetData,
    isNextMonthPlanned,
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
  } = useBudgets();

  // Dialog States
  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [isNextMonthPlan, setIsNextMonthPlan] = useState(false);
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [addToGoalItem, setAddToGoalItem] = useState<GoalDto | null>(null);
  const [newBillOpen, setNewBillOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategoryItemDto | null>(null);

  useEffect(() => {
    document.title = "Budgets — Pasona";
  }, []);

  // Sort categories by urgency: over > near > ok > way > goal
  const sortedCategories = useMemo(() => {
    if (!budgetData?.categories) return [];
    const urgencyWeight: Record<string, number> = {
      over: 0,
      near: 1,
      ok: 2,
      way: 3,
      goal: 4,
      none: 5,
    };

    return [...budgetData.categories].sort((a, b) => {
      const wa = urgencyWeight[a.state] ?? 9;
      const wb = urgencyWeight[b.state] ?? 9;
      if (wa !== wb) return wa - wb;

      // Secondary: highest percent used first
      const pctA = a.limit_amount && a.limit_amount > 0 ? a.spent / a.limit_amount : 0;
      const pctB = b.limit_amount && b.limit_amount > 0 ? b.spent / b.limit_amount : 0;
      return pctB - pctA;
    });
  }, [budgetData]);

  // Status meter color class
  const getMeterClass = (state: string) => {
    switch (state) {
      case "over":
        return "bg-[var(--neg)]";
      case "near":
        return "bg-[var(--warn)]";
      case "goal":
        return "bg-[var(--pos)]";
      default:
        return "bg-[var(--primary)]";
    }
  };

  const bSummary = budgetData?.summary;
  const isOverallOver = (bSummary?.left ?? 0) < 0;
  const overallMeterColor = isOverallOver
    ? "bg-[var(--neg)]"
    : (bSummary?.pct_used ?? 0) >= 85
    ? "bg-[var(--warn)]"
    : "bg-[var(--primary)]";

  if (loading && !budgetData && !goalsData?.goals?.length && !billsData?.bills?.length) {
    return (
      <>
        <BudgetsSkeleton />
        <FinanceNavbar />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-32">
      {/* Sticky Top Header Bar matching App Shell */}
      <header className="sticky top-0 z-30 bg-[#0b1434] pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 px-3 sm:px-5 lg:px-6 shadow-sm border-b border-white/5 transition-all text-white">
        <div className="w-full flex flex-col gap-2">
          <div className="flex justify-between items-center gap-3">
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                Budgets
              </h1>
              <p className="text-[11px] font-semibold text-white/70">
                {activeTab === "budget"
                  ? `Plan and track by category · ${monthLabel}`
                  : activeTab === "goals"
                  ? "Savings goals and targets"
                  : "Recurring bills and regular income"}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Month Dropdown for Budget tab */}
              {activeTab === "budget" && (
                <div className="hidden sm:block">
                  <MonthDropdown
                    currentLabel={monthLabel}
                    monthOffset={monthOffset}
                    onSelectOffset={setMonthOffset}
                  />
                </div>
              )}

              {/* Action Button depending on active tab */}
              {activeTab === "budget" && (
                <button
                  type="button"
                  onClick={() => {
                    setIsNextMonthPlan(false);
                    setEditPlanOpen(true);
                  }}
                  className="px-2.5 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <SlidersHorizontal size={13} strokeWidth={2.5} />
                  <span className="hidden xs:inline">Edit plan</span>
                </button>
              )}

              {activeTab === "goals" && (
                <button
                  type="button"
                  onClick={() => setNewGoalOpen(true)}
                  className="px-2.5 sm:px-3 py-1.5 bg-[var(--primary)] hover:opacity-90 text-white rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>New goal</span>
                </button>
              )}

              {activeTab === "bills" && (
                <button
                  type="button"
                  onClick={() => setNewBillOpen(true)}
                  className="px-2.5 sm:px-3 py-1.5 bg-[var(--primary)] hover:opacity-90 text-white rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>New</span>
                </button>
              )}

              <NotificationBell />

              {/* Mobile gear icon */}
              <Link
                to="/settings"
                aria-label="Settings"
                className="w-9 h-9 rounded-xl border border-white/10 bg-white/10 text-white flex items-center justify-center transition-colors hover:bg-white/20 md:hidden"
              >
                <SettingsIcon size={16} />
              </Link>

              {/* Avatar linking to /profile */}
              <Link
                to="/profile"
                aria-label="User Profile"
                className="w-9 h-9 rounded-full bg-[var(--primary)] text-white font-bold text-xs flex items-center justify-center transition-transform active:scale-95 shadow-sm"
              >
                {getUserInitials(user?.name, user?.email)}
              </Link>
            </div>
          </div>

          {/* Phone-only own-row Month dropdown for budget tab */}
          {activeTab === "budget" && (
            <div className="sm:hidden self-start">
              <MonthDropdown
                currentLabel={monthLabel}
                monthOffset={monthOffset}
                onSelectOffset={setMonthOffset}
              />
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <motion.main
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        className="w-full px-3 sm:px-5 lg:px-6 pt-3 sm:pt-4 max-w-[1560px] mx-auto"
      >
        {/* Tab Bar: Budget | Goals | Recurring matching redesign mock up */}
        <div className="flex bg-[var(--chip)] p-1 rounded-[6px] gap-1 max-w-md mb-4 border border-[var(--line)]/50">
          <button
            type="button"
            onClick={() => setActiveTab("budget")}
            className={cn(
              "flex-1 py-1.5 sm:py-2 rounded-[4px] text-xs font-bold transition-all text-center select-none flex items-center justify-center gap-1.5 cursor-pointer",
              activeTab === "budget"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            )}
          >
            <span>Budget</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("goals")}
            className={cn(
              "flex-1 py-1.5 sm:py-2 rounded-[4px] text-xs font-bold transition-all text-center select-none flex items-center justify-center gap-1.5 cursor-pointer",
              activeTab === "goals"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            )}
          >
            <span>Goals</span>
            {(goalsData?.goals.length ?? 0) > 0 && (
              <span className="text-[10px] bg-[var(--chip)] text-[var(--muted)] px-1.5 py-0.2 rounded-full">
                {goalsData?.goals.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bills")}
            className={cn(
              "flex-1 py-1.5 sm:py-2 rounded-[4px] text-xs font-bold transition-all text-center select-none flex items-center justify-center gap-1.5 cursor-pointer",
              activeTab === "bills"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            )}
          >
            <span>Recurring</span>
            {(billsData?.bills.length ?? 0) > 0 && (
              <span className="text-[10px] bg-[var(--chip)] text-[var(--muted)] px-1.5 py-0.2 rounded-full">
                {billsData?.bills.length}
              </span>
            )}
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: BUDGET                                                  */}
        {/* ============================================================== */}
        {activeTab === "budget" && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4 sm:gap-5 items-start">
            {/* Column A (Left): Summary Card, Pace Chart, Next Month Plan */}
            <div className="flex flex-col gap-4 min-w-0">
              {/* 1. Left to Spend Summary Card */}
              <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-4 sm:p-5 shadow-[var(--lift)] space-y-3">
                <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)]">
                  {isOverallOver ? "Over budget by" : "Left to spend"}
                </div>
                <div
                  className={cn(
                    "font-display text-2xl sm:text-3xl font-semibold tracking-tight",
                    isOverallOver ? "text-[var(--neg)]" : "text-[var(--ink)]"
                  )}
                >
                  {renderCompactAmount(Math.abs(bSummary?.left ?? 0), userCurrency)}
                </div>
                <div className="text-xs text-[var(--muted)] font-semibold">
                  of {renderCompactAmount(bSummary?.planned ?? 0, userCurrency)} planned ·{" "}
                  {bSummary?.pct_used ?? 0}% used
                </div>

                {/* Progress Meter Bar */}
                <div className="h-2 w-full rounded-full bg-[var(--chip)] overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", overallMeterColor)}
                    style={{ width: `${Math.min(100, bSummary?.pct_used ?? 0)}%` }}
                  />
                </div>

                {/* 3 KPIs */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--line)]">
                  <div>
                    <span className="block text-[10px] font-bold text-[var(--muted)] uppercase">
                      Spent
                    </span>
                    <span className="block text-xs sm:text-sm font-extrabold text-[var(--ink)] tabular-nums mt-0.5">
                      {renderCompactAmount(bSummary?.spent ?? 0, userCurrency)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-[var(--muted)] uppercase">
                      Savings goal
                    </span>
                    <span className="block text-xs sm:text-sm font-extrabold text-[var(--ink)] tabular-nums mt-0.5">
                      {(() => {
                        const savingsCat = budgetData?.categories.find((c) => c.is_goal);
                        if (savingsCat && savingsCat.limit_amount && savingsCat.limit_amount > 0) {
                          return (
                            <>
                              {renderCompactAmount(savingsCat.spent, userCurrency)}{" "}
                              <span className="font-normal text-[var(--muted)] text-[10px] sm:text-[11px] not-italic">
                                of {renderCompactAmount(savingsCat.limit_amount, userCurrency)}
                              </span>
                            </>
                          );
                        }
                        if ((goalsData?.goals.length ?? 0) > 0) {
                          return (
                            <>
                              {renderCompactAmount(goalsData?.summary.total_saved ?? 0, userCurrency)}{" "}
                              <span className="font-normal text-[var(--muted)] text-[10px] sm:text-[11px] not-italic">
                                of {renderCompactAmount(goalsData?.summary.total_target ?? 0, userCurrency)}
                              </span>
                            </>
                          );
                        }
                        return renderCompactAmount(0, userCurrency);
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-[var(--muted)] uppercase">
                      Status
                    </span>
                    <span className="block text-xs sm:text-sm font-extrabold mt-0.5">
                      {(bSummary?.over_count ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[var(--neg)]">
                          <AlertTriangle size={12} strokeWidth={2.5} />
                          <span>{bSummary?.over_count} over limit</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--pos)]">
                          <CheckCircle2 size={12} strokeWidth={2.5} />
                          <span>On track</span>
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </section>

              {/* 2. Spending Against Plan Pace Chart */}
              <SpendingAgainstPlanChart
                pacePoints={pacePoints}
                currency={userCurrency}
                monthLabel={monthLabel}
              />

              {/* 3. Next Month Plan Card */}
              <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-3.5 sm:p-4 shadow-[var(--lift)] flex items-center gap-3">
                <span className="w-9 h-9 rounded-[6px] bg-[var(--chip)] text-[var(--primary)] flex items-center justify-center shrink-0">
                  <Target size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block text-xs sm:text-sm font-bold text-[var(--ink)]">
                    {isNextMonthPlanned ? `${nextMonthLabel} is planned` : `Plan ${nextMonthLabel}`}
                  </b>
                  <span className="block text-xs text-[var(--muted)] mt-0.5 truncate">
                    {isNextMonthPlanned
                      ? `${renderAmount(nextBudgetData?.summary.planned ?? 0, userCurrency)} across ${
                          nextBudgetData?.categories.filter((c) => c.limit_amount && c.limit_amount > 0).length ?? 0
                        } categories`
                      : "Start from this month's limits and adjust."}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!isNextMonthPlanned && (
                    <button
                      type="button"
                      onClick={() => copyPreviousMonth(nextMonthKey, budgetData?.month || monthKey)}
                      className="px-2.5 py-1.5 rounded-[4px] border border-[var(--line)] text-xs font-bold text-[var(--ink)] hover:bg-[var(--chip)] transition-colors"
                    >
                      Copy plan
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsNextMonthPlan(true);
                      setEditPlanOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-[4px] bg-[var(--primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity"
                  >
                    Edit
                  </button>
                </div>
              </section>
            </div>

            {/* Column B (Right): By Category Card */}
            <div className="flex flex-col gap-4 min-w-0">
              <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-3.5 sm:p-4 shadow-[var(--lift)] space-y-3">
                <div className="flex justify-between items-baseline gap-2">
                  <div>
                    <h3 className="font-display font-medium text-sm sm:text-base text-[var(--ink)]">
                      By category
                    </h3>
                    <span className="text-[11px] font-semibold text-[var(--muted)]">
                      Most urgent first. Tap one to change its limit.
                    </span>
                  </div>
                </div>

                {/* Categories List */}
                <div className="divide-y divide-[var(--line)]">
                  {loading && (!budgetData || sortedCategories.length === 0) ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="py-3 flex flex-col gap-2 px-1 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Skeleton className="w-2.5 h-2.5 rounded-[2px] bg-[var(--chip)]" />
                            <Skeleton className="h-4 w-28 bg-[var(--chip)] rounded-[4px]" />
                          </div>
                          <Skeleton className="h-4 w-20 bg-[var(--chip)] rounded-[4px]" />
                        </div>
                        <Skeleton className="h-1.5 w-full bg-[var(--chip)] rounded-full" />
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-3 w-16 bg-[var(--chip)] rounded-[4px]" />
                          <Skeleton className="h-3 w-14 bg-[var(--chip)] rounded-[4px]" />
                        </div>
                      </div>
                    ))
                  ) : sortedCategories.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[var(--muted)]">
                      No expense categories found.{" "}
                      <Link to="/categories" className="font-bold text-[var(--primary)] hover:underline">
                        Create one in Categories →
                      </Link>
                    </div>
                  ) : (
                    sortedCategories.map((c) => {
                      const isLimitSet = c.limit_amount !== null && c.limit_amount > 0;
                    const percent = isLimitSet ? Math.min(100, Math.round((c.spent / c.limit_amount!) * 100)) : 0;
                    const isOver = c.state === "over";
                    const isNear = c.state === "near";
                    const isGoal = c.is_goal;

                    let statusLabel = (
                      <span className="inline-flex items-center gap-1 text-[var(--pos)]">
                        <CheckCircle2 size={12} strokeWidth={2.5} />
                        <span>On track</span>
                      </span>
                    );
                    if (isOver) {
                      statusLabel = (
                        <span className="inline-flex items-center gap-1 text-[var(--neg)] font-bold">
                          <AlertTriangle size={12} strokeWidth={2.5} />
                          <span>Over by {renderAmount(Math.abs(c.left || 0), userCurrency)}</span>
                        </span>
                      );
                    } else if (isNear) {
                      statusLabel = (
                        <span className="inline-flex items-center gap-1 text-[var(--warn)] font-bold">
                          <AlertTriangle size={12} strokeWidth={2.5} />
                          <span>Near limit</span>
                        </span>
                      );
                    } else if (isGoal) {
                      statusLabel = (
                        <span className="inline-flex items-center gap-1 text-[var(--pos)]">
                          <CheckCircle2 size={12} strokeWidth={2.5} />
                          <span>Goal met</span>
                        </span>
                      );
                    } else if (!isLimitSet) {
                      statusLabel = <span className="text-[var(--muted)]">No limit set</span>;
                    }

                    return (
                      <button
                        key={c.category_id}
                        type="button"
                        onClick={() => setSelectedCategory(c)}
                        className="w-full text-left py-2.5 sm:py-3 flex flex-col gap-1.5 hover:bg-[var(--chip)]/30 rounded-[4px] px-1 transition-colors cursor-pointer group"
                      >
                        {/* Row 1: Dot, Name, Spent of Limit */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <i
                              className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                              style={{ backgroundColor: getCategoryColor(c.category_name, c.category_id) }}
                            />
                            <b className="text-xs sm:text-sm font-bold text-[var(--ink)] truncate group-hover:text-[var(--primary)] transition-colors">
                              {c.category_name} {c.is_goal && <span className="text-[10px] text-[var(--muted)]">(goal)</span>}
                            </b>
                          </div>
                          <span className="text-xs font-extrabold text-[var(--ink)] tabular-nums shrink-0">
                            {renderCompactAmount(c.spent, userCurrency)}{" "}
                            {isLimitSet && (
                              <em className="font-normal text-[var(--muted)] not-italic">
                                of {renderCompactAmount(c.limit_amount!, userCurrency)}
                              </em>
                            )}
                          </span>
                        </div>

                        {/* Row 2: Meter bar */}
                        {isLimitSet && (
                          <div className="h-1.5 w-full rounded-full bg-[var(--chip)] overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all duration-500", getMeterClass(c.state))}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        )}

                        {/* Row 3: Status label & remaining */}
                        <div className="flex justify-between items-center text-[11px] font-semibold text-[var(--muted)]">
                          <div>{statusLabel}</div>
                          {isLimitSet && !isOver && (
                            <span className="tabular-nums">
                              {c.is_goal
                                ? c.left && c.left > 0
                                  ? `${renderCompactAmount(c.left, userCurrency)} to go`
                                  : "Goal met"
                                : `${renderCompactAmount(Math.max(0, c.left || 0), userCurrency)} left`}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  }))}
                </div>
              </section>

              {/* Manage categories shortcut link matching mock up */}
              <Link
                to="/categories"
                className="flex items-center justify-between p-3.5 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--chip)] transition-colors shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-[6px] bg-[var(--chip)] text-[var(--primary)] flex items-center justify-center shrink-0">
                    <Tag size={16} />
                  </span>
                  <div>
                    <b className="block text-xs sm:text-sm font-bold">Manage categories</b>
                    <span className="block text-[11px] text-[var(--muted)]">Names, colours and types</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[var(--muted)] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: GOALS                                                   */}
        {/* ============================================================== */}
        {activeTab === "goals" && (
          <div className="space-y-4">
            {/* Top Saved Toward Goals Summary Card */}
            {(goalsData?.goals.length ?? 0) > 0 && (
              <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-4 sm:p-5 shadow-[var(--lift)] space-y-3">
                <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)]">
                  Saved toward goals
                </div>
                <div className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ink)]">
                  {renderCompactAmount(goalsData?.summary.total_saved ?? 0, userCurrency)}
                </div>
                <div className="text-xs text-[var(--muted)] font-semibold">
                  of {renderCompactAmount(goalsData?.summary.total_target ?? 0, userCurrency)} across{" "}
                  {goalsData?.goals.length} goals
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--chip)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--pos)] transition-all duration-500"
                    style={{ width: `${goalsData?.summary.percent ?? 0}%` }}
                  />
                </div>
              </section>
            )}

            {/* Goals Grid */}
            {(goalsData?.goals.length ?? 0) > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
                {goalsData?.goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    currency={userCurrency}
                    onAddMoney={(g) => setAddToGoalItem(g)}
                    onDelete={(id) => deleteGoal(id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-[var(--surface)] border border-[var(--line)] rounded-[6px] shadow-[var(--lift)] space-y-3">
                <span className="w-12 h-12 rounded-[8px] bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                  <Target size={24} />
                </span>
                <b className="text-sm font-bold text-[var(--ink)]">No goals yet</b>
                <p className="text-xs text-[var(--muted)] max-w-sm">
                  Pick something to save for and Pasona shows what to set aside each month.
                </p>
                <button
                  type="button"
                  onClick={() => setNewGoalOpen(true)}
                  className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-[4px] shadow-sm hover:opacity-90"
                >
                  Create your first goal
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: RECURRING BILLS                                         */}
        {/* ============================================================== */}
        {activeTab === "bills" && (
          <div className="space-y-4">
            {/* Top Next 30 Days Summary Card */}
            {(billsData?.bills.length ?? 0) > 0 && (
              <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-4 sm:p-5 shadow-[var(--lift)] space-y-2">
                <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)]">
                  Next 30 days
                </div>
                <div
                  className={cn(
                    "font-display text-2xl sm:text-3xl font-semibold tracking-tight",
                    (billsData?.summary.next_30_days_net ?? 0) >= 0 ? "text-[var(--pos)]" : "text-[var(--ink)]"
                  )}
                >
                  {renderCompactAmount(billsData?.summary.next_30_days_net ?? 0, userCurrency)}
                </div>
                <div className="text-xs text-[var(--muted)] font-semibold">
                  {billsData?.summary.next_30_days_count} items ·{" "}
                  {renderCompactAmount(billsData?.summary.next_30_days_outgoing ?? 0, userCurrency)} going out ·{" "}
                  {renderCompactAmount(billsData?.summary.next_30_days_incoming ?? 0, userCurrency)} coming in
                </div>
              </section>
            )}

            {/* Bills List Card */}
            {(billsData?.bills.length ?? 0) > 0 ? (
              <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-3.5 sm:p-4 shadow-[var(--lift)]">
                <div className="divide-y divide-[var(--line)]">
                  {billsData?.bills.map((bill) => (
                    <RecurringBillRow
                      key={bill.id}
                      bill={bill}
                      currency={userCurrency}
                      onMarkPaid={(id) => markBillPaid(id)}
                      onDelete={(id) => deleteRecurringBill(id)}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-[var(--surface)] border border-[var(--line)] rounded-[6px] shadow-[var(--lift)] space-y-3">
                <span className="w-12 h-12 rounded-[8px] bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                  <Repeat size={24} />
                </span>
                <b className="text-sm font-bold text-[var(--ink)]">No recurring items yet</b>
                <p className="text-xs text-[var(--muted)] max-w-sm">
                  Add salary, rent or subscriptions. Pasona shows what is due and logs it in one tap.
                </p>
                <button
                  type="button"
                  onClick={() => setNewBillOpen(true)}
                  className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-[4px] shadow-sm hover:opacity-90"
                >
                  Add a recurring bill
                </button>
              </div>
            )}
          </div>
        )}
      </motion.main>

      {/* Dialogs */}
      <EditPlanDialog
        open={editPlanOpen}
        onClose={() => setEditPlanOpen(false)}
        monthLabel={isNextMonthPlan ? nextMonthLabel : monthLabel}
        isNextMonth={isNextMonthPlan}
        categories={budgetData?.categories || []}
        currency={userCurrency}
        onSave={async (limits) => {
          if (isNextMonthPlan) {
            await saveBulkLimits(limits, nextMonthKey);
          } else {
            await saveBulkLimits(limits, budgetData?.month || monthKey);
          }
        }}
      />

      <NewGoalDialog
        open={newGoalOpen}
        onClose={() => setNewGoalOpen(false)}
        accounts={accounts}
        onSubmit={createGoal}
      />

      <AddToGoalDialog
        goal={addToGoalItem}
        accounts={accounts}
        currency={userCurrency}
        onClose={() => setAddToGoalItem(null)}
        onSubmit={contributeGoal}
      />

      <NewRecurringBillDialog
        open={newBillOpen}
        onClose={() => setNewBillOpen(false)}
        accounts={accounts}
        categories={categories}
        onSubmit={createRecurringBill}
      />

      <EditCategoryLimitDialog
        category={selectedCategory}
        currency={userCurrency}
        onClose={() => setSelectedCategory(null)}
        onSave={saveCategoryLimit}
      />

      {/* Bottom Nav Shell */}
      <FinanceNavbar />
    </div>
  );
}
