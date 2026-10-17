import React, { useState } from "react";
import { X } from "lucide-react";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import type { GoalDto, AccountDto } from "@/lib/api";

interface AddToGoalDialogProps {
  goal: GoalDto | null;
  accounts: AccountDto[];
  currency: string;
  onClose: () => void;
  onSubmit: (goalId: number, amount: number, accountId: number) => Promise<void>;
}

export function AddToGoalDialog({ goal, accounts, currency, onClose, onSubmit }: AddToGoalDialogProps) {
  const { renderAmount } = usePrivacyMode();
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState<string>(() => (accounts.length ? String(accounts[0].id) : ""));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(amt) || amt <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!accountId) {
      setError("Please select an account.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(goal.id, amt, Number(accountId));
      onClose();
    } catch (err: any) {
      setError(err?.message || "Could not record contribution");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-t-[14px] sm:rounded-[12px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-[var(--line)]">
          <h3 className="font-display font-medium text-base sm:text-lg text-[var(--ink)]">
            Add to {goal.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] border border-[var(--line)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-2.5 bg-[var(--neg-soft)] text-[var(--neg)] rounded-[4px] text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Goal snippet */}
          <div className="p-3 rounded-[6px] border border-[var(--line)] bg-[var(--bg)]/50">
            <b className="block text-xs font-bold text-[var(--ink)]">{goal.name}</b>
            <span className="block text-xs text-[var(--muted)] mt-0.5">
              {renderAmount(goal.saved_amount, currency)} of {renderAmount(goal.target_amount, currency)} (
              {goal.percent ?? 0}%)
            </span>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
              Amount to save
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[4px] text-lg font-bold text-[var(--ink)]">
              <span className="text-[var(--muted)] font-display">₦</span>
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent border-0 outline-none tabular-nums font-display font-semibold"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
              Take it from
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
              {submitting ? "Adding…" : "Add money"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
