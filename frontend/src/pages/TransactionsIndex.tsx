import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePopup } from "@/components/ui/popup";
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
import { TransactionsSkeleton } from "@/components/finance/Skeletons";
import { SwipeReveal } from "@/components/finance/SwipeReveal";
import { useMe } from "@/hooks/use-me";
import { useOnline } from "@/hooks/use-online";
import { fadeSlideDown, fadeSlideUp } from "@/lib/animations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    const key = t.transaction_date.split(" ")[0];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  return Array.from(groups.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

export function TransactionsIndex() {
  const [txDtos, setTxDtos] = useState<TransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);

  useEffect(() => {
    document.title = "History — Pasona";
  }, []);

  const userQuery = useMe();
  const userCurrency = userQuery.data?.currency ?? DEFAULT_CURRENCY;
  const isOnline = useOnline();
  const popup = usePopup();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await transactionsApi.listTransactions({ per_page: 100 });
      setTxDtos(res.data ?? []);
    } catch (err) {
      if (err instanceof ApiError) setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

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

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  const confirmDelete = async () => {
    if (!deletingTransaction) return;
    setIsDeleting(true);
    try {
      await transactionsApi.deleteTransaction(deletingTransaction.id);
      popup.success("Transaction deleted");
      setDeletingTransaction(null);
      void loadData();
    } catch (err) {
      popup.error(
        err instanceof ApiError
          ? err.message
          : "Unable to delete transaction. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Top Header & Page Hero Card Section */}
      <motion.header
        variants={fadeSlideDown}
        initial="hidden"
        animate="visible"
        className="px-6 pt-8 pb-10 bg-gradient-to-b from-[#0b1434] via-[#101b45] to-[#162356] text-white border-b border-white/10 shadow-xl shadow-navy-950/20"
      >
        <div className="max-w-5xl mx-auto">
          {/* Top Header Bar: Avatar with Online Dot (left), Title (center), Notifications & Search (right) */}
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

            <h1 className="text-lg font-extrabold tracking-tight">History</h1>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSearchInput((prev) => !prev);
                  if (showSearchInput) setSearch("");
                }}
                className={cn(
                  "w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors",
                  (showSearchInput || search) && "bg-white text-indigo-950 font-bold",
                )}
                aria-label="Toggle Search"
              >
                <Search size={18} />
              </button>
              <Link
                to="/transactions/add"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label="Add Transaction"
              >
                <Plus size={20} />
              </Link>
            </div>
          </div>

          {/* Page Hero Card: Net Cashflow for Selected Filter */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3 shadow-inner"
          >
            <div className="flex justify-between items-center gap-2">
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider shrink-0">Net Cashflow</p>
              <div className="flex gap-2">
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  +{formatCurrency(totals.income, userCurrency)}
                </span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full">
                  -{formatCurrency(totals.expense, userCurrency)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-white truncate">
                {formatCurrency(totals.net, userCurrency)}
              </h2>
              <div className="flex items-center gap-1.5 text-xs font-bold text-white/70 pt-1">
                <span>{filtered.length} transactions in this view</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 space-y-6 pt-4 w-full">
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

        {/* Minimal Segmented Filter Tabs */}
        <div className="flex bg-slate-200/50 p-1 rounded-xl gap-1 border border-slate-200/40">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-black transition-all text-center select-none",
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Sleek Summary Strip */}
        <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between text-xs font-bold text-slate-500 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-400 font-medium">In:</span>
            <span className="text-slate-900 font-extrabold tabular-nums">+{formatCompactCurrency(totals.income, userCurrency)}</span>
          </div>
          <div className="h-3 w-px bg-slate-200 shrink-0 mx-1" />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="text-slate-400 font-medium">Out:</span>
            <span className="text-slate-900 font-extrabold tabular-nums">-{formatCompactCurrency(totals.expense, userCurrency)}</span>
          </div>
          <div className="h-3 w-px bg-slate-200 shrink-0 mx-1" />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400 font-medium">Net:</span>
            <span className={cn("font-extrabold tabular-nums", totals.net >= 0 ? "text-indigo-600" : "text-rose-600")}>
              {formatCompactCurrency(totals.net, userCurrency)}
            </span>
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
              {/* Date Separator Header */}
              <div className="px-1 pt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>{formatDateHeader(day)}</span>
                <span className="font-semibold text-slate-300">{items.length}</span>
              </div>

              {/* Transactions Card List */}
              <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden divide-y divide-slate-100">
                {items.map((tx) => {
                  const rawDto = txDtos.find((d) => d.id === tx.id) ?? null;
                  const isIncome = tx.type === "income";
                  const isExpense = tx.type === "expense";

                  return (
                    <SwipeReveal
                      key={tx.id}
                      onEdit={() => setEditingTransaction(rawDto)}
                      onDelete={() => setDeletingTransaction(tx)}
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
                              {isIncome ? "+" : isExpense ? "-" : ""}
                              {formatCurrency(tx.amount, userCurrency)}
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
      <AlertDialog
        open={!!deletingTransaction}
        onOpenChange={(open) => {
          if (!open) setDeletingTransaction(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black text-rose-600">Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              This will remove "{deletingTransaction?.description || "this transaction"}" and update your account balance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-end">
            <AlertDialogCancel className="rounded-xl text-xs font-bold border-slate-200 mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white border-0"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
