import React from "react";
import { Link } from "react-router";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { cn } from "@/lib/utils";

interface MonthlyBudgetSnapProps {
  monthLabel: string;
  spent: number;
  budgetLimit: number;
  overCount?: number;
  nearCount?: number;
  currency: string;
  className?: string;
}

export function MonthlyBudgetSnap({
  monthLabel,
  spent,
  budgetLimit,
  overCount = 0,
  nearCount = 0,
  currency,
  className = "",
}: MonthlyBudgetSnapProps) {
  const { renderAmount } = usePrivacyMode();

  const effectiveBudget = budgetLimit > 0 ? budgetLimit : Math.max(spent, 1);
  const left = Math.max(0, effectiveBudget - spent);
  const percentUsed = Math.min(100, Math.round((spent / effectiveBudget) * 100));

  const isOver = spent > effectiveBudget && budgetLimit > 0;
  const isNear = !isOver && percentUsed >= 85;

  const meterColor = isOver
    ? "bg-[var(--neg)]"
    : isNear
    ? "bg-[var(--warn)]"
    : "bg-[var(--primary)]";

  return (
    <Link
      to="/categories"
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

      {/* Row 2: Left amount + Total planned */}
      <div className="flex justify-between items-baseline gap-2 mb-2.5">
        <b className="font-display text-lg sm:text-xl font-semibold text-[var(--ink)] tracking-tight">
          {renderAmount(left, currency)} left
        </b>
        <span className="text-xs font-semibold text-[var(--muted)] tabular-nums">
          of {renderAmount(effectiveBudget, currency)}
        </span>
      </div>

      {/* Meter Bar: ok (primary), near (amber), over (rose) */}
      <div className="h-1.5 w-full rounded-full bg-[var(--chip)] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", meterColor)}
          style={{ width: `${percentUsed}%` }}
        />
      </div>

      {/* Subtitle Status */}
      <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--muted)] mt-2">
        <span>{percentUsed}% of budget used</span>
        {overCount > 0 && (
          <span className="text-[var(--neg)] font-bold">· {overCount} over limit</span>
        )}
        {nearCount > 0 && overCount === 0 && (
          <span className="text-amber-600 dark:text-amber-400 font-bold">· {nearCount} near limit</span>
        )}
      </div>
    </Link>
  );
}
