import { useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Check, ChevronDown, CloudOff, Plus, Wallet } from "lucide-react";
import { usePopup } from "@/components/ui/popup";
import { cn } from "@/lib/utils";
import { AccountDialog } from "@/components/finance/AccountDialog";
import { CategoryDialog } from "@/components/finance/CategoryDialog";
import {
  ApiError,
  accounts as accountsApi,
  categories as categoriesApi,
  transactions as transactionsApi,
  type AccountDto,
  type CategoryDto,
  type CreateTransactionInput,
} from "@/lib/api";
import { DEFAULT_CURRENCY, resolveCurrency } from "@/lib/currencies";
import type { Account, Category } from "@/lib/finance";
import { formatCurrency, parseAmountInput } from "@/lib/finance";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { useMe } from "@/hooks/use-me";
import { useOfflineSync } from "@/hooks/use-offline-sync";

function toAccount(dto: AccountDto): Account {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
    balance: Number(dto.balance ?? dto.starting_balance ?? 0),
  };
}

function toCategory(dto: CategoryDto): Category {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type === "income" ? "income" : "expense",
  };
}

export function TransactionsAdd() {
  const navigate = useNavigate();
  const popup = usePopup();
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense" | "transfer">("expense");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  useEffect(() => {
    document.title = "Add Transaction — Pasona";
  }, []);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFormData = async () => {
    setLoading(true);
    try {
      const [accRes, catRes] = await Promise.all([
        accountsApi.listAccounts(),
        categoriesApi.listCategories(),
      ]);
      setAccounts(accRes.map(toAccount));
      setCategories(catRes.map(toCategory));
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFormData();
  }, []);

  const { isOnline, enqueue } = useOfflineSync();
  const userQuery = useMe();
  const userCurrency = userQuery.data?.currency ?? DEFAULT_CURRENCY;
  const { renderAmount } = usePrivacyMode();

  const amountParse = useMemo(() => parseAmountInput(amount), [amount]);
  const amountSymbol = resolveCurrency(userCurrency)?.symbol ?? userCurrency;

  useEffect(() => {
    if (accountId) return;
    const first = accounts[0];
    if (first) setAccountId(String(first.id));
  }, [accounts, accountId]);

  useEffect(() => {
    if (type === "transfer") {
      setCategoryId("");
      return;
    }
    if (!categoryId) return;
    const stillValid = categories.some((c) => String(c.id) === categoryId && c.type === type);
    if (!stillValid) setCategoryId("");
  }, [type, categoryId, categories]);

  const handleAccountCreated = (newAccount: Account) => {
    setAccounts((prev) => [...prev, newAccount]);
    setAccountId(String(newAccount.id));
  };

  const handleCategoryCreated = (newCategory: Category) => {
    setCategories((prev) => [...prev, newCategory]);
    setCategoryId(String(newCategory.id));
  };

  const submitTransaction = async (force: boolean = false) => {
    if (submitting) return;

    if (!accountId) {
      setError("Please select an account.");
      return;
    }
    const numericAmount = amountParse.numeric;
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }
    if (numericAmount > 1_000_000_000) {
      setError("Amount is too large.");
      return;
    }
    if (type === "transfer" && (!toAccountId || toAccountId === accountId)) {
      setError("Pick a different destination account for the transfer.");
      return;
    }

    setError(null);
    setSubmitting(true);

    const payload: CreateTransactionInput = {
      account_id: Number(accountId),
      type,
      amount: numericAmount,
      description: description.trim() ? description.trim().slice(0, 255) : undefined,
      transaction_date: date,
      force,
    };
    if (type === "transfer" && toAccountId) {
      payload.to_account_id = Number(toAccountId);
    } else if (type !== "transfer" && categoryId) {
      payload.category_id = Number(categoryId);
    }

    try {
      if (isOnline) {
        await transactionsApi.createTransaction(payload);
        void loadFormData();
        popup.success("Transaction saved", { duration: 2000 });
      } else {
        await enqueue(payload);
        popup.success("Saved offline. We'll sync it when you're back online.", { duration: 2000 });
      }
      // Retain selected options (type, accountId, toAccountId, categoryId, date)
      // and reset transaction-specific input fields for fast consecutive recording
      setAmount("");
      setDescription("");
      setDuplicateWarning(false);
    } catch (err) {
      if (isOnline && err instanceof ApiError && err.status === 409 && !force) {
        setDuplicateWarning(true);
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to save transaction. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitTransaction(false);
  };

  const confirmDuplicate = () => {
    void submitTransaction(true);
  };

  const handleBack = () => {
    void navigate(-1);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-white border-b border-slate-100 px-6 pt-10 pb-6 sticky top-0 z-30 card-shadow">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">New Transaction</h1>
            <p className="text-xs text-slate-400 font-medium">Record an income, expense, or transfer</p>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-lg mx-auto">
        {!isOnline && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-center gap-2 font-medium">
            <CloudOff size={16} className="text-amber-600 shrink-0" />
            <span>You're offline. This transaction will be saved locally and synced automatically.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {duplicateWarning && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertCircle size={16} className="text-amber-600" />
              <span>Possible Duplicate Transaction</span>
            </div>
            <p className="text-slate-600">
              A transaction with the same amount and description was recorded recently. Are you sure you want to add it again?
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={confirmDuplicate}
                disabled={submitting}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold text-xs hover:bg-amber-700 transition-colors"
              >
                {submitting ? "Saving..." : "Add Anyway"}
              </button>
              <button
                type="button"
                onClick={() => setDuplicateWarning(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex bg-slate-200/60 p-1.5 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-black transition-all",
                type === "expense"
                  ? "bg-white text-slate-900 card-shadow"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-black transition-all",
                type === "income"
                  ? "bg-white text-green-600 card-shadow"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType("transfer")}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-black transition-all",
                type === "transfer"
                  ? "bg-white text-blue-600 card-shadow"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              Transfer
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl card-shadow border border-slate-50 text-center space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Amount ({amountSymbol})
            </label>
            <div className="relative inline-block w-full">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={cn(
                  "w-full text-center font-black text-slate-900 placeholder:text-slate-200 bg-transparent outline-none tracking-tight transition-all",
                  amount.length > 11
                    ? "text-2xl sm:text-3xl"
                    : amount.length > 7
                      ? "text-3xl sm:text-4xl"
                      : "text-4xl sm:text-5xl",
                )}
                autoFocus
              />
            </div>
            {amountParse.isExpression && (
              <p className="text-xs font-bold text-blue-600">
                = {renderAmount(amountParse.projected ?? 0, userCurrency)}
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl card-shadow border border-slate-50 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {type === "transfer" ? "From Account" : "Account"}
                </label>
                <button
                  type="button"
                  onClick={() => setAccountDialogOpen(true)}
                  className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> New Account
                </button>
              </div>
              <div className="relative">
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 appearance-none outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Select account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({renderAmount(acc.balance, userCurrency)})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            {type === "transfer" && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                  To Account
                </label>
                <div className="relative">
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 appearance-none outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select destination account</option>
                    {accounts
                      .filter((acc) => String(acc.id) !== accountId)
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({renderAmount(acc.balance, userCurrency)})
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
            )}

            {type !== "transfer" && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setCategoryDialogOpen(true)}
                    className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> New Category
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 appearance-none outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Uncategorized</option>
                    {categories
                      .filter((cat) => cat.type === type)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Lunch at KFC, Salary bonus"
                className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-sm tracking-wide shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check size={20} strokeWidth={2.5} />
            {submitting ? "Saving Transaction…" : "Save Transaction"}
          </button>
        </form>
      </main>

      <AccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        onSaved={handleAccountCreated}
      />
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        defaultType={type === "income" ? "income" : "expense"}
        onSaved={handleCategoryCreated}
      />
    </div>
  );
}
