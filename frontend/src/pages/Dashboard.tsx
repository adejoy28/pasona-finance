import { Link, useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Plus,
  User,
  Wallet,
  Eye,
  EyeOff,
} from "lucide-react";
import { usePopup } from "@/components/ui/popup";
import { FinanceNavbar } from "@/components/finance/Navbar";
import { DashboardSkeleton } from "@/components/finance/Skeletons";
import { AiChat } from "@/components/finance/AiChat";
import { OnboardingTour } from "@/components/finance/OnboardingTour";
import { NotificationBell } from "@/components/finance/NotificationBell";
import { NewLookBanner } from "@/components/finance/NewLookBanner";
import { VerifyEmailBanner } from "@/components/finance/VerifyEmailBanner";
import { BiometricPromptBanner } from "@/components/finance/BiometricPromptBanner";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { formatCurrency, type Account } from "@/lib/finance";
import {
  fadeSlideDown,
  fadeSlideUp,
  staggerContainer,
  staggerItem,
} from "@/lib/animations";
import {
  accounts as accountsApi,
  summary as summaryApi,
  transactions as transactionsApi,
  type TransactionDto,
  type AccountDto,
  type SummaryDto,
} from "@/lib/api";
import { useOnline } from "@/hooks/use-online";
import { useMe, invalidateMe } from "@/hooks/use-me";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";

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
  const popup = usePopup();
  const { isRevealed, toggleReveal, renderAmount } = usePrivacyMode();

  useEffect(() => {
    document.title = "Dashboard — Pasona";
  }, []);

  useEffect(() => {
    if (!verifiedFlag) return;
    if (verifiedFlag === "1") {
      popup.success("Email confirmed");
    } else if (verifiedFlag === "already") {
      popup.info("Email was already verified");
    } else if (verifiedFlag === "error") {
      popup.error("That confirmation link is invalid or has expired.");
    }
    invalidateMe();
    setSearchParams({}, { replace: true });
  }, [verifiedFlag, popup, setSearchParams]);

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
  const [monthTx, setMonthTx] = useState<TransactionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const [sumRes, accRes, txRes] = await Promise.all([
          summaryApi.getSummary({ from: monthFrom, to: monthTo }),
          accountsApi.listAccounts(),
          transactionsApi.listTransactions({ from: monthFrom, to: monthTo, per_page: 500 }),
        ]);
        if (!cancelled) {
          setSummary(sumRes);
          setAccountDtos(accRes);
          setMonthTx(txRes.data ?? []);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadData();
    return () => {
      cancelled = true;
    };
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

  const filteredMonthTx = monthTx.filter((t) => {
    if (!t.transaction_date) return false;
    const dateStr = t.transaction_date.slice(0, 10);
    return dateStr >= monthFrom && dateStr <= monthTo;
  });

  type MonthAgg = { income: number; expense: number; byCategory: Map<string, { amount: number; id?: number }> };
  const derived = filteredMonthTx.reduce<MonthAgg>(
    (acc, t) => {
      const amount = toNumber(t.amount);
      if (t.type === "income") acc.income += amount;
      else if (t.type === "expense") {
        acc.expense += amount;
        const name = t.category?.name ?? "Uncategorized";
        const existing = acc.byCategory.get(name) ?? { amount: 0, id: t.category_id ?? undefined };
        acc.byCategory.set(name, { amount: existing.amount + amount, id: existing.id ?? t.category_id ?? undefined });
      }
      return acc;
    },
    { income: 0, expense: 0, byCategory: new Map<string, { amount: number; id?: number }>() },
  );

  const summaryHasData = Boolean(summary?.monthly_summary);
  const monthlyIncome = summaryHasData
    ? toNumber(summary!.monthly_summary.income)
    : derived.income;

  const monthlyExpense = summaryHasData
    ? toNumber(summary!.monthly_summary.expense)
    : derived.expense;

  const categoryBreakdown = summaryHasData && summary?.category_breakdown
    ? summary.category_breakdown.map((row) => ({
      category_name: row.category_name,
      category_id: row.category_id,
      total: toNumber(row.total),
    }))
    : [...derived.byCategory.entries()]
      .map(([category_name, data]) => ({ category_name, category_id: data.id, total: data.amount }))
  const maxTotal = Math.max(...categoryBreakdown.map((c) => c.total), 1);
  const totalSpending = categoryBreakdown.reduce((sum, item) => sum + item.total, 0) || 1;
  const netSavings = monthlyIncome - monthlyExpense;
  const isPositiveTrend = netSavings >= 0;
  const hasMonthRecords = monthTx.length > 0 || monthlyIncome > 0 || monthlyExpense > 0 || categoryBreakdown.length > 0;
  const expenseRatio = monthlyIncome > 0
    ? Math.min(100, Math.round((monthlyExpense / monthlyIncome) * 100))
    : monthlyExpense > 0 ? 100 : 0;

  const CATEGORY_COLORS = [
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#64748b", // Slate
  ];

  const accumulatedPercents = categoryBreakdown.reduce<number[]>((acc, item, idx) => {
    if (idx === 0) {
      acc.push(0);
    } else {
      const prevPct = (categoryBreakdown[idx - 1].total / totalSpending) * 100;
      acc.push(acc[idx - 1] + prevPct);
    }
    return acc;
  }, []);

  if (loading && !summary) {
    return (
      <>
        <DashboardSkeleton />
        <FinanceNavbar />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Sticky Fixed Top Header Bar (Edge-to-edge padding, seamlessly connects with hero) */}
      <header className="sticky top-0 z-40 bg-[#0b1434] pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 px-6 shadow-sm border-b border-white/5 transition-all">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Link
              to="/settings"
              className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all shadow-sm relative overflow-hidden ring-2 ring-offset-2 ring-offset-[#0b1434] ${
                isOnline ? "ring-emerald-400 bg-white/10" : "ring-amber-400 bg-white/10"
              }`}
              aria-label="Profile settings"
              title={isOnline ? "Online" : "Offline"}
            >
              <User size={18} />
            </Link>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
              {userQuery.data?.name ? `Hi, ${userQuery.data.name.trim().split(" ")[0]}` : "Hi, User"}
            </h1>
          </div>

          <NotificationBell />
        </div>
      </header>

      <NewLookBanner />
      <VerifyEmailBanner />
      <BiometricPromptBanner />

      {/* Hero Navy Card Section */}
      <motion.section
        variants={fadeSlideDown}
        initial="hidden"
        animate="visible"
        className="px-6 pt-2 pb-6 bg-gradient-to-b from-[#0b1434] via-[#101b45] to-[#162356] text-white border-b border-white/10 shadow-xl shadow-navy-950/20"
      >
        <div className="max-w-5xl mx-auto">
          {/* Hero Navy Card: PalmPay-Style Compact 3-Row Grid */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-2.5 shadow-inner"
          >
            {/* Row 1: Total Balance + Eye toggle on left, History shortcut on right */}
            <div className="flex justify-between items-center text-[11px] text-white/80">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0" />
                <span className="uppercase tracking-wider font-semibold text-[10px]">Total Balance</span>
                <button
                  onClick={toggleReveal}
                  className="text-white/60 hover:text-white transition-colors p-0.5"
                  aria-label={isRevealed ? "Hide balances" : "Show balances"}
                >
                  {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>

              <Link
                to="/transactions"
                className="flex items-center gap-0.5 text-white/70 hover:text-white transition-colors text-[11px] font-medium"
              >
                <span>History</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {/* Row 2: Balance on Left + [+ Add] Pill CTA on Right (SAME ROW) */}
            <div className="flex justify-between items-center gap-3">
              <h2 className="text-[22px] sm:text-2xl font-bold tracking-tight leading-none text-white truncate min-w-0">
                {renderAmount(totalBalance, userCurrency)}
              </h2>

              <Link
                to="/transactions/add"
                data-tour-target="add-transaction"
                className="px-3 py-1.5 bg-white text-[#101b45] hover:bg-slate-100 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>Add</span>
              </Link>
            </div>

            {/* Row 3: Integrated Cashflow Insight Strip */}
            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[11px]">
              <div
                className={`flex items-center gap-1 font-semibold ${
                  isPositiveTrend ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                <span aria-hidden="true">{isPositiveTrend ? "▲" : "▼"}</span>
                <span className="sr-only">
                  {isPositiveTrend ? "Positive cashflow:" : "Negative cashflow:"}
                </span>
                <span>
                  {isPositiveTrend ? "+" : "-"}
                  {renderAmount(Math.abs(netSavings), userCurrency)} net this month
                </span>
              </div>

              <span className="text-[10px] text-white/60 font-medium">
                {monthLabel}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content Area */}
      <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        className={`px-6 space-y-5 pt-3 max-w-5xl mx-auto w-full transition-opacity duration-200 ${
          loading ? "opacity-60" : "opacity-100"
        }`}
      >
        {/* Month Selector Row */}
        <div className="flex justify-center items-center gap-3">
          <button
            type="button"
            aria-label="Previous month"
            disabled={loading}
            onClick={() => setMonthOffset((o) => o - 1)}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            title="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-700 min-w-[9rem] text-center">
            {monthLabel}
          </span>
          <button
            type="button"
            aria-label="Next month"
            disabled={loading || monthOffset >= 0}
            onClick={() => setMonthOffset((o) => Math.min(0, o + 1))}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            title="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Unified Monthly Cashflow Card (Slim & Compact) */}
        <motion.div
          variants={staggerItem}
          className="bg-white rounded-2xl card-shadow border border-slate-100 p-3.5 space-y-2.5 overflow-hidden"
        >
          {/* Header row: Label */}
          <div className="flex justify-between items-center px-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Monthly Cash Flow
            </p>
            <p className="text-[10.5px] font-semibold text-slate-400">
              {monthLabel}
            </p>
          </div>

          {/* Stacked Metrics: Income on top of Expenses */}
          <div className="space-y-2">
            {/* Income */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <ArrowDownLeft size={13} />
                </div>
                <p className="text-[11.5px] font-semibold text-slate-600">Income</p>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                {renderAmount(monthlyIncome, userCurrency)}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-50" />

            {/* Expenses */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                  <ArrowUpRight size={13} />
                </div>
                <p className="text-[11.5px] font-semibold text-slate-600">Expenses</p>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                {renderAmount(monthlyExpense, userCurrency)}
              </p>
            </div>
          </div>

          {/* Cashflow Ratio Bar */}
          {monthlyIncome > 0 && (
            <div className="space-y-1 pt-1 border-t border-slate-50">
              <div className="flex justify-between text-[10px] font-medium text-slate-500">
                <span>{expenseRatio}% spent</span>
                <span className="text-slate-400">{Math.max(0, 100 - expenseRatio)}% saved</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${Math.min(100, expenseRatio)}%` }}
                  className={`h-full transition-all duration-500 rounded-full ${
                    expenseRatio > 90 ? "bg-rose-500" : expenseRatio > 70 ? "bg-amber-500" : "bg-blue-600"
                  }`}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Compact My Accounts Section with View All */}
        <motion.section
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          className="space-y-2.5"
        >
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-none">My Accounts</h3>
            <Link to="/accounts" className="text-xs font-bold text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex overflow-x-auto gap-2.5 pb-2 -mx-2 px-2 scrollbar-hide"
          >
            {accountList.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 text-center py-6 text-xs font-bold text-slate-400 uppercase tracking-widest bg-white rounded-2xl"
              >
                No accounts yet
              </motion.div>
            )}
            {accountList.map((account) => (
              <motion.div key={account.id} variants={staggerItem}>
                <Link
                  to={`/accounts/${account.id}`}
                  className="flex-shrink-0 w-32 bg-white p-2.5 rounded-xl card-shadow border border-slate-50 space-y-1.5 block hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-1.5 inline-flex rounded-lg ${
                        account.type === "bank"
                          ? "bg-blue-50 text-blue-600"
                          : account.type === "mobile"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {account.type === "bank" ? <CreditCard size={13} /> : <Wallet size={13} />}
                    </div>
                    <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-1 py-0.5 rounded">
                      {account.type}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 truncate">
                      {account.name}
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {renderAmount(account.balance, userCurrency)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* Spending Category Breakdown with Visual Donut Chart */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6"
        >
          <motion.section variants={staggerItem} className="space-y-3" data-tour-target="spending">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-base font-bold text-slate-900 leading-none">Spending</h3>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">{monthLabel}</p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-white rounded-2xl card-shadow border border-slate-50 p-5 space-y-4"
            >
              {categoryBreakdown.length === 0 && !loading && (
                <p className="text-center py-6 text-xs font-bold text-slate-400 uppercase tracking-widest opacity-60">
                  No spending in {monthLabel}
                </p>
              )}

              {categoryBreakdown.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Visual Donut Ring */}
                  <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#f1f5f9"
                        strokeWidth="11"
                      />
                      {categoryBreakdown.map((item, idx) => {
                        const pct = (item.total / totalSpending) * 100;
                        const strokeDash = (pct / 100) * 238.76;
                        const strokeGap = 238.76 - strokeDash;
                        const strokeOffset = -(accumulatedPercents[idx] / 100) * 238.76;
                        return (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="38"
                            fill="transparent"
                            stroke={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                            strokeWidth="11"
                            strokeDasharray={`${strokeDash} ${strokeGap}`}
                            strokeDashoffset={strokeOffset}
                            className="transition-all duration-500"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Spent</span>
                      <span className="text-xs sm:text-sm font-black text-slate-900 truncate max-w-[85px] text-center">
                        {renderAmount(monthlyExpense, userCurrency)}
                      </span>
                    </div>
                  </div>

                  {/* Category Breakdown List */}
                  <div className="flex-1 w-full space-y-2">
                    {categoryBreakdown.map((item, idx) => {
                      const percentage = Math.round((item.total / totalSpending) * 100);
                      const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                      return (
                        <div
                          key={idx}
                          onClick={() => { if (item.category_id) navigate(`/transactions?category_id=${item.category_id}`); }}
                          className={`flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors ${
                            item.category_id ? "cursor-pointer" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-semibold text-slate-700 truncate">
                              {item.category_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-bold text-slate-400">
                              {percentage}%
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {renderAmount(item.total, userCurrency)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Link
                to="/transactions"
                className="flex items-center justify-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-3 border-t border-slate-100 hover:text-blue-600 transition-colors"
              >
                Full History <ChevronRight size={12} />
              </Link>
            </motion.div>
          </motion.section>
        </motion.div>


      </motion.div>

      <AiChat />
      <FinanceNavbar />
      <OnboardingTour hasNoAccounts={hasNoAccounts} />
    </div>
  );
}

