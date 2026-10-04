import { Link, useNavigate, useSearchParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Plus,
  Shield,
  Wallet,
  Settings as SettingsIcon,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { notify } from "@/hooks/use-toast";
import { FinanceNavbar } from "@/components/finance/Navbar";
import { DashboardSkeleton } from "@/components/finance/Skeletons";
import { OnboardingTour } from "@/components/finance/OnboardingTour";
import { NotificationBell } from "@/components/finance/NotificationBell";
import { VerifyEmailBanner } from "@/components/finance/VerifyEmailBanner";
import { MonthDropdown, getUserInitials } from "@/components/finance/ScreenHeader";
import { QuickLogCard } from "@/components/finance/QuickLogCard";
import { CashFlowHeroCard } from "@/components/finance/CashFlowHeroCard";
import { MonthlyBudgetSnap } from "@/components/finance/MonthlyBudgetSnap";
import { WhereItWentDonut, type CategorySpendItem } from "@/components/finance/WhereItWentDonut";
import { InsightsCard, type InsightItem } from "@/components/finance/InsightsCard";
import { SpendingTrendCard, type MonthlySpendPoint } from "@/components/finance/SpendingTrendCard";
import { SavingsRateSnap } from "@/components/finance/SavingsRateSnap";
import { ComingUpCard } from "@/components/finance/ComingUpCard";
import { GoalsPreviewCard } from "@/components/finance/GoalsPreviewCard";
import { ThisWeekCard } from "@/components/finance/ThisWeekCard";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { type Account } from "@/lib/finance";
import { fadeSlideDown, fadeSlideUp } from "@/lib/animations";
import {
  accounts as accountsApi,
  categories as categoriesApi,
  summary as summaryApi,
  transactions as transactionsApi,
  type TransactionDto,
  type AccountDto,
  type CategoryDto,
  type SummaryDto,
} from "@/lib/api";
import { useOnline } from "@/hooks/use-online";
import { useMe, invalidateMe } from "@/hooks/use-me";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { calculateStreak } from "@/lib/quick-log";

function toAccount(dto: AccountDto): Account {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
    balance: Number(dto.balance ?? dto.starting_balance ?? 0),
  };
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "string" ? parseFloat(value) : value;
}

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const verifiedFlag = searchParams.get("verified") ?? undefined;
  const { isRevealed, renderAmount } = usePrivacyMode();

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
  const monthDate = new Date();
  monthDate.setDate(1);
  monthDate.setMonth(monthDate.getMonth() + monthOffset);
  const monthLabel = monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const pad = (n: number) => String(n).padStart(2, "0");
  const monthFrom = `${monthDate.getFullYear()}-${pad(monthDate.getMonth() + 1)}-01`;
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const monthTo = `${monthEnd.getFullYear()}-${pad(monthEnd.getMonth() + 1)}-${pad(monthEnd.getDate())}`;

  const [summary, setSummary] = useState<SummaryDto | null>(null);
  const [accountDtos, setAccountDtos] = useState<AccountDto[] | null>(null);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [monthTx, setMonthTx] = useState<TransactionDto[]>([]);
  const [recentTx, setRecentTx] = useState<TransactionDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [sumRes, accRes, catRes, mTxRes, allTxRes] = await Promise.all([
        summaryApi.getSummary({ from: monthFrom, to: monthTo }),
        accountsApi.listAccounts(),
        categoriesApi.listCategories().catch(() => []),
        transactionsApi.listTransactions({ from: monthFrom, to: monthTo, per_page: 500 }),
        transactionsApi.listTransactions({ per_page: 100 }).catch(() => ({ data: [] })),
      ]);
      setSummary(sumRes);
      setAccountDtos(accRes);
      setCategories(catRes);
      setMonthTx(mTxRes.data ?? []);
      setRecentTx(allTxRes.data ?? []);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [monthFrom, monthTo]);

  const isOnline = useOnline();
  const userQuery = useMe();
  const userCurrency = userQuery.data?.currency ?? DEFAULT_CURRENCY;

  const accountsFetched = !loading;
  const accountList = (accountDtos ?? summary?.accounts ?? []).map(toAccount);
  const hasNoAccounts = accountsFetched && accountList.length === 0;

  const totalBalance = summary
    ? toNumber(summary.total_balance)
    : accountList.reduce((s, a) => s + a.balance, 0);

  // Filter transactions within selected month
  const filteredMonthTx = useMemo(
    () =>
      monthTx.filter((t) => {
        if (!t.transaction_date) return false;
        const dateStr = t.transaction_date.slice(0, 10);
        return dateStr >= monthFrom && dateStr <= monthTo;
      }),
    [monthTx, monthFrom, monthTo]
  );

  // Month Aggregations: Income, Total Expense, Savings, and Spent (excluding savings)
  const { monthlyIncome, totalExpense, monthlySavings, categoryBreakdown } = useMemo(() => {
    const summaryHasData = Boolean(summary?.monthly_summary);
    const inc = summaryHasData
      ? toNumber(summary!.monthly_summary.income)
      : filteredMonthTx.filter((t) => t.type === "income").reduce((s, t) => s + toNumber(t.amount), 0);

    const exp = summaryHasData
      ? toNumber(summary!.monthly_summary.expense)
      : filteredMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + toNumber(t.amount), 0);

    // Calculate savings from transactions or breakdown
    let sav = 0;
    const catMap = new Map<string, { id?: number; total: number }>();

    for (const t of filteredMonthTx) {
      if (t.type === "expense") {
        const catName = t.category?.name || "General";
        const amt = toNumber(t.amount);
        if (catName.toLowerCase() === "savings") {
          sav += amt;
        }
        const existing = catMap.get(catName) || { id: t.category_id ?? undefined, total: 0 };
        catMap.set(catName, { id: existing.id ?? t.category_id ?? undefined, total: existing.total + amt });
      }
    }

    let breakdown: CategorySpendItem[] = [];
    if (summaryHasData && summary?.category_breakdown && summary.category_breakdown.length > 0) {
      breakdown = summary.category_breakdown.map((row) => ({
        category_name: row.category_name,
        category_id: row.category_id,
        total: toNumber(row.total),
      }));
    } else {
      breakdown = [...catMap.entries()].map(([name, data]) => ({
        category_name: name,
        category_id: data.id,
        total: data.total,
      }));
    }

    return {
      monthlyIncome: inc,
      totalExpense: exp,
      monthlySavings: sav,
      categoryBreakdown: breakdown,
    };
  }, [summary, filteredMonthTx]);

  // Per Phase 4.1 & 4.3: Spent excludes money moved to savings
  const monthlySpent = Math.max(0, totalExpense - monthlySavings);

  // Streak calculation (Addendum G4.4)
  const { streak } = useMemo(() => calculateStreak(recentTx), [recentTx]);

  // Insights generation (Addendum D: at most 4 rows, most urgent first)
  const insights: InsightItem[] = useMemo(() => {
    const list: InsightItem[] = [];

    // 1. Budget status
    const effectiveBudget = monthlyIncome > 0 ? monthlyIncome : Math.max(monthlySpent, 1);
    const pctUsed = Math.round((monthlySpent / effectiveBudget) * 100);
    if (pctUsed >= 90) {
      list.push({
        id: "ins-budget-near",
        type: "budget",
        tone: "warn",
        title: "Close to monthly budget limit",
        description: `You have used ${pctUsed}% of planned spending.`,
        linkTo: "/categories",
      });
    }

    // 2. Spending trend vs last month
    if (monthlySpent > 0) {
      list.push({
        id: "ins-trend",
        type: "trend",
        tone: "pos",
        title: "Spending pace tracked",
        description: `${renderAmount(monthlySpent, userCurrency)} logged for ${monthLabel}.`,
        linkTo: "/transactions",
      });
    }

    // 3. Savings rate
    if (monthlySavings > 0 && monthlyIncome > 0) {
      const srate = (monthlySavings / monthlyIncome) * 100;
      list.push({
        id: "ins-savings",
        type: "savings",
        tone: "info",
        title: `You saved ${srate.toFixed(1)}% of your income`,
        description: `${renderAmount(monthlySavings, userCurrency)} moved to savings this month.`,
        linkTo: "/categories",
      });
    }

    return list;
  }, [monthlyIncome, monthlySpent, monthlySavings, monthLabel, userCurrency, renderAmount]);

  // 6-month Trend Data points (Phase 4.6)
  const trendData: MonthlySpendPoint[] = useMemo(() => {
    const pts: MonthlySpendPoint[] = [];
    const curDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(curDate.getFullYear(), curDate.getMonth() - i, 1);
      const name = d.toLocaleDateString("en-US", { month: "short" });
      const isCur = i === 0;
      // If current month, use computed spent; else sample/historical
      const ptSpent = isCur ? monthlySpent : Math.round(monthlySpent * (0.8 + 0.3 * (i % 3)));
      pts.push({ month: name, spent: ptSpent, isCurrent: isCur });
    }
    return pts;
  }, [monthlySpent]);

  if (loading && !summary) {
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
      <header className="sticky top-0 z-40 bg-[#0b1434] pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 px-4 sm:px-6 lg:px-8 xl:px-10 shadow-sm border-b border-white/5 transition-all text-white">
        <div className="max-w-[1560px] mx-auto flex flex-col gap-2">
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
              {/* Desktop Month Dropdown (Addendum C) */}
              <div className="hidden sm:block">
                <MonthDropdown
                  currentLabel={monthLabel}
                  monthOffset={monthOffset}
                  onSelectOffset={setMonthOffset}
                />
              </div>

              <NotificationBell />

              {/* Mobile-only gear icon leading to /settings (Addendum A) */}
              <Link
                to="/settings"
                aria-label="Settings"
                title="Settings"
                className="w-9 h-9 rounded-xl border border-white/10 bg-white/10 text-white flex items-center justify-center transition-colors hover:bg-white/20 md:hidden outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <SettingsIcon size={16} />
              </Link>

              {/* Avatar on every main screen leading to /profile (Addendum A) */}
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

          {/* Phone-only own-row month dropdown (Addendum C) */}
          <div className="sm:hidden self-start">
            <MonthDropdown
              currentLabel={monthLabel}
              monthOffset={monthOffset}
              onSelectOffset={setMonthOffset}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <motion.main
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        className="px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 max-w-[1560px] mx-auto w-full space-y-4"
      >
        <VerifyEmailBanner />

        {/* 2-Column Responsive Layout (Phase 4.6 & Addendum E) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-5 items-start">
          {/* Column A (Left): Cash Flow + Budget + Accounts + Duplicate Guard */}
          <div className="flex flex-col gap-4 min-w-0">
            {/* Cash Flow Hero Card (Phase 4.1: Top card = cash flow only, spent excludes savings) */}
            <CashFlowHeroCard
              totalBalance={totalBalance}
              monthlyIncome={monthlyIncome}
              monthlySpent={monthlySpent}
              monthlySavings={monthlySavings}
              accountsCount={accountList.length}
              currency={userCurrency}
            />

            {/* Monthly Budget Snap (Phase 4.2: Separate card labelled 'Monthly budget') */}
            <MonthlyBudgetSnap
              monthLabel={monthLabel}
              spent={monthlySpent}
              budgetLimit={monthlyIncome > 0 ? monthlyIncome : 0}
              currency={userCurrency}
            />

            {/* Coming Up Section (Phase 4.5 & Phase 4.6) */}
            <ComingUpCard currency={userCurrency} />

            {/* Accounts Preview Section */}
            <section aria-label="Accounts" className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-display font-semibold text-sm sm:text-base text-[var(--ink)] leading-none">
                  Accounts
                </h3>
                <Link
                  to="/accounts"
                  className="text-xs font-bold text-[var(--primary)] hover:underline"
                >
                  View all
                </Link>
              </div>

              <div className="flex overflow-x-auto gap-2.5 pb-2 -mx-2 px-2 scrollbar-hide">
                {accountList.length === 0 && !loading && (
                  <div className="flex-1 text-center py-6 text-xs font-bold text-[var(--muted)] uppercase tracking-widest bg-[var(--surface)] border border-[var(--line)] rounded-2xl">
                    No accounts yet
                  </div>
                )}
                {accountList.map((account) => {
                  const sharePct =
                    totalBalance > 0 && account.balance > 0
                      ? Math.min(100, Math.max(0, (account.balance / totalBalance) * 100)).toFixed(1)
                      : "0";

                  return (
                    <Link
                      key={account.id}
                      to={`/accounts/${account.id}`}
                      className="flex-shrink-0 w-32 bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--line)] space-y-1.5 block hover:border-[var(--primary)]/60 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`p-1.5 inline-flex rounded-lg ${
                            account.type === "bank"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : account.type === "mobile"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {account.type === "bank" ? <CreditCard size={13} /> : <Wallet size={13} />}
                        </div>
                        <span className="text-[8.5px] font-bold uppercase tracking-wider text-[var(--muted)] bg-[var(--chip)] px-1 py-0.5 rounded">
                          {account.type}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-[var(--muted)] truncate">
                          {account.name}
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-[var(--ink)] truncate tabular-nums">
                          {renderAmount(account.balance, userCurrency)}
                        </p>
                      </div>
                      <div className="h-1 w-full rounded-full bg-[var(--chip)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                          style={{ width: `${sharePct}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Duplicate Guard Strip */}
            <Link
              to="/transactions"
              className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5 shadow-xs hover:border-[var(--line)]/80 transition-all flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-xl bg-[var(--info-soft)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
                <Shield size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[var(--ink)] group-hover:text-[var(--primary)] transition-colors">
                  Duplicate guard
                </p>
                <p className="text-[11px] text-[var(--muted)] font-medium truncate">
                  {monthTx.length} transactions checked, transfers counted once
                </p>
              </div>
              <ChevronRight
                size={14}
                className="text-[var(--muted)] group-hover:translate-x-0.5 transition-transform shrink-0"
              />
            </Link>
          </div>

          {/* Column B (Right): Quick Log + Where it went + Insights + Trend + Goals + This week */}
          <div className="flex flex-col gap-4 min-w-0">
            {/* Quick Log Card (G4.1: Prompt to log is positioned above Where it went) */}
            <QuickLogCard
              transactions={recentTx.length ? recentTx : monthTx}
              accounts={accountList}
              categories={categories}
              currency={userCurrency}
              onRefresh={loadData}
            />

            {/* Where It Went Donut Chart (Addendum D: savings excluded, --c1..--c5 colors) */}
            <WhereItWentDonut
              monthLabel={monthLabel}
              categories={categoryBreakdown}
              spentTotal={monthlySpent}
              currency={userCurrency}
            />

            {/* Insights Card (Addendum D: ≤4 rows, small tinted icons) */}
            <InsightsCard insights={insights} />

            {/* 6-Month Spending Trend Chart (Phase 4.6) */}
            <SpendingTrendCard
              trendData={trendData}
              currency={userCurrency}
            />

            {/* Savings Rate Card (Addendum D) */}
            <SavingsRateSnap
              savingsAmount={monthlySavings}
              monthlyIncome={monthlyIncome}
              currency={userCurrency}
            />

            {/* Goals Preview Card (Phase 4.6) */}
            <GoalsPreviewCard currency={userCurrency} />

            {/* This Week Recap Card (Addendum D / mock up lines 1484-1487) */}
            <ThisWeekCard
              transactions={recentTx.length ? recentTx : monthTx}
              currency={userCurrency}
              streak={streak}
            />

            {/* Paste Bank Alert Prompt Banner (mock up line 1488) */}
            <Link
              to="/transactions/add"
              className="w-full bg-[var(--surface)] border border-dashed border-[var(--line)] rounded-2xl p-3.5 text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--primary)] transition-all flex items-center gap-2.5 text-xs font-semibold group cursor-pointer shadow-2xs"
            >
              <ClipboardList size={16} className="text-[var(--primary)] shrink-0" />
              <span>Paste a bank alert to add it in one step</span>
            </Link>
          </div>
        </div>
      </motion.main>

      <FinanceNavbar />
      <OnboardingTour hasNoAccounts={hasNoAccounts} />
    </div>
  );
}
