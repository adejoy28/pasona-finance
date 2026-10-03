import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePopup } from "@/components/ui/popup";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Building2,
  Check,
  ChevronRight,
  CreditCard,
  Filter,
  Info,
  Pencil,
  ReceiptText,
  RefreshCw,
  Search,
  Smartphone,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useLocalMeta } from "@/hooks/use-local-meta";
import { useUndoToast } from "@/hooks/use-undo-toast";
import { TransactionDialog } from "@/components/finance/TransactionDialog";
import { AccountDialog } from "@/components/finance/AccountDialog";
import { AccountCardSkeleton, TransactionsSkeleton } from "@/components/finance/Skeletons";
import { SwipeReveal } from "@/components/finance/SwipeReveal";
import { cn } from "@/lib/utils";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { formatCurrency, type Account, type Transaction } from "@/lib/finance";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
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
import {
  ApiError,
  accounts as accountsApi,
  transactions as transactionsApi,
  type AccountDto,
  type TransactionDto,
} from "@/lib/api";
import { useMe } from "@/hooks/use-me";
import { fadeSlideUp, staggerContainer, staggerItem } from "@/lib/animations";

type Filter = "all" | "income" | "expense" | "transfer";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "income", label: "Income" },
  { id: "expense", label: "Expense" },
  { id: "transfer", label: "Transfer" },
];

function getTypeIcon(type: Account["type"]) {
  if (type === "bank") return <CreditCard className="text-blue-600" />;
  if (type === "mobile") return <Smartphone className="text-purple-600" />;
  return <Wallet className="text-amber-600" />;
}

function getTxIcon(type: Transaction["type"]) {
  if (type === "income") return <ArrowDownLeft size={18} />;
  if (type === "expense") return <ArrowUpRight size={18} />;
  return <ArrowRightLeft size={18} />;
}

function formatDayLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
}

