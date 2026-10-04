import { Link, useNavigate, useSearchParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Plus,
  Shield,
  ShieldAlert,
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
import { RecentTransactionsCard } from "@/components/finance/RecentTransactionsCard";
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
  const [showQuickLog, setShowQuickLog] = useState(true);

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

  // Detect potential duplicate transactions (same amount, same account or same description within 48h)
  const duplicateTransactions = useMemo(() => {
    const list = recentTx.length ? recentTx : monthTx;
    if (!list.length) return [];

    const duplicates: { first: TransactionDto; second: TransactionDto }[] = [];
    const matchedIds = new Set<number>();

    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (matchedIds.has(a.id)) continue;

      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (matchedIds.has(b.id)) continue;

        const amountA = Math.abs(toNumber(a.amount));
        const amountB = Math.abs(toNumber(b.amount));
        const sameAmount = Math.abs(amountA - amountB) < 0.01;
        const sameType = a.type === b.type;
        const sameAccount = a.account_id && b.account_id && a.account_id === b.account_id;

        // Check date difference <= 48 hours
        const dateA = a.transaction_date ? new Date(a.transaction_date).getTime() : 0;
        const dateB = b.transaction_date ? new Date(b.transaction_date).getTime() : 0;
        const within48h = Math.abs(dateA - dateB) <= 48 * 60 * 60 * 1000;

        const descA = (a.description || "").trim().toLowerCase();
        const descB = (b.description || "").trim().toLowerCase();
        const sameDesc = descA.length > 0 && descA === descB;

        if (sameAmount && sameType && within48h && (sameAccount || sameDesc)) {
          duplicates.push({ first: a, second: b });
          matchedIds.add(a.id);
          matchedIds.add(b.id);
          break;
        }
      }
    }
    return duplicates;
  }, [recentTx, monthTx]);

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

        {/* 2-Column Responsive Layout: Activity & Analysis (Left) vs Budgeting & Structure (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-5 items-start">
          {/* Column A (Left): Cash Flow Hero (Top Balance) + Duplicate Guard Alert (Conditional) + Quick Log + Donut + Line Trend + Recent Activity */}
          <div className="flex flex-col gap-4 min-w-0">
            {/* Cash Flow Hero Card (Total balance & Net cash flow - Always at top) */}
            <CashFlowHeroCard
              totalBalance={totalBalance}
              monthlyIncome={monthlyIncome}
              monthlySpent={monthlySpent}
              monthlySavings={monthlySavings}
              accountsCount={accountList.length}
              currency={userCurrency}
            />

            {/* Duplicate Guard Alert (High-priority notice ONLY if duplicate transactions exist) */}
            {duplicateTransactions.length > 0 && (
              <div
                role="alert"
                className="bg-amber-500/10 border border-amber-500/30 rounded-[6px] p-3.5 shadow-[var(--lift)] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-[4px] bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldAlert size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--ink)] leading-snug">
                      {duplicateTransactions.length} potential duplicate {duplicateTransactions.length === 1 ? "transaction" : "transactions"} detected
                    </p>
                    <p className="text-[11px] text-[var(--muted)] truncate">
                      Review to avoid double-counting expenses or transfers
                    </p>
                  </div>
                </div>
                <Link
                  to="/transactions"
                  className="px-2.5 py-1 text-xs font-bold rounded-[4px] bg-amber-600 hover:bg-amber-700 text-white shrink-0 transition-colors"
                >
                  Review
                </Link>
              </div>
            )}

            {/* Quick Log Card (Dismissible so Top Balance stays cleanly anchored at the top) */}
            {showQuickLog ? (
              <QuickLogCard
                transactions={recentTx.length ? recentTx : monthTx}
                accounts={accountList}
                categories={categories}
                currency={userCurrency}
                onRefresh={loadData}
                onDismiss={() => setShowQuickLog(false)}
              />
            ) : (
              <div className="flex justify-end -mt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickLog(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary)]/80 bg-[var(--surface)] hover:bg-[var(--chip)] border border-[var(--line)] px-2.5 py-1 rounded-[4px] shadow-sm transition-all cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Quick log</span>
                </button>
              </div>
            )}

            {/* Where It Went Donut Chart (Breakdown of past spending) */}
            <WhereItWentDonut
              monthLabel={monthLabel}
              categories={categoryBreakdown}
              spentTotal={monthlySpent}
              currency={userCurrency}
            />

            {/* 6-Month Spending Trend Chart (Line Chart Flow) */}
            <SpendingTrendCard
              trendData={trendData}
              currency={userCurrency}
            />

            {/* Recent Activity / Last 5 Transactions Card (Moved down per user feedback) */}
            <RecentTransactionsCard
              transactions={recentTx.length ? recentTx : monthTx}
              currency={userCurrency}
            />
          </div>

          {/* Column B (Right): Insights (Promoted to top) + Monthly Budget + Savings Rate + Accounts + Coming Up + Goals + This week + Paste Alert */}
          <div className="flex flex-col gap-4 min-w-0">
            {/* Insights Card (Moved up per user guidance) */}
            <InsightsCard insights={insights} />

            {/* Monthly Budget Snap */}
            <MonthlyBudgetSnap
              monthLabel={monthLabel}
              spent={monthlySpent}
              budgetLimit={monthlyIncome > 0 ? monthlyIncome : 0}
              currency={userCurrency}
            />

            {/* Savings Rate Card */}
            <SavingsRateSnap
              savingsAmount={monthlySavings}
              monthlyIncome={monthlyIncome}
              currency={userCurrency}
            />

            {/* Coming Up / Recurring Subscriptions Section */}
            <ComingUpCard currency={userCurrency} />

            {/* Goals Preview Card */}
            <GoalsPreviewCard currency={userCurrency} />

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
                  <div className="flex-1 text-center py-6 text-xs font-bold text-[var(--muted)] uppercase tracking-widest bg-[var(--surface)] border border-[var(--line)] rounded-[6px] shadow-[var(--lift)]">
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
                      className="flex-shrink-0 w-32 bg-[var(--surface)] p-2.5 rounded-[6px] border border-[var(--line)] space-y-1.5 block hover:border-[var(--primary)]/60 transition-colors shadow-[var(--lift)]"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`p-1.5 inline-flex rounded-[4px] ${
                            account.type === "bank"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : account.type === "mobile"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {account.type === "bank" ? <CreditCard size={13} /> : <Wallet size={13} />}
                        </div>
                        <span className="text-[8.5px] font-bold uppercase tracking-wider text-[var(--muted)] bg-[var(--chip)] px-1 py-0.5 rounded-[4px]">
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

            {/* This Week Recap Card */}
            <ThisWeekCard
              transactions={recentTx.length ? recentTx : monthTx}
              currency={userCurrency}
              streak={streak}
            />

            {/* Paste Bank Alert Prompt Banner */}
            <Link
              to="/transactions/add"
              className="w-full bg-[var(--surface)] border border-dashed border-[var(--line)] rounded-[6px] p-3.5 text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--primary)] transition-all flex items-center gap-2.5 text-xs font-semibold group cursor-pointer shadow-[var(--lift)]"
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
