import React from "react";
import { Link } from "react-router";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { cn } from "@/lib/utils";

interface MonthlyBudgetSnapProps {
  monthLabel: string;
  spent: number;
  budgetLimit: number;
  currency: string;
  className?: string;
}

export function MonthlyBudgetSnap({
  monthLabel,
  spent,
  budgetLimit,
  currency,
  className = "",
}: MonthlyBudgetSnapProps) {
  const { renderAmount } = usePrivacyMode();

  const effectiveBudget = budgetLimit > 0 ? budgetLimit : Math.max(spent, 1);
  const isOver = spent > effectiveBudget && budgetLimit > 0;
  const left = Math.max(0, effectiveBudget - spent);
  const overAmount = Math.max(0, spent - effectiveBudget);
  const rawPercent = effectiveBudget > 0 ? Math.round((spent / effectiveBudget) * 100) : 0;
  const percentUsed = Math.min(100, Math.max(0, rawPercent));

  const meterColor = isOver
    ? "bg-[var(--neg)]"
    : rawPercent >= 85
    ? "bg-[var(--warn)]"
    : "bg-[var(--primary)]";

  return (
    <Link
      to="/budgets"
      className={cn(
        "rounded-[6px] p-3.5 sm:p-4 transition-all duration-200 block shadow-[var(--lift)] group",
        "bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:border-[var(--line)]/80",
        className
      )}
    >
      {/* Header: Label + View Link */}
      <div className="flex justify-between items-baseline gap-2 mb-2">
        <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
          Monthly budget · {monthLabel}
        </span>
        <span className="text-xs font-bold text-[var(--primary)] group-hover:underline">
          View
        </span>
      </div>

      {/* Row 1: Left amount (or Over amount) + Total planned */}
      <div className="flex justify-between items-baseline gap-2 mb-2.5">
        {isOver ? (
          <b className="font-display text-lg sm:text-xl font-semibold text-[var(--neg)] tracking-tight">
            {renderAmount(overAmount, currency)} over
          </b>
        ) : (
          <b className="font-display text-lg sm:text-xl font-semibold text-[var(--ink)] tracking-tight">
            {renderAmount(left, currency)} left
          </b>
        )}
        <span className="text-xs font-semibold text-[var(--muted)] tabular-nums">
          of {renderAmount(effectiveBudget, currency)}
        </span>
      </div>

      {/* Row 2: Meter bar (<85% primary, 85-100% warn, >100% neg) */}
      <div className="h-1.5 w-full rounded-full bg-[var(--chip)] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", meterColor)}
          style={{ width: `${percentUsed}%` }}
        />
      </div>

      {/* Row 3: n% of budget used */}
      <div className="text-[11px] font-semibold text-[var(--muted)] mt-2">
        <span>{rawPercent}% of budget used</span>
      </div>
    </Link>
  );
}
