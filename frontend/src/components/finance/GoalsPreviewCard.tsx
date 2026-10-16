import React from "react";
import { Link } from "react-router";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { cn } from "@/lib/utils";

export interface GoalItem {
  id: string | number;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string;
  color?: string;
}

interface GoalsPreviewCardProps {
  goals?: GoalItem[];
  currency: string;
  savingsRate?: number; // e.g. 2.6
  income?: number;
  className?: string;
}

export function GoalsPreviewCard({
  goals = [],
  currency,
  savingsRate = 0,
  income = 0,
  className = "",
}: GoalsPreviewCardProps) {
  const { renderAmount } = usePrivacyMode();

  // Spec 5.10: Only render if user has goals. If 0 goals, do not render this card
  if (goals.length === 0) {
    return null;
  }

  const displayedGoals = goals.slice(0, 3);
  const showSavingsChip = income > 0 && savingsRate >= 0;

  return (
    <div
      className={cn(
        "bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-3.5 sm:p-4 shadow-[var(--lift)] space-y-3",
        className
      )}
    >
      {/* Header: Goals on left, savings rate chip on right (Spec 5.10) */}
      <div className="flex justify-between items-center gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Goals
        </h3>

        {showSavingsChip && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-[var(--pos-soft)] text-[var(--pos)] tabular-nums">
            {savingsRate.toFixed(1)}% of income saved
          </span>
        )}
      </div>

      {/* Body: 1-3 goals */}
      <div className="space-y-3">
        {displayedGoals.map((g) => {
          const pct = Math.min(100, Math.round((g.savedAmount / Math.max(g.targetAmount, 1)) * 100));
          return (
            <div key={g.id} className="space-y-1.5">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs font-bold text-[var(--ink)] truncate">
                  {g.name}
                </span>
                <span className="text-[11px] font-bold text-[var(--muted)] tabular-nums">
                  {pct}%
                </span>
              </div>

              <div className="h-1.5 w-full rounded-full bg-[var(--chip)] overflow-hidden">
                <div
                  style={{ width: `${pct}%`, backgroundColor: g.color || "var(--primary)" }}
                  className="h-full rounded-full transition-all duration-500"
                />
              </div>

              <div className="flex justify-between items-baseline text-[11px] text-[var(--muted)] tabular-nums">
                <span className="font-semibold text-[var(--ink)]">
                  {renderAmount(g.savedAmount, currency)}
                </span>
                <span>of {renderAmount(g.targetAmount, currency)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Link */}
      <div className="pt-2 border-t border-[var(--line)]/60">
        <Link
          to="/categories"
          className="text-xs font-bold text-[var(--primary)] hover:underline inline-block"
        >
          All goals →
        </Link>
      </div>
    </div>
  );
}
