import React, { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { getCategoryColor } from "@/lib/category-colors";
import type { BudgetCategoryItemDto } from "@/lib/api";

interface EditPlanDialogProps {
  open: boolean;
  onClose: () => void;
  monthLabel: string;
  isNextMonth?: boolean;
  categories: BudgetCategoryItemDto[];
  currency: string;
  onSave: (limits: Array<{ category_id: number; limit_amount: number | null }>) => Promise<void>;
}

export function EditPlanDialog({
  open,
  onClose,
  monthLabel,
  isNextMonth = false,
  categories,
  currency,
  onSave,
}: EditPlanDialogProps) {
  const { renderAmount } = usePrivacyMode();
  const [limits, setLimits] = useState<Record<number, string>>({});
  const [rollForward, setRollForward] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const initial: Record<number, string> = {};
      categories.forEach((c) => {
        initial[c.category_id] = c.limit_amount ? String(c.limit_amount) : "";
      });
      setLimits(initial);
    }
  }, [open, categories]);

  const totalPlan = useMemo(() => {
    let sum = 0;
    Object.values(limits).forEach((val) => {
      const num = parseFloat(val.replace(/,/g, ""));
      if (!isNaN(num) && num > 0) sum += num;
    });
    return sum;
  }, [limits]);

  if (!open) return null;

  const handleInputChange = (catId: number, val: string) => {
    setLimits((prev) => ({ ...prev, [catId]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = categories.map((c) => {
        const val = limits[c.category_id];
        const num = parseFloat((val || "").replace(/,/g, ""));
        return {
          category_id: c.category_id,
          limit_amount: !isNaN(num) && num > 0 ? num : null,
        };
      });
      await onSave(payload);
      onClose();
    } catch {
      // Error handled by hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[var(--surface)] border border-[var(--line)] rounded-t-[14px] sm:rounded-[12px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--line)]">
          <h3 className="font-display font-medium text-base sm:text-lg text-[var(--ink)]">
            {isNextMonth ? `Plan ${monthLabel}` : `Edit ${monthLabel} plan`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] border border-[var(--line)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between p-2.5 rounded-[4px] bg-[var(--chip)] border border-[var(--line)] text-xs">
            <span className="text-[var(--muted)] font-medium">Target month:</span>
            <span className="font-bold text-[var(--ink)]">{monthLabel}</span>
          </div>

          <p className="text-xs text-[var(--muted)]">
            {isNextMonth
              ? "Started from your previous limits. Change anything you need."
              : "Set a limit for each category. Savings is treated as a goal, not a cap."}
          </p>

          {/* List of categories */}
          <div className="space-y-2 border-t border-[var(--line)] pt-2">
            {categories.map((c) => (
              <div key={c.category_id} className="flex items-center gap-3 py-1.5 border-b border-[var(--line)]/60">
                <i
                  className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                  style={{ backgroundColor: getCategoryColor(c.category_name, c.category_id) }}
                />
                <label htmlFor={`limit-${c.category_id}`} className="flex-1 text-xs font-bold text-[var(--ink)] truncate">
                  {c.category_name} {c.is_goal && <span className="text-[10px] text-[var(--muted)]">(goal)</span>}
                </label>
                <div className="w-32 shrink-0">
                  <input
                    id={`limit-${c.category_id}`}
                    type="number"
                    min="0"
                    step="any"
                    placeholder="No limit"
                    value={limits[c.category_id] ?? ""}
                    onChange={(e) => handleInputChange(c.category_id, e.target.value)}
                    className="w-full text-right px-2.5 py-1.5 text-xs font-bold bg-[var(--bg)] border border-[var(--line)] rounded-[4px] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] tabular-nums"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total Plan Calculation */}
          <div className="flex justify-between items-center py-2 px-1 border-t border-[var(--line)] text-xs font-extrabold text-[var(--ink)]">
            <span>Total plan</span>
            <span className="tabular-nums text-sm text-[var(--primary)]">{renderAmount(totalPlan, currency)}</span>
          </div>

          {/* Roll unused money forward switch */}
          <div className="flex items-center justify-between p-3 rounded-[6px] border border-[var(--line)] bg-[var(--bg)]/50">
            <div>
              <b className="block text-xs font-bold text-[var(--ink)]">Roll unused money forward</b>
              <span className="block text-[11px] text-[var(--muted)]">Add what you did not spend to next month</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={rollForward}
              onClick={() => setRollForward(!rollForward)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                rollForward ? "bg-[var(--primary)]" : "bg-[var(--chip)]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  rollForward ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Footer Buttons */}
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
              disabled={saving}
              className="px-4 py-2 rounded-[4px] bg-[var(--primary)] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
