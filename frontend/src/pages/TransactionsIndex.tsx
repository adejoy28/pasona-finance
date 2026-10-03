import { Link, useSearchParams } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { notify } from "@/hooks/use-toast";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Bell,
  Calendar,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Tag,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCompactCurrency, formatCurrency, type Transaction } from "@/lib/finance";
import { ApiError, transactions as transactionsApi, type TransactionDto } from "@/lib/api";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { TransactionDialog } from "@/components/finance/TransactionDialog";
import { HistorySkeleton, TransactionsSkeleton } from "@/components/finance/Skeletons";
import { SwipeReveal } from "@/components/finance/SwipeReveal";
import { useMe } from "@/hooks/use-me";
import { useOnline } from "@/hooks/use-online";
import { fadeSlideDown, fadeSlideUp } from "@/lib/animations";

type Filter = "all" | "expense" | "income" | "transfer";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "expense", label: "Expenses" },
  { id: "income", label: "Income" },
  { id: "transfer", label: "Transfers" },
];

function getIcon(type: Transaction["type"]) {
  if (type === "income") return <ArrowDownLeft size={16} className="text-emerald-500" />;
  if (type === "expense") return <ArrowUpRight size={16} className="text-red-600" />;
  return <ArrowRightLeft size={16} className="text-indigo-500" />;
}

