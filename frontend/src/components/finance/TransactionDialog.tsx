// Transaction edit dialog.
//
// Opened from the transaction list or account-detail page when the user
// clicks the pencil icon on a row.  Pre-fills the form from the passed
// TransactionDto and calls PATCH /api/transactions/:id on submit.
// Invalidates "transactions", "accounts", and "summary" on success so
// downstream views reflect the change without a manual refresh.
//
// Only edit mode is supported — the create flow lives on the dedicated
// /transactions/add route.

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { usePopup } from "@/components/ui/popup";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ApiError,
  accounts as accountsApi,
  categories as categoriesApi,
  transactions as transactionsApi,
  type AccountDto,
  type CategoryDto,
  type TransactionDto,
  type CreateTransactionInput,
} from "@/lib/api";
import { DEFAULT_CURRENCY, resolveCurrency } from "@/lib/currencies";
import type { Account, Category } from "@/lib/finance";
import { parseAmountInput } from "@/lib/finance";
import { useMe } from "@/hooks/use-me";

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

type TransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: TransactionDto | null;
  onSaved: () => void;
};

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  onSaved,
}: TransactionDialogProps) {
  const popup = usePopup();
  const isEditMode = Boolean(transaction);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense" | "transfer">("expense");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!open) return;
    accountsApi.listAccounts().then((dtos) => setAccounts(dtos.map(toAccount))).catch(() => {});
    categoriesApi.listCategories().then((dtos) => setCategories(dtos.map(toCategory))).catch(() => {});
  }, [open]);

  const userQuery = useMe();
  const userCurrency = userQuery.data?.currency ?? DEFAULT_CURRENCY;
  const amountSymbol = resolveCurrency(userCurrency)?.symbol ?? userCurrency;

  const amountParse = useMemo(() => parseAmountInput(amount), [amount]);

  useEffect(() => {
    if (!open) return;
    if (transaction) {
      setAmount(
        String(typeof transaction.amount === "string" ? parseFloat(transaction.amount) : transaction.amount),
      );
      setType(transaction.type);
      setAccountId(String(transaction.account_id));
      setToAccountId(transaction.to_account_id ? String(transaction.to_account_id) : "");
      setCategoryId(transaction.category_id ? String(transaction.category_id) : "");
      setDescription(transaction.description ?? "");
      setDate(transaction.transaction_date.split(" ")[0] || transaction.transaction_date);
    } else {
      setAmount("");
      setType("expense");
      setAccountId("");
      setToAccountId("");
      setCategoryId("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
    }
    setError(null);
  }, [open, transaction]);

  useEffect(() => {
    if (type === "transfer") {
      setCategoryId("");
      return;
    }
    if (!categoryId) return;
    const stillValid = categories.some((c) => String(c.id) === categoryId && c.type === type);
    if (!stillValid) setCategoryId("");
  }, [type, categoryId, categories]);

  // PATCH /api/transactions/:id.  Invalidates the three query keys the
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!accountId) {
      setError("Please select an account.");
      return;
    }
    const numericAmount = amountParse.numeric;
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }
    if (type === "transfer" && (!toAccountId || toAccountId === accountId)) {
      setError("Pick a different destination account for the transfer.");
      return;
    }
    setError(null);

    const payload: Partial<CreateTransactionInput> = {
      account_id: Number(accountId),
      type,
      amount: numericAmount,
      description: description.trim() ? description.trim().slice(0, 255) : undefined,
      transaction_date: date,
    };
    if (type === "transfer" && toAccountId) {
      payload.to_account_id = Number(toAccountId);
    } else if (type !== "transfer" && categoryId) {
      payload.category_id = Number(categoryId);
    }

    setIsSubmitting(true);
    try {
      await transactionsApi.updateTransaction(transaction!.id, payload);
      popup.success("Transaction updated");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to update the transaction. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = "Edit transaction";
  const descriptionText = "Update the details for this transaction.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md rounded-2xl border-0 p-0 gap-0 bg-white"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{descriptionText}</DialogDescription>
        <form onSubmit={handleSubmit} className="p-7 space-y-5 max-h-[85vh] overflow-y-auto">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {title}
            </p>
            <p className="text-sm text-slate-500">{descriptionText}</p>
          </div>

          {error && (
            <p
              role="alert"
              className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2"
            >
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Amount ({amountSymbol})
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              autoFocus
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none text-sm font-bold text-slate-800 focus:border-indigo-300"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
            />
            {amountParse.isExpression && amountParse.projected !== null && (
              <p className="text-[11px] font-semibold text-slate-500 ml-1" aria-live="polite">
                {amountSymbol}
                {amountParse.projected.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </p>
            )}
            {amountParse.isExpression && amountParse.projected === null && (
              <p className="text-[11px] font-semibold text-red-600 ml-1" role="status" aria-live="polite">
                Check your amount — use numbers separated by +
              </p>
            )}
          </div>

          <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
            {(["expense", "income", "transfer"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                disabled={isSubmitting}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all",
                  type === t
                    ? t === "income"
                      ? "bg-green-500 text-white shadow"
                      : t === "expense"
                        ? "bg-red-500 text-white shadow"
                        : "bg-blue-600 text-white shadow"
                    : "text-slate-400",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              {type === "transfer" ? "From Account" : "Account"}
            </label>
            <div className="relative">
              <select
                className="w-full p-4 appearance-none rounded-2xl bg-slate-50 border border-slate-100 outline-none text-sm font-bold text-slate-800"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={isSubmitting}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={18}
              />
            </div>
          </div>

          {type === "transfer" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">
                To Account
              </label>
              <div className="relative">
                <select
                  className="w-full p-4 appearance-none rounded-2xl bg-blue-50/50 border border-blue-100 outline-none text-sm font-bold text-blue-900"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">Select Destination</option>
                  {accounts
                    .filter((a) => String(a.id) !== accountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none"
                  size={18}
                />
              </div>
            </div>
          )}

          {type !== "transfer" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Category
              </label>
              <div className="relative">
                <select
                  className="w-full p-4 appearance-none rounded-2xl bg-slate-50 border border-slate-100 outline-none text-sm font-bold text-slate-800"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">Uncategorized</option>
                  {categories
                    .filter((c) => c.type === type)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={18}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Description
            </label>
            <input
              type="text"
              maxLength={255}
              placeholder="Optional"
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:border-indigo-300"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Date
            </label>
            <input
              type="date"
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none text-sm font-bold text-slate-800 focus:border-indigo-300"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 premium-gradient text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
