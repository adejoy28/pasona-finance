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
  CreditCard,
  Filter,
  Pencil,
  ReceiptText,
  Search,
  Smartphone,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { TransactionDialog } from "@/components/finance/TransactionDialog";
import { AccountDialog } from "@/components/finance/AccountDialog";
import { AccountCardSkeleton, TransactionsSkeleton } from "@/components/finance/Skeletons";
import { SwipeReveal } from "@/components/finance/SwipeReveal";
import { cn } from "@/lib/utils";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { formatCurrency, type Account, type Transaction } from "@/lib/finance";
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
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-white border-b border-slate-100 px-6 pt-6 pb-6 sticky top-0 z-30 card-shadow">
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/accounts"
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
            aria-label="Back to accounts"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-900 tracking-tight truncate">
              {loading && !account ? "Loading..." : account?.name ?? "Account"}
            </h1>
            <p className="text-xs text-slate-400 font-medium capitalize">
              {account?.type ?? "Account Details"}
            </p>
          </div>
          {account && (
            <>
              <button
                type="button"
                onClick={openAccountEdit}
                className="w-9 h-9 rounded-xl bg-[var(--navy-900)] text-white flex items-center justify-center hover:bg-[var(--navy-800)] transition-colors shrink-0"
                aria-label="Edit account"
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => setDeletingAccount(true)}
                className="w-9 h-9 rounded-xl bg-white border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-50 transition-colors shrink-0"
                aria-label="Delete account"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>

        {loading && !account ? (
          <AccountCardSkeleton />
        ) : account ? (
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex justify-between items-center shadow-lg shadow-slate-200">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Available Balance
              </p>
              <p className="text-2xl font-black truncate">{formatCurrency(account.balance, userCurrency)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
              {getTypeIcon(account.type)}
            </div>
          </div>
        ) : null}
      </header>

      <main className="p-6 space-y-6">
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
              +{formatCurrency(totals.income, userCurrency)}
            </p>
          </div>
          <div className="bg-white p-3 rounded-2xl card-shadow border border-slate-50 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Expense</p>
            <p className="text-xs sm:text-sm font-black text-red-600 truncate mt-0.5">
              -{formatCurrency(totals.expense, userCurrency)}
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
              {formatCurrency(totals.net, userCurrency)}
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
                        onEdit={() => setEditingTransaction(rawDto)}
                        onDelete={() => setDeletingTransaction(tx)}
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
                              {formatCurrency(tx.amount, userCurrency)}
                            </p>
                            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => setEditingTransaction(rawDto)}
                                className="p-1.5 text-slate-300 hover:text-blue-600 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingTransaction(tx)}
                                className="p-1.5 text-slate-300 hover:text-red-600 transition-colors"
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
    </div>
  );
}
