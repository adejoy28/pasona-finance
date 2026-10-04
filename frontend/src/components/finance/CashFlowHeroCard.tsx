import React from "react";
import { Link } from "react-router";
import { Eye, EyeOff, Plus, ChevronRight } from "lucide-react";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

interface CashFlowHeroCardProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlySpent: number;
  monthlySavings?: number;
  accountsCount: number;
  currency: string;
  className?: string;
}

export function CashFlowHeroCard({
  totalBalance,
  monthlyIncome,
  monthlySpent,
  monthlySavings = 0,
  accountsCount,
  currency,
  className = "",
}: CashFlowHeroCardProps) {
  const { isRevealed, toggleReveal, renderAmount } = usePrivacyMode();
  const animatedBalance = useCountUp(totalBalance, 600, isRevealed);

  const netCashFlow = monthlyIncome - monthlySpent;
  const isNetPositive = netCashFlow >= 0;

  const expenseRatio = monthlyIncome > 0
    ? Math.min(100, Math.round((monthlySpent / monthlyIncome) * 100))
    : monthlySpent > 0 ? 100 : 0;

  return (
    <section
      aria-label="Total balance"
      className={cn(
        "rounded-2xl p-4 sm:p-5 text-white transition-all shadow-lg",
        "bg-gradient-to-b from-[#0b1434] via-[#101b45] to-[#162356] border border-white/15",
        className
      )}
    >
      {/* Row 1: Label + Eye toggle on left, Accounts/History on right */}
      <div className="flex justify-between items-center text-[10.5px] text-white/80 mb-2">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0" />
          <span>Total Balance</span>
          <button
            type="button"
            onClick={toggleReveal}
            className="text-white/60 hover:text-white transition-colors p-0.5 cursor-pointer ml-0.5"
            aria-label={isRevealed ? "Hide balances" : "Show balances"}
            title={isRevealed ? "Hide balances" : "Show balances"}
          >
            {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>

        <Link
          to="/accounts"
          className="flex items-center gap-0.5 text-white/70 hover:text-white transition-colors text-[11px] font-semibold"
        >
          <span>{accountsCount} {accountsCount === 1 ? "account" : "accounts"}</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Row 2: Big Balance Amount on Left + [+ Add] CTA on Right */}
      <div className="flex justify-between items-center gap-3 mb-3">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight leading-none text-white truncate min-w-0">
          {renderAmount(animatedBalance, currency)}
        </h2>

        <Link
          to="/transactions/add"
          aria-label="Add transaction"
          className="px-3.5 py-1.5 bg-white text-[#101b45] hover:bg-slate-100 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Add</span>
        </Link>
      </div>

      {/* Row 3: 3-column Cash Flow Grid (Income | Spent | Net cash flow) */}
      <div className="pt-2.5 border-t border-white/15 grid grid-cols-3 gap-2">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
            Income
          </span>
          <span className="font-extrabold text-[13px] text-[#8CE6B8] tabular-nums truncate mt-0.5">
            {renderAmount(monthlyIncome, currency)}
          </span>
        </div>

        <div className="flex flex-col min-w-0 border-l border-white/10 pl-2">
          <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
            Spent
          </span>
          <span className="font-extrabold text-[13px] text-white tabular-nums truncate mt-0.5">
            {renderAmount(monthlySpent, currency)}
          </span>
        </div>

        <div className="flex flex-col min-w-0 border-l border-white/10 pl-2">
          <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
            Net cash flow
          </span>
          <span
            className={cn(
              "font-extrabold text-[13px] tabular-nums truncate mt-0.5",
              isNetPositive ? "text-[#8CE6B8]" : "text-rose-300"
            )}
          >
            {isNetPositive ? "+" : "−"}
            {renderAmount(Math.abs(netCashFlow), currency)}
          </span>
        </div>
      </div>

      {/* Proportional Spend Bar */}
      <div className="pt-2">
        <div className="h-[5px] w-full rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${expenseRatio}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[10px] font-medium text-white/75">
          <span>{expenseRatio}% of income spent</span>
          <span>
            {monthlySavings > 0
              ? `${renderAmount(monthlySavings, currency)} moved to savings`
              : `${Math.max(0, 100 - expenseRatio)}% left`}
          </span>
        </div>
      </div>
    </section>
  );
}
