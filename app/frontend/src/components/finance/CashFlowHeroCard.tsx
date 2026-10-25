import React from "react";
import { Link } from "react-router";
import { Eye, EyeOff, ChevronRight } from "lucide-react";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

interface CashFlowHeroCardProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlySpent: number;
  monthlySavings: number;
  net: number;
  spentChangeVsLastMonth: number | null; // e.g. -12 or 12
  lastMonthName: string | null;
  accountsCount: number;
  currency: string;
  monthName: string;
  className?: string;
}

export function CashFlowHeroCard({
  totalBalance,
  monthlyIncome,
  monthlySpent,
  monthlySavings,
  net,
  spentChangeVsLastMonth,
  lastMonthName,
  accountsCount,
  currency,
  monthName,
  className = "",
}: CashFlowHeroCardProps) {
  const { isRevealed, toggleReveal, renderAmount, renderCompactAmount } = usePrivacyMode();
  const animatedBalance = useCountUp(totalBalance, 600, isRevealed);

  const isNetPositive = net >= 0;

  // Percentage of income spent
  const expenseRatio =
    monthlyIncome > 0
      ? Math.min(100, Math.round((monthlySpent / monthlyIncome) * 100))
      : 0;

  return (
    <section
      aria-label="Total balance"
      className={cn(
        "rounded-[6px] p-4 sm:p-5 text-white transition-all shadow-[var(--lift)] flex flex-col justify-between",
        "bg-gradient-to-b from-[#0b1434] via-[#101b45] to-[#162356] border border-white/15",
        className
      )}
    >
      {/* Header: "Total balance" left. Right: "n accounts" as link to Accounts, and hide-balances eye button */}
      <div className="flex justify-between items-center text-white/80 mb-2">
        <span className="font-semibold text-xs uppercase tracking-wider text-white/80">
          Total balance
        </span>

        <div className="flex items-center gap-2">
          <Link
            to="/accounts"
            className="flex items-center gap-0.5 text-white/70 hover:text-white transition-colors text-[11px] font-semibold"
          >
            <span>
              {accountsCount} {accountsCount === 1 ? "account" : "accounts"}
            </span>
            <ChevronRight size={13} />
          </Link>

          <button
            type="button"
            onClick={toggleReveal}
            className="text-white/60 hover:text-white transition-colors p-0.5 cursor-pointer"
            aria-label={isRevealed ? "Hide balances" : "Show balances"}
            title={isRevealed ? "Hide balances" : "Show balances"}
          >
            {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Big Number: Total balance (NO Add button here per Spec 5.1) */}
      <div className="mb-3.5">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight leading-none text-white truncate">
          {renderAmount(animatedBalance, currency)}
        </h2>
      </div>

      {/* Three stats in a row: Income, Spent, Net cash flow */}
      <div className="pt-2.5 border-t border-white/15 grid grid-cols-3 gap-2">
        {/* Stat 1: Income */}
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider truncate">
            Income
          </span>
          <span className="font-extrabold text-[13px] text-[#8CE6B8] tabular-nums truncate mt-0.5">
            {renderCompactAmount(monthlyIncome, currency)}
          </span>
        </div>

        {/* Stat 2: Spent + optional change chip */}
        <div className="flex flex-col min-w-0 border-l border-white/10 pl-2">
          <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider truncate">
            Spent
          </span>
          <div className="flex items-center gap-1 mt-0.5 min-w-0">
            <span className="font-extrabold text-[13px] text-white tabular-nums truncate">
              {renderCompactAmount(monthlySpent, currency)}
            </span>
            {spentChangeVsLastMonth !== null && lastMonthName && (
              <span
                className={cn(
                  "text-[9px] font-extrabold px-1 py-0.5 rounded-[3px] leading-none shrink-0 inline-flex items-center gap-0.5",
                  spentChangeVsLastMonth <= 0
                    ? "bg-emerald-500/20 text-[#8CE6B8]"
                    : "bg-amber-500/20 text-amber-300"
                )}
                title={`${Math.abs(spentChangeVsLastMonth)}% ${
                  spentChangeVsLastMonth <= 0 ? "lower" : "higher"
                } than ${lastMonthName}`}
              >
                {spentChangeVsLastMonth <= 0 ? "↓" : "↑"}{Math.abs(spentChangeVsLastMonth)}%

              </span>
            )}
          </div>
        </div>

        {/* Stat 3: Net cash flow */}
        <div className="flex flex-col min-w-0 border-l border-white/10 pl-2">
          <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider truncate">
            Net<span className="hidden sm:inline"> cash flow</span>
          </span>
          <span
            className={cn(
              "font-extrabold text-[13px] tabular-nums truncate mt-0.5",
              isNetPositive ? "text-[#8CE6B8]" : "text-rose-300"
            )}
          >
            {isNetPositive ? "+" : "−"}
            {renderCompactAmount(Math.abs(net), currency)}
          </span>
        </div>
      </div>

      {/* Under stats */}
      {monthlyIncome > 0 ? (
        <div className="pt-2.5">
          <div className="h-[4px] w-full rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${expenseRatio}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1.5 text-[10px] font-medium text-white/75">
            <span>{expenseRatio}% of income spent</span>
            {monthlySavings > 0 && (
              <span>{renderCompactAmount(monthlySavings, currency)} moved to savings</span>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-2.5 flex items-center justify-between text-xs text-white/75">
          <span>No income recorded in {monthName} yet</span>
          <Link
            to="/transactions/add?type=income"
            className="text-xs font-bold text-[#8CE6B8] hover:underline"
          >
            Add income
          </Link>
        </div>
      )}
    </section>
  );
}