function toAccount(dto: AccountDto): Account {
  const balanceValue = dto.balance ?? dto.starting_balance ?? 0;
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
    balance: typeof balanceValue === "string" ? parseFloat(balanceValue) : Number(balanceValue),
  };
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
    const key = t.transaction_date;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  return Array.from(groups.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

export function AccountDetail() {
  const { accountId: rawAccountId } = useParams();
  const accountId = Number(rawAccountId);
  const navigate = useNavigate();
  const popup = usePopup();
  const { renderAmount } = usePrivacyMode();

  useEffect(() => {
    document.title = "Account — Pasona";
  }, []);

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<TransactionDto | null>(null);

  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const userQuery = useMe();
  const userCurrency = userQuery.data?.currency ?? DEFAULT_CURRENCY;

  const [accountDto, setAccountDto] = useState<AccountDto | null>(null);
  const [txDtos, setTxDtos] = useState<TransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryError, setQueryError] = useState<ApiError | null>(null);

  const loadData = async () => {
    if (!Number.isFinite(accountId) || accountId <= 0) return;
    setLoading(true);
    try {
      const [accRes, txRes] = await Promise.all([
        accountsApi.getAccount(accountId),
        transactionsApi.listTransactions({ account_id: accountId, per_page: 200 }),
      ]);
      setAccountDto(accRes);
      setTxDtos(txRes.data ?? []);
    } catch (err) {
      if (err instanceof ApiError) setQueryError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [accountId]);

  const account: Account | undefined = accountDto ? toAccount(accountDto) : undefined;
  const transactions: Transaction[] = txDtos.map(toTransaction);

  const accountStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === "income") income += t.amount;
      else if (t.type === "expense") expense += t.amount;
      else if (t.type === "transfer") {
        if (t.toAccount?.name === account?.name) income += t.amount;
        else expense += t.amount;
      }
    }
    return { income, expense, entries: transactions.length };
  }, [transactions, account]);

  interface CheckMeta {
    iso: string;
    diff: number;
    ok: boolean;
  }

  const [checkState, setCheckState, clearCheckState] = useLocalMeta<CheckMeta>(
    "account_check",
    account?.id
  );
  const { showUndo } = useUndoToast();

  const [isReconOpen, setIsReconOpen] = useState(false);
  const [reconInput, setReconInput] = useState("");
  const [reconResult, setReconResult] = useState<{ done: boolean; diff: number; ok: boolean } | null>(null);

  const handleCompare = () => {
    const val = parseFloat(reconInput.replace(/,/g, ""));
    if (Number.isNaN(val)) return;
    const diff = Math.round((val - (account?.balance ?? 0)) * 100) / 100;
    const ok = Math.abs(diff) < 0.005;
    const todayStr = new Date().toISOString().slice(0, 10);
    setCheckState({ iso: todayStr, diff, ok });
    setReconResult({ done: true, diff, ok });
  };

  const handleRecordAdjustment = async () => {
    if (!reconResult || !account) return;
    const ad = reconResult.diff;
    const todayStr = new Date().toISOString().slice(0, 10);
    try {
      const created = await transactionsApi.createTransaction({
        account_id: account.id,
        type: ad > 0 ? "income" : "expense",
        amount: Math.abs(ad),
        description: "Balance adjustment",
        transaction_date: todayStr,
      });
      setCheckState({ iso: todayStr, diff: 0, ok: true });
      setIsReconOpen(false);
      void loadData();
      showUndo("Adjustment recorded", async () => {
        try {
          await transactionsApi.deleteTransaction(created.id);
          clearCheckState();
          void loadData();
        } catch (err) {
          console.error("Failed to undo adjustment", err);
        }
      });
    } catch (err) {
      popup.error(err instanceof ApiError ? err.message : "Failed to record adjustment");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (filter !== "all" && t.type !== filter) return false;
      if (q) {
        const haystack = [t.description ?? "", t.category?.name ?? "", t.account?.name ?? ""]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (fromDate && t.transaction_date < fromDate) return false;
      if (toDate && t.transaction_date > toDate) return false;
      return true;
    });
  }, [transactions, filter, search, fromDate, toDate]);

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

  const hasActiveFilters = filter !== "all" || search !== "" || fromDate !== "" || toDate !== "";

  const clearFilters = () => {
    setFilter("all");
    setSearch("");
    setFromDate("");
    setToDate("");
  };

  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deletingTransaction || isDeleting) return;
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

  const openAccountEdit = () => {
    if (!account) return;
    setEditingAccount(account);
    setAccountDialogOpen(true);
  };

  const handleAccountSaved = (_updated: Account) => {
    setAccountDialogOpen(false);
    popup.success("Account updated");
    void loadData();
  };

  const confirmDeleteAccount = async () => {
    if (!accountDto || isDeletingAccount) return;
    setIsDeletingAccount(true);
    try {
      await accountsApi.deleteAccount(accountDto.id);
      popup.success("Account deleted");
      void navigate("/accounts", { replace: true });
    } catch (err) {
      popup.error(
        err instanceof ApiError
          ? err.message
          : "Unable to delete the account. Please try again.",
      );
    } finally {
      setIsDeletingAccount(false);
      setDeletingAccount(false);
    }
  };

  if (!Number.isFinite(accountId) || accountId <= 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
        <AlertTriangle size={36} className="text-amber-500 mb-2" />
        <h2 className="text-base font-bold text-slate-900">Invalid account ID</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">Please select an account from your list.</p>
        <Link
          to="/accounts"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
        >
          <ArrowLeft size={16} /> Back to Accounts
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="sticky top-0 z-40 bg-[#0b1434] pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 px-6 shadow-sm border-b border-white/5 transition-all text-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link
              to="/accounts"
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shrink-0"
              aria-label="Back to accounts"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold text-white tracking-tight truncate">
                {loading && !account ? "Loading..." : account?.name ?? "Account"}
              </h1>
              <p className="text-[11px] text-slate-300 font-medium capitalize truncate">
                {account?.type ?? "Account Details"}
              </p>
            </div>
            {account && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={openAccountEdit}
                  className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
                  aria-label="Edit account"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingAccount(true)}
                  className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-300 flex items-center justify-center hover:bg-rose-500/30 transition-colors shrink-0"
                  aria-label="Delete account"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {loading && !account ? (
            <AccountCardSkeleton />
          ) : account ? (
            <div className="bg-white/10 backdrop-blur-md text-white p-4 rounded-2xl border border-white/15 shadow-inner space-y-3">
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    Available Balance
                  </p>
                  <p className="text-[22px] sm:text-2xl font-bold truncate mt-0.5">{renderAmount(account.balance, userCurrency)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                  <Building2 size={20} />
                </div>
              </div>

              {/* Task 3.1: In / Out / Entries KPI block */}
              <div className="pt-2.5 border-t border-white/10 grid grid-cols-3 gap-2">
                <div className="min-w-0">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-300">In</div>
                  <div className="font-extrabold text-xs sm:text-sm text-emerald-300 tabular-nums truncate">
                    +{renderAmount(accountStats.income, userCurrency)}
                  </div>
                </div>
                <div className="min-w-0 border-l border-white/10 pl-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Out</div>
                  <div className="font-extrabold text-xs sm:text-sm text-white tabular-nums truncate">
                    -{renderAmount(accountStats.expense, userCurrency)}
                  </div>
                </div>
                <div className="min-w-0 border-l border-white/10 pl-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Entries</div>
                  <div className="font-extrabold text-xs sm:text-sm text-white tabular-nums truncate">
                    {accountStats.entries}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Task 3.2: Balance check strip */}
        {account && (
          <button
            type="button"
            onClick={() => {
              setReconInput("");
              setReconResult(null);
              setIsReconOpen(true);
            }}
            className="w-full bg-white rounded-2xl p-3.5 card-shadow border border-slate-100 hover:border-blue-200 transition-all flex items-center gap-3 text-left group cursor-pointer"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                !checkState
                  ? "bg-blue-50 text-blue-600"
                  : checkState.ok
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              )}
            >
              {!checkState ? (
                <Info size={16} />
              ) : checkState.ok ? (
                <Check size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {!checkState
                  ? "Not checked yet"
                  : checkState.ok
                  ? "Matched your bank"
                  : `Off by ${formatCurrency(Math.abs(checkState.diff), userCurrency)}`}
              </p>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                {!checkState
                  ? "Compare with your bank app to catch missing entries"
                  : checkState.ok
                  ? `Checked ${checkState.iso}`
                  : `Checked ${checkState.iso}. Tap to check again`}
              </p>
            </div>
            <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600 shrink-0" />
          </button>
        )}
        {queryError && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold">
            {queryError.message}
          </div>
        )}

        <section className="bg-white p-4 rounded-2xl card-shadow border border-slate-50 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, category..."
              className="w-full bg-slate-50 border-0 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0",
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 min-w-0">
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-slate-50 border-0 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-slate-50 border-0 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium"
              />
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="self-end pb-2 text-[10px] font-bold text-blue-600 hover:underline shrink-0"
              >
                Clear all
              </button>
            )}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <div className="bg-white p-3 rounded-2xl card-shadow border border-slate-50 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Income</p>
            <p className="text-xs sm:text-sm font-black text-green-600 truncate mt-0.5">
              +{renderAmount(totals.income, userCurrency)}
            </p>
          </div>
          <div className="bg-white p-3 rounded-2xl card-shadow border border-slate-50 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Expense</p>
            <p className="text-xs sm:text-sm font-black text-red-600 truncate mt-0.5">
              -{renderAmount(totals.expense, userCurrency)}
            </p>
          </div>
          <div className="bg-white p-3 rounded-2xl card-shadow border border-slate-50 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Net</p>
            <p
              className={cn(
                "text-xs sm:text-sm font-black truncate mt-0.5",
                totals.net >= 0 ? "text-slate-900" : "text-red-600",
              )}
            >
              {renderAmount(totals.net, userCurrency)}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Transactions ({filtered.length})
            </h2>
          </div>

          {loading && transactions.length === 0 && <TransactionsSkeleton />}

          {!loading && filtered.length === 0 && (
            <div className="bg-white p-8 rounded-2xl text-center space-y-3 card-shadow border border-slate-50">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                <ReceiptText size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">No transactions found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {hasActiveFilters
                    ? "Try adjusting your search or filters."
                    : "Transactions linked to this account will show up here."}
                </p>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <Filter size={12} /> Clear filters
                </button>
              )}
            </div>
          )}

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {grouped.map(([day, items]) => (
              <motion.div key={day} variants={staggerItem} className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {formatDayLabel(day)}
                </p>
                <div className="bg-white rounded-2xl card-shadow border border-slate-50 overflow-hidden divide-y divide-slate-50">
                  {items.map((tx) => {
                    const rawDto = txDtos.find((d) => d.id === tx.id) ?? null;
                    return (
                      <SwipeReveal
                        key={tx.id}
                        rightActions={[
                          { label: "Edit", icon: <Pencil size={18} />, onClick: () => setEditingTransaction(rawDto), className: "bg-blue-500 text-white" },
                          { label: "Delete", icon: <Trash2 size={18} />, onClick: () => setDeletingTransaction(tx), className: "bg-red-500 text-white" }
                        ]}
                      >
                        <div className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                                tx.type === "income"
                                  ? "bg-green-50 text-green-600"
                                  : tx.type === "expense"
                                    ? "bg-red-50 text-red-600"
                                    : "bg-blue-50 text-blue-600",
                              )}
                            >
                              {getTxIcon(tx.type)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900 truncate">
                                {tx.description || tx.category?.name || "Transaction"}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 truncate">
                                {tx.type === "transfer"
                                  ? `Transfer to ${tx.toAccount?.name ?? "account"}`
                                  : tx.category?.name ?? "Uncategorized"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <p
                              className={cn(
                                "text-xs sm:text-sm font-black",
                                tx.type === "income"
                                  ? "text-green-600"
                                  : tx.type === "expense"
                                    ? "text-slate-900"
                                    : "text-blue-600",
                              )}
                            >
                              {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                              {renderAmount(tx.amount, userCurrency)}
                            </p>
                            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => setEditingTransaction(rawDto)}
                                className="p-1.5 text-[var(--muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingTransaction(tx)}
                                className="p-1.5 text-[var(--muted)] hover:text-rose-500 transition-colors cursor-pointer"
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
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>

      <TransactionDialog
        open={Boolean(editingTransaction)}
        onOpenChange={(op) => {
          if (!op) setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        onSaved={loadData}
      />

      <AlertDialog
        open={Boolean(deletingTransaction)}
        onOpenChange={(op) => {
          if (!op) setDeletingTransaction(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black">Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              This action cannot be undone. This transaction will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-end">
            <AlertDialogCancel className="rounded-xl text-xs font-bold border-slate-200 mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white border-0"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        account={editingAccount}
        onSaved={handleAccountSaved}
      />

      <AlertDialog
        open={deletingAccount}
        onOpenChange={setDeletingAccount}
      >
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black text-rose-600">
              Delete account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Transactions on this account will not be removed, but the account will no longer
              appear.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-end">
            <AlertDialogCancel className="rounded-xl text-xs font-bold border-slate-200 mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAccount}
              disabled={isDeletingAccount}
              className="rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white border-0"
            >
              {isDeletingAccount ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Task 3.3: Reconciliation Modal */}
      <AnimatePresence>
        {isReconOpen && account && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900">
                  Check {account.name} balance
                </h3>
                <button
                  type="button"
                  onClick={() => setIsReconOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {!reconResult ? (
                /* State A: Input */
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Open your bank or wallet app and type the balance it shows. Pasona compares it with its own number.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Balance in your bank app
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-base font-bold text-slate-400">{userCurrency}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        autoFocus
                        value={reconInput}
                        onChange={(e) => setReconInput(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-transparent text-lg font-bold text-slate-900 outline-none tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsReconOpen(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCompare}
                      disabled={!reconInput.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Compare
                    </button>
                  </div>
                </div>
              ) : reconResult.ok ? (
                /* State B1: Match */
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-800">
                    <Check size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-sm">Balances match</p>
                      <p className="text-emerald-700">Your history agrees with your bank. Nothing to fix.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReconOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* State B2: Difference */
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 text-amber-900">
                    <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-sm">
                        Off by {formatCurrency(Math.abs(reconResult.diff), userCurrency)}
                      </p>
                      <p className="text-amber-700 leading-relaxed">
                        {reconResult.diff > 0
                          ? "Pasona is lower than your bank. Likely a missing income, or an expense counted twice."
                          : "Pasona is higher than your bank. Likely a missing expense, or an income counted twice."}
                      </p>
                    </div>
                  </div>

                  {/* Matching transactions if any */}
                  {(() => {
                    const diffAbs = Math.abs(reconResult.diff);
                    const matching = transactions.filter(
                      (t) => Math.abs(t.amount - diffAbs) < 0.005
                    );
                    if (matching.length === 0) return null;

                    return (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Entries of exactly {formatCurrency(diffAbs, userCurrency)} on this account
                        </p>
                        <div className="bg-slate-50 rounded-xl divide-y divide-slate-100 border border-slate-100 overflow-hidden">
                          {matching.map((m) => (
                            <div key={m.id} className="p-2.5 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-slate-800">{m.description || "Transaction"}</p>
                                <p className="text-[10px] text-slate-400">{m.transaction_date}</p>
                              </div>
                              <span className="font-bold tabular-nums text-slate-900">
                                {formatCurrency(m.amount, userCurrency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Action Suggestions */}
                  <div className="space-y-2 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Try these</p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsReconOpen(false);
                        const type = reconResult.diff > 0 ? "income" : "expense";
                        navigate(
                          `/transactions/add?amount=${Math.abs(reconResult.diff)}&type=${type}&account_id=${account.id}`
                        );
                      }}
                      className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-colors flex items-center justify-between text-left group cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                          Add the missing entry
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Starts a {reconResult.diff > 0 ? "income" : "expense"} of{" "}
                          {formatCurrency(Math.abs(reconResult.diff), userCurrency)}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600" />
                    </button>

                    <button
                      type="button"
                      onClick={handleRecordAdjustment}
                      className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-colors flex items-center justify-between text-left group cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                          Record a balance adjustment
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Creates an adjustment entry so your numbers match
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setReconResult(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Check again
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReconOpen(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
