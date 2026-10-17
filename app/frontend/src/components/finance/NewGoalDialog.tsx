import React, { useState } from "react";
import { X } from "lucide-react";
import type { AccountDto } from "@/lib/api";

const GOAL_SWATCHES = [
  "#2a78d6", // c1 blue
  "#eb6834", // c2 orange
  "#1baf7a", // c3 emerald
  "#eda100", // c4 amber
  "#e87ba4", // c5 pink
  "#008300", // c6 green
  "#4a3aa7", // c7 purple
];

interface NewGoalDialogProps {
  open: boolean;
  onClose: () => void;
  accounts: AccountDto[];
  onSubmit: (input: {
    name: string;
    target_amount: number;
    target_date: string;
    account_id?: number | null;
    color?: string | null;
  }) => Promise<void>;
}

export function NewGoalDialog({ open, onClose, accounts, onSubmit }: NewGoalDialogProps) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().slice(0, 10);
  });
  const [accountId, setAccountId] = useState<string>("");
  const [color, setColor] = useState(GOAL_SWATCHES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(targetAmount.replace(/,/g, ""));
    if (!name.trim()) {
      setError("Please give the goal a name.");
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setError("Enter a target amount greater than zero.");
      return;
    }
    if (!targetDate) {
      setError("Please select a target date.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        target_amount: amt,
        target_date: targetDate,
        account_id: accountId ? Number(accountId) : null,
        color,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Could not create goal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-t-[14px] sm:rounded-[12px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-[var(--line)]">
          <h3 className="font-display font-medium text-base sm:text-lg text-[var(--ink)]">New goal</h3>
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
              What are you saving for?
            </label>
            <input
              type="text"
              placeholder="e.g. New phone"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-[var(--bg)] border border-[var(--line)] rounded-[4px] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Target amount
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder="0"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-[var(--bg)] border border-[var(--line)] rounded-[4px] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Target date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-[var(--bg)] border border-[var(--line)] rounded-[4px] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
              Dedicated account (optional)
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-[var(--bg)] border border-[var(--line)] rounded-[4px] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="">Any account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">
              Goal color
            </label>
            <div className="flex gap-2 flex-wrap">
              {GOAL_SWATCHES.map((sw) => (
                <button
                  key={sw}
                  type="button"
                  onClick={() => setColor(sw)}
                  className={`w-7 h-7 rounded-[6px] border-2 transition-transform ${
                    color === sw ? "border-[var(--ink)] scale-110 shadow-xs" : "border-transparent"
                  }`}
                  style={{ backgroundColor: sw }}
                  aria-label={`Select color ${sw}`}
                />
              ))}
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
              {submitting ? "Creating…" : "Create goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
