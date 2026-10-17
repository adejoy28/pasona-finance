import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { getCurrencySymbol } from "@/lib/currencies";
import type { BudgetCategoryItemDto } from "@/lib/api";

interface EditCategoryLimitDialogProps {
  category: BudgetCategoryItemDto | null;
  currency: string;
  onClose: () => void;
  onSave: (categoryId: number, limit: number | null) => Promise<void>;
}

export function EditCategoryLimitDialog({
  category,
  currency,
  onClose,
  onSave,
}: EditCategoryLimitDialogProps) {
  const { renderAmount } = usePrivacyMode();
  const [limit, setLimit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setLimit(category.limit_amount ? String(category.limit_amount) : "");
    }
  }, [category]);

  if (!category) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const num = parseFloat(limit.replace(/,/g, ""));
      await onSave(category.category_id, !isNaN(num) && num > 0 ? num : null);
      onClose();
    } catch {
      // Error handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-t-[14px] sm:rounded-[12px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-[var(--line)]">
          <h3 className="font-display font-medium text-base sm:text-lg text-[var(--ink)]">
            {category.is_goal ? `Edit ${category.category_name} goal` : `Edit ${category.category_name} limit`}
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
          <div className="p-3 rounded-[6px] border border-[var(--line)] bg-[var(--bg)]/50">
            <span className="block text-xs text-[var(--muted)]">Spent so far this month</span>
            <b className="block text-base font-bold text-[var(--ink)] tabular-nums mt-0.5">
              {renderAmount(category.spent, currency)}
            </b>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
              Monthly {category.is_goal ? "goal" : "limit"}
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[4px] text-lg font-bold text-[var(--ink)]">
              <span className="text-[var(--muted)] font-display">{getCurrencySymbol(currency)}</span>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="No limit"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full bg-transparent border-0 outline-none tabular-nums font-display font-semibold"
                autoFocus
              />
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
              {submitting ? "Saving…" : "Save limit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
