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
} from "lucide-react";
import { usePopup } from "@/components/ui/popup";
import { FinanceNavbar } from "@/components/finance/Navbar";
import { DashboardSkeleton } from "@/components/finance/Skeletons";
import { AiChat } from "@/components/finance/AiChat";
import { OnboardingTour } from "@/components/finance/OnboardingTour";
import { NotificationBell } from "@/components/finance/NotificationBell";
import { NewLookBanner } from "@/components/finance/NewLookBanner";
import { VerifyEmailBanner } from "@/components/finance/VerifyEmailBanner";
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
  const netSavings = monthlyIncome - monthlyExpense;
  const isPositiveTrend = netSavings >= 0;
  const hasMonthRecords = monthTx.length > 0 || monthlyIncome > 0 || monthlyExpense > 0 || categoryBreakdown.length > 0;

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
      <NewLookBanner />
      <VerifyEmailBanner />

      {/* Top Header & Vibrant Hero Card Section */}
      <motion.header
        variants={fadeSlideDown}
        initial="hidden"
        animate="visible"
        className="px-6 pt-8 pb-10 bg-gradient-to-b from-[#0b1434] via-[#101b45] to-[#162356] text-white border-b border-white/10 shadow-xl shadow-navy-950/20"
      >
        <div className="max-w-5xl mx-auto">
          {/* Top Header Bar: Avatar with Online Dot (left), Title (center), Notifications (right) */}
          <div className="flex justify-between items-center mb-6">
            <div className="relative">
              <Link
                to="/settings"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shadow-sm block relative overflow-hidden"
                aria-label="Profile settings"
              >
                <User size={20} />
              </Link>
              {/* Status Dot overlay on Avatar */}
              <span
                className={
                  "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#101b45] " +
                  (isOnline ? "bg-green-400" : "bg-amber-400")
                }
                title={isOnline ? "Online" : "Offline"}
              />
            </div>

            <h1 className="text-lg font-extrabold tracking-tight">Dashboard</h1>

            <NotificationBell />
          </div>

          {/* Hero Navy Card: Total Balance + Add Transaction button & Column-aligned dynamic trend */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3 shadow-inner"
          >
            <div className="flex justify-between items-center gap-2">
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider shrink-0">Total Balance</p>
              <Link
                to="/transactions/add"
                data-tour-target="add-transaction"
                className="px-2 py-1.5 bg-white text-[#101b45] hover:bg-slate-100 rounded-full text-[8px] sm:text-xs font-bold flex items-center gap-1 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 whitespace-nowrap"
              >
                <Plus size={12} strokeWidth={2.5} className="shrink-0" />
                <span>Add Transaction</span>
              </Link>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-white truncate">
                {formatCurrency(totalBalance, userCurrency)}
              </h2>
              <div
                className={`flex items-center gap-1 text-xs font-bold pt-1 ${
                  isPositiveTrend ? "text-green-400" : "text-rose-400"
                }`}
              >
                <span>{isPositiveTrend ? "▲" : "▼"}</span>
                <span>
                  {isPositiveTrend ? "+" : "-"}
                  {formatCurrency(Math.abs(netSavings), userCurrency)} net cashflow
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        className="px-6 space-y-6 pt-4 max-w-5xl mx-auto w-full"
      >
        {/* Month Selector Row (positioned between Hero Balance Card and Cashflow / Income & Expenses) */}
        <div className="flex justify-center items-center gap-3">
          <button
            type="button"
            aria-label="Previous month"
            disabled={loading || !hasMonthRecords}
            onClick={() => setMonthOffset((o) => o - 1)}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white"
            title={!hasMonthRecords ? "No records for this month" : "Previous month"}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-700 min-w-[9rem] text-center">
            {monthLabel}
          </span>
          <button
            type="button"
            aria-label="Next month"
            disabled={loading || monthOffset >= 0}
            onClick={() => setMonthOffset((o) => Math.min(0, o + 1))}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Income & Expenses (Cashflow) Summary Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-4"
        >
          <motion.div variants={staggerItem} className="bg-white p-5 rounded-2xl card-shadow border border-slate-50 flex flex-col justify-between h-32 overflow-hidden">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 15 }}
              className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600"
            >
              <ArrowDownLeft size={20} />
            </motion.div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Income
              </p>
              <p className="text-sm sm:text-lg font-black text-slate-900 truncate">{formatCurrency(monthlyIncome, userCurrency)}</p>
            </div>
          </motion.div>
          <motion.div variants={staggerItem} className="bg-white p-5 rounded-2xl card-shadow border border-slate-50 flex flex-col justify-between h-32 overflow-hidden">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 15 }}
              className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-600"
            >
              <ArrowUpRight size={20} />
            </motion.div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Expenses
              </p>
              <p className="text-sm sm:text-lg font-black text-slate-900 truncate">{formatCurrency(monthlyExpense, userCurrency)}</p>
            </div>
          </motion.div>
        </motion.div>

        {/* My Accounts Section with View All & Horizontal Scrolling Overflow */}
        <motion.section
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <div className="flex justify-between items-center px-1">
            <h3 className="text-lg font-black text-slate-900 leading-none">My Accounts</h3>
            <Link to="/accounts" className="text-xs font-bold text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex overflow-x-auto gap-4 pb-3 -mx-2 px-2 scrollbar-hide"
          >
            {accountList.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 text-center py-8 text-xs font-bold text-slate-400 uppercase tracking-widest bg-white rounded-2xl"
              >
                No accounts yet
              </motion.div>
            )}
            {accountList.map((account) => (
              <motion.div key={account.id} variants={staggerItem}>
                <Link
                  to={`/accounts/${account.id}`}
                  className="flex-shrink-0 w-44 bg-white p-5 rounded-2xl card-shadow border border-slate-50 space-y-4 block hover:border-blue-200 transition-colors"
                >
                  <div
                    className={`p-2.5 inline-flex rounded-2xl ${account.type === "bank"
                      ? "bg-blue-50 text-blue-600"
                      : account.type === "mobile"
                        ? "bg-purple-50 text-purple-600"
                        : "bg-amber-50 text-amber-600"
                      }`}
                  >
                    {account.type === "bank" ? <CreditCard size={18} /> : <Wallet size={18} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      {account.name}
                    </p>
                    <p className="text-base font-black text-slate-800 truncate">
                      {formatCurrency(account.balance, userCurrency)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* Spending Category Breakdown Section */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6"
        >
          <motion.section variants={staggerItem} className="space-y-4" data-tour-target="spending">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-lg font-black text-slate-900 leading-none">Spending</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{monthLabel}</p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-white rounded-2xl card-shadow border border-slate-50 p-6 space-y-4"
            >
              {categoryBreakdown.length === 0 && !loading && (
                <p className="text-center py-6 text-xs font-bold text-slate-400 uppercase tracking-widest opacity-60">
                  No spending in {monthLabel}
                </p>
              )}
              {categoryBreakdown.map((item, idx) => {
                const percentage = (item.total / maxTotal) * 100;
                return (
                  <motion.div
                    key={idx}
                    onClick={() => { if (item.category_id) navigate(`/transactions?category_id=${item.category_id}`); }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + idx * 0.08, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                    className={`space-y-2 ${item.category_id ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                  >
                    <div className="flex justify-between items-center px-1 min-w-0">
                      <span className="text-xs font-bold text-slate-700 truncate">{item.category_name}</span>
                      <span className="text-xs font-black text-slate-900 shrink-0 ml-2">
                        {formatCurrency(item.total, userCurrency)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.4 + idx * 0.08, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                        className="h-full bg-blue-600 rounded-full"
                      />
                    </div>
                  </motion.div>
                );
              })}
              <Link
                to="/transactions"
                className="flex items-center justify-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-100 hover:text-blue-600 transition-colors"
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