function formatDateHeader(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

function toTransaction(dto: TransactionDto): Transaction {
  return {
    id: dto.id,
    description: dto.description ?? undefined,
    category: dto.category ? { name: dto.category.name } : undefined,
    transaction_date: dto.transaction_date,
    account: dto.account ? { name: dto.account.name } : undefined,
    toAccount: dto.to_account ? { name: dto.to_account.name } : null,
    type: dto.type,
    amount: typeof dto.amount === "string" ? parseFloat(dto.amount) : dto.amount,
  };
}

function groupByDay(items: Transaction[]) {
  const groups = new Map<string, Transaction[]>();
  for (const t of items) {
    const key = t.transaction_date.split(" ")[0]!;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  return Array.from(groups.entries()).sort((a, b) => (a[0]! < b[0]! ? 1 : -1));
}

export function TransactionsIndex() {
  const [txDtos, setTxDtos] = useState<TransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("category_id");

  const [savedFilters, setSavedFilters] = useState<
    { id: string; name: string; type?: Filter; search?: string; dateFilter?: string }[]
  >(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("pasona.saved_filters");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const isFilterActive = filter !== "all" || Boolean(search.trim()) || dateFilter !== "all";

  const saveCurrentFilter = () => {
    const parts: string[] = [];
    if (search.trim()) parts.push(`"${search.trim()}"`);
    if (filter !== "all") parts.push(filter.charAt(0).toUpperCase() + filter.slice(1));
    if (dateFilter !== "all") {
      const dateNames: Record<string, string> = {
        today: "Today",
        yesterday: "Yesterday",
        this_week: "This week",
        last_week: "Last week",
        custom: "Custom",
      };
      parts.push(dateNames[dateFilter] ?? dateFilter);
    }
    const name = parts.join(" · ") || "Saved filter";
    const newFilter = {
      id: String(Date.now()),
      name,
      type: filter,
      search: search.trim() || undefined,
      dateFilter: dateFilter !== "all" ? dateFilter : undefined,
    };
    const updated = [newFilter, ...savedFilters].slice(0, 6);
    setSavedFilters(updated);
    try {
      localStorage.setItem("pasona.saved_filters", JSON.stringify(updated));
      notify.success("Filter saved");
    } catch (err) {
      console.error("Failed to save filter", err);
    }
  };

  const applySavedFilter = (sf: { type?: Filter; search?: string; dateFilter?: string }) => {
    setFilter(sf.type ?? "all");
    setSearch(sf.search ?? "");
    if (sf.search) setShowSearchInput(true);
    setDateFilter(sf.dateFilter ?? "all");
  };

  useEffect(() => {
    document.title = "History — Pasona";
  }, []);

  const isOnline = useOnline();
  const userQuery = useMe();
  const userCurrency = userQuery.data?.currency ?? DEFAULT_CURRENCY;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { renderAmount, isMasked } = usePrivacyMode();

  const loadData = async () => {
    setLoading(true);
    try {
      let from: string | undefined;
      let to: string | undefined;

      const today = new Date();
      if (dateFilter === "today") {
        from = today.toISOString().split("T")[0];
        to = today.toISOString().split("T")[0];
      } else if (dateFilter === "yesterday") {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        from = y.toISOString().split("T")[0];
        to = y.toISOString().split("T")[0];
      } else if (dateFilter === "this_week") {
        const d = new Date(today);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        from = d.toISOString().split("T")[0];
        to = today.toISOString().split("T")[0];
      } else if (dateFilter === "last_week") {
        const endLastWeek = new Date(today);
        const day = endLastWeek.getDay();
        endLastWeek.setDate(endLastWeek.getDate() - day + (day === 0 ? -6 : 1) - 1);
        const startLastWeek = new Date(endLastWeek);
        startLastWeek.setDate(endLastWeek.getDate() - 6);
        from = startLastWeek.toISOString().split("T")[0];
        to = endLastWeek.toISOString().split("T")[0];
      } else if (dateFilter === "custom") {
        from = customFrom || undefined;
        to = customTo || undefined;
      }

      const res = await transactionsApi.listTransactions({
        per_page: 100,
        category_id: categoryId ? parseInt(categoryId, 10) : undefined,
        from,
        to
      });
      setTxDtos(res.data ?? []);
    } catch (err) {
      if (err instanceof ApiError) setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [categoryId, dateFilter, customFrom, customTo]);

  const transactions: Transaction[] = useMemo(() => txDtos.map(toTransaction), [txDtos]);

  const [editingTransaction, setEditingTransaction] = useState<TransactionDto | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (filter !== "all" && t.type !== filter) return false;
      if (!q) return true;
      return (
        (t.description ?? "").toLowerCase().includes(q) ||
        (t.category?.name ?? "").toLowerCase().includes(q) ||
        (t.account?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [transactions, filter, search]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      if (t.type === "income") income += t.amount;
      else if (t.type === "expense") expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }, [filtered]);

  const allTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === "income") income += t.amount;
      else if (t.type === "expense") expense += t.amount;
    }
    return { income, expense, count: transactions.length };
  }, [transactions]);

  const heroTitle = useMemo(() => {
    if (filter === "income") return "Total Income";
    if (filter === "transfer") return "Total Transfers";
    if (categoryId) {
      const cat = filtered.find((t) => t.category?.name)?.category?.name;
      if (cat) return `${cat} Total`;
    }
    if (totals.expense === 0 && totals.income > 0) return "Total Income";
    return "Total Spendings";
  }, [filter, categoryId, filtered, totals]);

  const heroAmount = useMemo(() => {
    if (filter === "income") return totals.income;
    if (filter === "expense") return totals.expense;
    if (filter === "transfer") return filtered.reduce((s, t) => s + t.amount, 0);
    if (categoryId) {
      return filtered.reduce((s, t) => s + t.amount, 0);
    }
    return totals.expense > 0 ? totals.expense : totals.income;
  }, [filter, categoryId, filtered, totals]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  const confirmDelete = async () => {
    if (!deletingTransaction) return;
    setIsDeleting(true);
    try {
      await transactionsApi.deleteTransaction(deletingTransaction.id);
      notify.success("Transaction deleted");
      setDeletingTransaction(null);
      void loadData();
    } catch (err) {
      notify.error(
        err instanceof ApiError
          ? err.message
          : "Unable to delete transaction. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && txDtos.length === 0) {
    return <HistorySkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Sticky Fixed Top Header Bar */}
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
            <h1 className="text-base font-bold tracking-tight text-white">History</h1>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setShowSearchInput((prev) => !prev);
                if (showSearchInput) setSearch("");
              }}
              className={cn(
                "w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all",
                (showSearchInput || search) && "bg-white text-indigo-950 font-bold",
              )}
              aria-label="Toggle Search"
            >
              <Search size={16} />
            </button>
            <Link
              to="/transactions/add"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
              aria-label="Add Transaction"
            >
              <Plus size={18} />
            </Link>
          </div>
        </div>
      </header>

      {/* Page Hero Card Section */}
      <motion.section
        variants={fadeSlideDown}
        initial="hidden"
        animate="visible"
        className="px-6 pt-2 pb-6 bg-gradient-to-b from-[#0b1434] via-[#101b45] to-[#162356] text-white border-b border-white/10 shadow-xl shadow-navy-950/20"
      >
        <div className="max-w-5xl mx-auto">
          {/* Page Hero Card: Spendings / Summary for Selected Filter */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-2.5 shadow-inner"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
              <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider min-w-0 truncate">{heroTitle}</p>
              <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0 max-w-full">
                {totals.income > 0 && (
                  <span className="inline-flex items-center text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full whitespace-nowrap tabular-nums leading-tight">
                    +{renderAmount(totals.income, userCurrency)}
                  </span>
                )}
                {totals.expense > 0 && (
                  <span className="inline-flex items-center text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full whitespace-nowrap tabular-nums leading-tight">
                    -{renderAmount(totals.expense, userCurrency)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-baseline gap-2">
              <h2 className="text-[22px] sm:text-2xl font-bold tracking-tight leading-none text-white truncate">
                {renderAmount(heroAmount, userCurrency)}
              </h2>
              <span className="text-[11px] font-medium text-white/70 shrink-0">
                {filtered.length} transactions
              </span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 space-y-6 pt-4 w-full">
        {/* Compact 3-Stat Bar (Task 2.2) */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white border border-slate-200/70 rounded-2xl p-2.5 sm:p-3 shadow-xs min-w-0">
            <div className="text-[9px] font-extrabold tracking-wider uppercase text-slate-400">In</div>
            <div className="font-extrabold text-xs sm:text-sm text-emerald-600 tabular-nums truncate mt-0.5">
              +{renderAmount(allTotals.income, userCurrency)}
            </div>
          </div>
          <div className="bg-white border border-slate-200/70 rounded-2xl p-2.5 sm:p-3 shadow-xs min-w-0">
            <div className="text-[9px] font-extrabold tracking-wider uppercase text-slate-400">Out</div>
            <div className="font-extrabold text-xs sm:text-sm text-slate-900 tabular-nums truncate mt-0.5">
              -{renderAmount(allTotals.expense, userCurrency)}
            </div>
          </div>
          <div className="bg-white border border-slate-200/70 rounded-2xl p-2.5 sm:p-3 shadow-xs min-w-0">
            <div className="text-[9px] font-extrabold tracking-wider uppercase text-slate-400">Entries</div>
            <div className="font-extrabold text-xs sm:text-sm text-slate-900 tabular-nums truncate mt-0.5">
              {allTotals.count}
            </div>
          </div>
        </div>

        {/* Expandable Search Input */}
        <AnimatePresence>
          {(showSearchInput || search) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="relative pt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  value={search}
                  ref={searchInputRef}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by note, category, or account..."
                  autoFocus
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 card-shadow"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimal Segmented Filter Tabs & Date Filter */}
        <div className="space-y-2">
          <div className="flex bg-slate-200/50 p-1 rounded-xl gap-1 border border-slate-200/40">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-black transition-all text-center select-none cursor-pointer",
                    active
                      ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                      : "text-[var(--muted)] hover:text-[var(--ink)]",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--ink)] focus:outline-none focus:border-[var(--primary)] shadow-xs appearance-none"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="last_week">Last Week</option>
            <option value="custom">Custom Range</option>
          </select>
          {dateFilter === "custom" && (
            <div className="flex gap-2">
              <input 
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--primary)] shadow-xs"
              />
              <input 
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--primary)] shadow-xs"
              />
            </div>
          )}

          {/* Saved Filter Chips (Task 2.3) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {savedFilters.map((sf) => {
              const isMatch =
                filter === (sf.type ?? "all") &&
                search === (sf.search ?? "") &&
                dateFilter === (sf.dateFilter ?? "all");

              return (
                <button
                  key={sf.id}
                  type="button"
                  onClick={() => applySavedFilter(sf)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer",
                    isMatch
                      ? "bg-[var(--primary)] text-white shadow-xs"
                      : "bg-[var(--chip)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
                  )}
                >
                  <span>{sf.name}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      const updated = savedFilters.filter((f) => f.id !== sf.id);
                      setSavedFilters(updated);
                      try {
                        localStorage.setItem("pasona.saved_filters", JSON.stringify(updated));
                      } catch {
                        // ignore
                      }
                    }}
                    className="opacity-60 hover:opacity-100 ml-0.5"
                    title="Remove filter"
                  >
                    ×
                  </span>
                </button>
              );
            })}

            {isFilterActive && savedFilters.length < 6 && (
              <button
                type="button"
                onClick={saveCurrentFilter}
                className="px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 border border-dashed border-[var(--line)] text-[var(--muted)] hover:border-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
              >
                + Save this filter
              </button>
            )}
          </div>
        </div>



        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={15} />
            {error.message}
          </div>
        )}

        {loading && transactions.length === 0 && <TransactionsSkeleton />}

        {!loading && filtered.length === 0 && (
          <div className="bg-white p-8 rounded-2xl text-center space-y-3 border border-slate-200/60 my-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ReceiptText size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">No transactions</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {search || filter !== "all"
                  ? "No results matching your filters"
                  : "Start tracking by recording your first transaction"}
              </p>
            </div>
          </div>
        )}

        {/* Clean Feed */}
        <div className="space-y-4">
          {grouped.map(([day, items]) => (
            <div key={day} className="space-y-1.5">
              {/* Date Separator Header (Task 2.1) */}
              <div className="px-1 pt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>{formatDateHeader(day)}</span>
                {(() => {
                  const dayNet = items.reduce((sum, item) => {
                    const amt = Number(item.amount) || 0;
                    if (item.type === "income") return sum + amt;
                    if (item.type === "expense") return sum - amt;
                    return sum;
                  }, 0);

                  return (
                    <span
                      className={cn(
                        "font-extrabold text-[11px] tabular-nums tracking-normal normal-case",
                        dayNet > 0
                          ? "text-emerald-600"
                          : dayNet < 0
                          ? "text-rose-600"
                          : "text-slate-400"
                      )}
                    >
                      {dayNet > 0 ? "+" : dayNet < 0 ? "−" : ""}
                      {renderAmount(Math.abs(dayNet), userCurrency)}
                    </span>
                  );
                })()}
              </div>

              {/* Transactions Card List */}
              <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden divide-y divide-slate-100">
                {items.map((tx) => {
                  const rawDto = txDtos.find((d) => d.id === tx.id) ?? null;
                  const isIncome = tx.type === "income";

                  return (
                    <SwipeReveal
                      key={tx.id}
                      rightActions={[
                        { label: "Edit", icon: <Pencil size={18} />, onClick: () => setEditingTransaction(rawDto), className: "bg-blue-500 text-white" },
                        { label: "Delete", icon: <Trash2 size={18} />, onClick: () => setDeletingTransaction(tx), className: "bg-red-500 text-white" }
                      ]}
                    >
                      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors group cursor-pointer">
                        <Link
                          to={`/transactions/${tx.id}`}
                          className="flex items-center gap-3 min-w-0 flex-1"
                        >
                          {/* Icon Container */}
                          <div
                            className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                              tx.type === "income"
                                ? "bg-emerald-50 text-emerald-600"
                                : tx.type === "expense"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-indigo-50 text-indigo-600",
                            )}
                          >
                            {getIcon(tx.type)}
                          </div>

                          {/* Description & Metadata */}
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {tx.description || (tx.type === "transfer" ? "Transfer" : "Transaction")}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                              {tx.account?.name && <span>{tx.account.name}</span>}
                              {tx.category?.name && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-500">{tx.category.name}</span>
                                </>
                              )}
                              {(() => {
                                const ref = rawDto?.reference?.toLowerCase() ?? "";
                                const sourceBadge =
                                  ref.includes("csv") || ref.includes("import")
                                    ? "Imported"
                                    : ref.includes("alert")
                                    ? "From alert"
                                    : null;

                                if (!sourceBadge) return null;
                                return (
                                  <>
                                    <span>•</span>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase bg-slate-100 text-slate-600">
                                      {sourceBadge}
                                    </span>
                                  </>
                                );
                              })()}
                            </p>
                          </div>
                        </Link>

                        {/* Amount & Hover Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Link to={`/transactions/${tx.id}`} className="text-right">
                            <p
                              className={cn(
                                "text-xs sm:text-sm font-black tracking-tight",
                                isIncome ? "text-emerald-600" : "text-slate-900",
                              )}
                            >
                              {isIncome ? "+" : ""}
                              {renderAmount(tx.amount, userCurrency)}
                            </p>
                          </Link>

                          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                            <button
                              type="button"
                              onClick={() => setEditingTransaction(rawDto)}
                              className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTransaction(tx)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </SwipeReveal>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Edit Dialog */}
      {editingTransaction && (
        <TransactionDialog
          open={!!editingTransaction}
          onOpenChange={(open) => {
            if (!open) setEditingTransaction(null);
          }}
          transaction={editingTransaction}
          onSaved={() => {
            setEditingTransaction(null);
            void loadData();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDestructiveDialog
        open={!!deletingTransaction}
        onOpenChange={(open) => {
          if (!open) setDeletingTransaction(null);
        }}
        title="Delete transaction?"
        description={`This will remove "${deletingTransaction?.description || "this transaction"}" and update your account balance.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
