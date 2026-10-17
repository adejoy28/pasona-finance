import React, { useState } from "react";
import { X } from "lucide-react";
import type { AccountDto, CategoryDto } from "@/lib/api";

interface NewRecurringBillDialogProps {
  open: boolean;
  onClose: () => void;
  accounts: AccountDto[];
  categories: CategoryDto[];
  onSubmit: (input: {
    name: string;
    amount: number;
    type: "expense" | "income";
    account_id: number;
    category_id?: number | null;
    frequency: "weekly" | "monthly" | "yearly";
    next_due: string;
  }) => Promise<void>;
}

export function NewRecurringBillDialog({
  open,
  onClose,
  accounts,
  categories,
  onSubmit,
}: NewRecurringBillDialogProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [accountId, setAccountId] = useState<string>(() => (accounts.length ? String(accounts[0].id) : ""));
  const [categoryId, setCategoryId] = useState<string>("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [nextDue, setNextDue] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(amount.replace(/,/g, ""));
    if (!name.trim()) {
      setError("Please give the item a name.");
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!accountId) {
      setError("Please select an account.");
      return;
    }
    if (!nextDue) {
      setError("Please select the next due date.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        amount: amt,
        type,
        account_id: Number(accountId),
        category_id: categoryId ? Number(categoryId) : null,
        frequency,
        next_due: nextDue,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Could not save recurring item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-t-[14px] sm:rounded-[12px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-[var(--line)]">
          <h3 className="font-display font-medium text-base sm:text-lg text-[var(--ink)]">
            New recurring item
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] border border-[var(--line)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {error && (
            <div className="p-2.5 bg-[var(--neg-soft)] text-[var(--neg)] rounded-[4px] text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
              Name
            </label>
            <input
              type="text"
              placeholder="e.g. House rent or Salary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-[var(--bg)] border border-[var(--line)] rounded-[4px] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Amount
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-[var(--bg)] border border-[var(--line)] rounded-[4px] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "expense" | "income")}
                className="w-full px-3 py-2 text-xs font-bold bg-[var(--bg)] border border-[var(--line)] rounded-[4px] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-[var(--bg)] border border-[var(--line)] rounded-[4px] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-[var(--bg)] border border-[var(--line)] rounded-[4px] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="">None</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Next due
              </label>
              <input
                type="date"
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-[var(--bg)] border border-[var(--line)] rounded-[4px] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Repeats
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as "weekly" | "monthly" | "yearly")}
                className="w-full px-3 py-2 text-xs font-bold bg-[var(--bg)] border border-[var(--line)] rounded-[4px] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[4px] border border-[var(--line)] text-xs font-bold text-[var(--ink)] hover:bg-[var(--chip)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-[4px] bg-[var(--primary)] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save recurring"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
