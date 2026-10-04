import React, { useMemo } from "react";
import { ArrowUpRight, Tag, Flame, Check } from "lucide-react";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { type TransactionDto } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ThisWeekCardProps {
  transactions: TransactionDto[];
  currency: string;
  streak: number;
  className?: string;
}

export function ThisWeekCard({
  transactions,
  currency,
  streak,
  className = "",
}: ThisWeekCardProps) {
  const { renderAmount } = usePrivacyMode();

  // Filter transactions in the last 7 days
  const weekData = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const minIso = sevenDaysAgo.toISOString().slice(0, 10);

    const weekExpenses = transactions.filter(
      (t) =>
        t.type === "expense" &&
        t.transaction_date &&
        t.transaction_date.slice(0, 10) >= minIso
    );

    const totalWeekSpent = weekExpenses.reduce(
      (sum, t) => sum + (typeof t.amount === "string" ? parseFloat(t.amount) : t.amount),
      0
    );

    // Group by category to find top category
    const catMap = new Map<string, number>();
    for (const t of weekExpenses) {
      const name = t.category?.name || "General";
      const amt = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
      catMap.set(name, (catMap.get(name) || 0) + amt);
    }

    let topCategory = "General";
    let topCategoryAmt = 0;
    for (const [name, amt] of catMap.entries()) {
      if (amt > topCategoryAmt) {
        topCategoryAmt = amt;
        topCategory = name;
      }
    }

    return { totalWeekSpent, topCategory, topCategoryAmt, count: weekExpenses.length };
  }, [transactions]);

  return (
    <section
      aria-label="This week"
      className={cn(
        "rounded-[6px] p-4 sm:p-5 shadow-[var(--lift)] transition-all",
        "bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)]",
        className
      )}
    >
      <div className="mb-3">
        <h3 className="font-display font-semibold text-base sm:text-lg text-[var(--ink)] leading-snug">
          This week
        </h3>
        <p className="text-[11px] font-semibold text-[var(--muted)] mt-0.5">
          Past 7 days
        </p>
      </div>

      <div className="divide-y divide-[var(--line)]/60 text-xs">
        {/* Fact 1: Total spent */}
        <div className="py-2.5 flex items-center gap-3">
          <div className="w-7 h-7 rounded-[4px] bg-[var(--chip)] flex items-center justify-center shrink-0 text-rose-500">
            <ArrowUpRight size={15} />
          </div>
          <div className="flex-1 min-w-0">
            <b className="font-bold text-[var(--ink)] tabular-nums">
              {renderAmount(weekData.totalWeekSpent, currency)} spent
            </b>{" "}
            <span className="text-[var(--muted)]">
              across {weekData.count} {weekData.count === 1 ? "expense" : "expenses"}
            </span>
          </div>
        </div>

        {/* Fact 2: Top category */}
        {weekData.topCategoryAmt > 0 && (
          <div className="py-2.5 flex items-center gap-3">
            <div className="w-7 h-7 rounded-[4px] bg-[var(--chip)] flex items-center justify-center shrink-0 text-[var(--primary)]">
              <Tag size={15} />
            </div>
            <div className="flex-1 min-w-0 text-[var(--ink)]">
              <span className="font-bold">{weekData.topCategory}</span> led the week at{" "}
              <b className="tabular-nums">{renderAmount(weekData.topCategoryAmt, currency)}</b>
            </div>
          </div>
        )}

        {/* Fact 3: Streak */}
        <div className="py-2.5 flex items-center gap-3">
          <div className="w-7 h-7 rounded-[4px] bg-[var(--chip)] flex items-center justify-center shrink-0 text-amber-500">
            <Flame size={15} className="fill-amber-500" />
          </div>
          <div className="flex-1 min-w-0 text-[var(--ink)]">
            <b className="font-bold">{streak} day streak.</b>{" "}
            <span className="text-[var(--muted)]">
              {streak > 0 ? "You have logged consistently." : "Start a streak today!"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
