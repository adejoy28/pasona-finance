import React from "react";
import { Link } from "react-router";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { cn } from "@/lib/utils";

interface SavingsRateSnapProps {
  savingsAmount: number;
  monthlyIncome: number;
  currency: string;
  className?: string;
}

export function SavingsRateSnap({
  savingsAmount,
  monthlyIncome,
  currency,
  className = "",
}: SavingsRateSnapProps) {
  const { renderAmount } = usePrivacyMode();

  const rate = monthlyIncome > 0 ? (savingsAmount / monthlyIncome) * 100 : 0;
  const barWidth = Math.min(100, Math.max(rate, savingsAmount > 0 ? 3 : 0));

  return (
    <Link
      to="/categories"
      className={cn(
        "rounded-2xl p-4 transition-all duration-200 block shadow-xs group",
        "bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:border-[var(--line)]/80",
        className
      )}
    >
      <div className="flex justify-between items-baseline gap-2 mb-2">
        <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
          Savings rate
        </span>
        <span className="text-xs font-bold text-[var(--primary)] group-hover:underline">
          Goals
        </span>
      </div>

      <div className="flex justify-between items-baseline gap-2 mb-2.5">
        <b className="font-display text-lg sm:text-xl font-semibold text-[var(--ink)] tracking-tight">
          {rate.toFixed(1)}%
        </b>
        <span className="text-xs font-semibold text-[var(--muted)] tabular-nums">
          {renderAmount(savingsAmount, currency)} saved · of monthly income
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-[var(--chip)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--pos)] transition-all duration-500"
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </Link>
  );
}
