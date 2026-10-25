import { Link, useSearchParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon } from "lucide-react";
import { notify } from "@/hooks/use-toast";
import { FinanceNavbar } from "@/components/finance/Navbar";
import { DashboardSkeleton } from "@/components/finance/Skeletons";
import { OnboardingTour } from "@/components/finance/OnboardingTour";
import { NotificationBell } from "@/components/finance/NotificationBell";
import { MonthDropdown, getUserInitials } from "@/components/finance/ScreenHeader";
import { CashFlowHeroCard } from "@/components/finance/CashFlowHeroCard";
import { QuickLogCard } from "@/components/finance/QuickLogCard";
import { NeedsAttentionCard } from "@/components/finance/NeedsAttentionCard";
import { RecentTransactionsCard } from "@/components/finance/RecentTransactionsCard";
import { MonthlyBudgetSnap } from "@/components/finance/MonthlyBudgetSnap";
import { ComingUpCard } from "@/components/finance/ComingUpCard";
import { FinishSettingUpCard } from "@/components/finance/FinishSettingUpCard";
import { WhereItWentDonut } from "@/components/finance/WhereItWentDonut";
import { SpendingTrendCard } from "@/components/finance/SpendingTrendCard";
import { GoalsPreviewCard } from "@/components/finance/GoalsPreviewCard";
import { AccountsCard } from "@/components/finance/AccountsCard";
import { useDashboardData, invalidateDashboardDataCache } from "@/hooks/use-dashboard-data";
import { useMe, invalidateMe } from "@/hooks/use-me";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { fadeSlideUp } from "@/lib/animations";
import type { Account } from "@/lib/finance";
import type { AccountDto } from "@/lib/api";

function toAccount(dto: AccountDto): Account {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
    balance: Number(dto.balance ?? dto.starting_balance ?? 0),
  };
}

