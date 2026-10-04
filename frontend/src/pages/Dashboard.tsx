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
      <header className="sticky top-0 z-40 bg-[#0b1434] pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 px-3 sm:px-5 lg:px-6 shadow-sm border-b border-white/5 transition-all text-white">
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

      {/* Main Content Area: Expanded container with reduced padding per user feedback */}
      <motion.main
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        className="w-full px-3 sm:px-5 lg:px-6 pt-3 sm:pt-4 space-y-4 sm:space-y-5"
      >
        {/* Row 1: Balance (Col 1) | Quick Log (Col 2). Mobile: Quick Log first. Equal height on desktop. */}
        <section aria-label="Overview & Quick Log">
          <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 sm:gap-5 lg:items-stretch">
            <div className="order-2 lg:order-1 flex flex-col min-w-0">
              <CashFlowHeroCard
                totalBalance={data.balanceTotal}
                monthlyIncome={data.income}
                monthlySpent={data.spent}
                monthlySavings={data.saved}
                accountsCount={data.accountCount}
                spentChangeVsLastMonth={data.spentChangeVsLastMonth}
                lastMonthName={data.lastMonthName}
                currency={userCurrency}
                className="h-full"
              />
            </div>

            <div className="order-1 lg:order-2 flex flex-col min-w-0">
              <QuickLogCard
                transactions={data.recent}
                accounts={accountList}
                categories={data.categories}
                currency={userCurrency}
                streak={data.streakDays}
                onRefresh={data.refresh}
                className="h-full"
              />
            </div>
          </div>
        </section>

        {/* Row 2: Needs attention (conditional, spans full width) */}
        {data.attention.length > 0 && (
          <section aria-label="Needs attention">
            <NeedsAttentionCard items={data.attention} />
          </section>
        )}

        {/* Row 3: Recent activity (Col 1) | Budget, Coming up, Finish setting up (Col 2 stacked) */}
        <section aria-label="Activity & Budgeting">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 sm:gap-5 items-start">
            <div className="min-w-0">
              <RecentTransactionsCard
                transactions={data.recent}
                currency={userCurrency}
              />
            </div>

            <div className="flex flex-col gap-4 min-w-0">
              <MonthlyBudgetSnap
                monthLabel={monthNameOnly}
                spent={data.spent}
                budgetLimit={data.budget?.planned ?? 0}
                currency={userCurrency}
              />

              <ComingUpCard
                bills={data.bills}
                currency={userCurrency}
              />

              <FinishSettingUpCard
                items={data.setupTodos}
              />
            </div>
          </div>
        </section>

        {/* Row 4: Where it went (Col 1) | Spending trend (Col 2) */}
        <section aria-label="Spending Analysis">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 sm:gap-5 items-start">
            <div className="min-w-0">
              <WhereItWentDonut
                monthLabel={monthLabel}
                categories={data.categoryBreakdown}
                spentTotal={data.spent}
                currency={userCurrency}
              />
            </div>

            <div className="min-w-0">
              <SpendingTrendCard
                trendData={data.trend6}
                currency={userCurrency}
              />
            </div>
          </div>
        </section>

        {/* Row 5: Goals (Col 1) | Accounts (Col 2) */}
        <section aria-label="Goals & Accounts">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 sm:gap-5 items-start">
            <div className="min-w-0">
              <GoalsPreviewCard
                goals={data.goals}
                currency={userCurrency}
                savingsRate={data.income > 0 ? (data.saved / data.income) * 100 : 0}
                income={data.income}
              />
            </div>

            <div className="min-w-0">
              <AccountsCard
                accounts={accountList}
                totalBalance={data.balanceTotal}
                currency={userCurrency}
              />
            </div>
          </div>
        </section>
      </motion.main>

      <FinanceNavbar />
      <OnboardingTour hasNoAccounts={hasNoAccounts} />
    </div>
  );
}