export function invalidateDashboardCache() {
  invalidateDashboardDataCache();
}

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const verifiedFlag = searchParams.get("verified") ?? undefined;
  const userQuery = useMe();
  const userCurrency = userQuery.data?.currency || DEFAULT_CURRENCY;

  useEffect(() => {
    document.title = "Dashboard — Pasona";
  }, []);

  useEffect(() => {
    if (!verifiedFlag) return;
    if (verifiedFlag === "1") {
      notify.success("Email confirmed");
    } else if (verifiedFlag === "already") {
      notify.info("Email was already verified");
    } else if (verifiedFlag === "error") {
      notify.error("That confirmation link is invalid or has expired.");
    }
    invalidateMe();
    setSearchParams({}, { replace: true });
  }, [verifiedFlag, setSearchParams]);

  const [monthOffset, setMonthOffset] = useState(0);
  const monthDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthLabel = monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const monthNameOnly = monthDate.toLocaleDateString("en-US", { month: "long" });

  // Single data source hook powering the entire Home screen (Spec Section 3)
  const data = useDashboardData(monthDate);

  const accountList = useMemo(() => data.accounts.map(toAccount), [data.accounts]);
  const hasNoAccounts = accountList.length === 0;

  if (data.loading && !data.accounts.length && data.balanceTotal === 0 && data.income === 0 && data.spent === 0) {
    return (
      <>
        <DashboardSkeleton />
        <FinanceNavbar />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-32">
      {/* Sticky Fixed Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0b1434] pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 px-3 sm:px-5 lg:px-6 shadow-sm border-b border-white/5 transition-all text-white">
        <div className="w-full flex flex-col gap-2">
          <div className="flex justify-between items-center gap-3">
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                {userQuery.data?.name ? `Hi, ${userQuery.data.name.trim().split(" ")[0]}` : "Hi, User"}
              </h1>
              <p className="text-[11px] font-semibold text-white/70">
                Your overview for {monthLabel}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Desktop Month Dropdown */}
              <div className="hidden sm:block">
                <MonthDropdown
                  currentLabel={monthLabel}
                  monthOffset={monthOffset}
                  onSelectOffset={setMonthOffset}
                />
              </div>

              <NotificationBell />

              {/* Mobile-only gear icon leading to /settings */}
              <Link
                to="/settings"
                aria-label="Settings"
                title="Settings"
                className="w-9 h-9 rounded-xl border border-white/10 bg-white/10 text-white flex items-center justify-center transition-colors hover:bg-white/20 md:hidden outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <SettingsIcon size={16} />
              </Link>

              {/* Avatar on every main screen leading to /profile */}
              <Link
                to="/profile"
                aria-label="User Profile"
                title={`Profile: ${userQuery.data?.name || "User"}`}
                className="w-9 h-9 rounded-full bg-[var(--primary)] text-white font-bold text-xs flex items-center justify-center transition-transform active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-white/50 shadow-sm"
              >
                {getUserInitials(userQuery.data?.name, userQuery.data?.email)}
              </Link>
            </div>
          </div>

          {/* Phone-only own-row month dropdown */}
          <div className="sm:hidden self-start">
            <MonthDropdown
              currentLabel={monthLabel}
              monthOffset={monthOffset}
              onSelectOffset={setMonthOffset}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area: 2-column layout on desktop, single-column responsive on mobile */}
      <motion.main
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        className="w-full px-3 sm:px-5 lg:px-6 pt-3 sm:pt-4 pb-32"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 sm:gap-5 items-start">
          {/* Column A (Left): Balance, Tasks, Duplicates/Needs Attention, Donut, Line Chart, Recent Activity */}
          <div className="contents lg:flex lg:flex-col lg:gap-4 min-w-0">
            {/* 1. Cash Flow Balance Hero (Topmost on mobile) */}
            <CashFlowHeroCard
              totalBalance={data.balanceTotal}
              monthlyIncome={data.income}
              monthlySpent={data.spent}
              monthlySavings={data.saved}
              net={data.net}
              monthName={monthNameOnly}
              accountsCount={data.accountCount}
              spentChangeVsLastMonth={data.spentChangeVsLastMonth}
              lastMonthName={data.lastMonthName}
              currency={userCurrency}
              className="order-1 lg:order-none"
            />

            {/* 2. Tasks to be done */}
            <FinishSettingUpCard
              todos={data.setupTodos}
              className="order-2 lg:order-none"
            />

            {/* 3. Duplicates & Needs Attention */}
            {data.attention.length > 0 && (
              <NeedsAttentionCard
                items={data.attention}
                className="order-2 lg:order-none"
              />
            )}

            {/* 4. Where did it go? Donut */}
            <WhereItWentDonut
              monthLabel={monthLabel}
              categories={data.categoryBreakdown}
              spentTotal={data.spent}
              currency={userCurrency}
              className="order-4 lg:order-none"
            />

            {/* 5. Spending Trend Line Chart */}
            <SpendingTrendCard
              trendData={data.trend6}
              currency={userCurrency}
              className="order-8 lg:order-none"
            />

            {/* 6. Recent Activity / Stats */}
            <RecentTransactionsCard
              transactions={data.recent}
              currency={userCurrency}
              className="order-6 lg:order-none"
            />
          </div>

          {/* Column B (Right): Quick Log, Budget, Coming Up, Goals, Accounts */}
          <div className="contents lg:flex lg:flex-col lg:gap-4 min-w-0">
            {/* Quick Log Card (Hidden on mobile) */}
            <QuickLogCard
              todayCount={data.today.count}
              todaySpent={data.today.spent}
              loggedToday={data.today.loggedToday}
              streakDays={data.streakDays}
              recentTransactions={data.recent}
              accounts={accountList}
              categories={data.categories}
              currency={userCurrency}
              onRefresh={data.refresh}
              className="hidden lg:flex lg:order-none"
            />

            {/* Monthly Budget Snap */}
            <MonthlyBudgetSnap
              monthLabel={monthNameOnly}
              spent={data.spent}
              budgetLimit={data.budget?.planned ?? 0}
              currency={userCurrency}
              className="order-5 lg:order-none"
            />

            {/* Coming Up (Recurring bills) */}
            <ComingUpCard
              bills={data.bills}
              currency={userCurrency}
              className="order-7 lg:order-none"
            />

            {/* Goals Preview */}
            <GoalsPreviewCard
              goals={data.goals}
              currency={userCurrency}
              savingsRate={data.income > 0 ? (data.saved / data.income) * 100 : 0}
              income={data.income}
              className="order-9 lg:order-none"
            />

            {/* Accounts */}
            <AccountsCard
              accounts={accountList}
              totalBalance={data.balanceTotal}
              currency={userCurrency}
              className="order-3 lg:order-none"
            />
          </div>
        </div>
      </motion.main>

      <FinanceNavbar />
      <OnboardingTour hasNoAccounts={hasNoAccounts} />
    </div>
  );
}
