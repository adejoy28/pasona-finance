import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { cn } from "@/lib/utils";

export interface CategorySpendItem {
  category_name: string;
  category_id?: number | string;
  total: number;
}

interface WhereItWentDonutProps {
  monthLabel: string;
  categories: CategorySpendItem[];
  spentTotal: number;
  currency: string;
  className?: string;
}

const DONUT_COLORS = [
  "var(--c1, #2F66F0)",
  "var(--c2, #7557E0)",
  "var(--c3, #059669)",
  "var(--c4, #D9830F)",
  "var(--c5, #DC2626)",
  "var(--c8, #898781)",
];

export function WhereItWentDonut({
  monthLabel,
  categories = [],
  spentTotal,
  currency,
  className = "",
}: WhereItWentDonutProps) {
  const navigate = useNavigate();
  const { renderAmount } = usePrivacyMode();

  // Exclude savings per spec
  const nonSavingsCategories = useMemo(
    () => categories.filter((c) => c.category_name.toLowerCase() !== "savings" && c.total > 0),
    [categories]
  );

  const total = useMemo(
    () => nonSavingsCategories.reduce((sum, c) => sum + c.total, 0),
    [nonSavingsCategories]
  );

  // Spec 5.7: If spent is 0: do not render the card
  if (total <= 0) {
    return null;
  }

  // Top 5 categories + Other if more than 5
  const { topCategories, uncategorizedItem } = useMemo(() => {
    const sorted = [...nonSavingsCategories].sort((a, b) => b.total - a.total);
    const uncat = sorted.find(
      (c) =>
        c.category_name.toLowerCase().includes("uncategorized") ||
        c.category_id === "uncategorized" ||
        c.category_id === 0
    );

    if (sorted.length <= 5) {
      return { topCategories: sorted, uncategorizedItem: uncat };
    }

    const top5 = sorted.slice(0, 5);
    const others = sorted.slice(5);
    const otherTotal = others.reduce((acc, c) => acc + c.total, 0);

    return {
      topCategories: [
        ...top5,
        {
          category_name: "Other",
          category_id: undefined,
          total: otherTotal,
        },
      ],
      uncategorizedItem: uncat,
    };
  }, [nonSavingsCategories]);

  // Circumference for R = 44 is 2 * PI * 44 ≈ 276.46
  const R = 44;
  const CIRCUMFERENCE = 2 * Math.PI * R;

  const segments = useMemo(() => {
    let offset = 0;
    return topCategories.map((cat, idx) => {
      const pct = cat.total / total;
      const strokeDash = pct * CIRCUMFERENCE;
      const visibleDash = Math.max(0, strokeDash - 1.5);
      const strokeGap = CIRCUMFERENCE - visibleDash;
      const currentOffset = -offset;
      offset += strokeDash;

      return {
        ...cat,
        color: DONUT_COLORS[idx % DONUT_COLORS.length],
        percentage: Math.round(pct * 100),
        strokeDash: `${visibleDash.toFixed(2)} ${strokeGap.toFixed(2)}`,
        strokeOffset: currentOffset.toFixed(2),
      };
    });
  }, [topCategories, total, CIRCUMFERENCE]);

  const uncategorizedPct = uncategorizedItem ? (uncategorizedItem.total / total) * 100 : 0;
  const showUncategorizedWarning = uncategorizedItem && uncategorizedPct > 30;

  return (
    <section
      aria-label="Where it went"
      className={cn(
        "rounded-[6px] p-3.5 sm:p-4 shadow-[var(--lift)] transition-all",
        "bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-2.5">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-base sm:text-lg text-[var(--ink)] leading-snug">
            Where it went
          </h3>
          <p className="text-[11px] font-semibold text-[var(--muted)] mt-0.5 truncate">
            {monthLabel} · {renderAmount(total, currency)} spent, savings not included
          </p>
        </div>

        <Link
          to="/budgets"
          className="text-xs font-bold text-[var(--primary)] hover:underline shrink-0 pt-0.5"
        >
          Budgets
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5 mt-2">
        {/* Donut Chart Ring with Center Text */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center">
          <svg
            viewBox="0 0 120 120"
            role="img"
            aria-label="Spending split by category"
            className="w-full h-full -rotate-90"
          >
            {/* Background circle track */}
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke="var(--chip)"
              strokeWidth="13"
            />
            {/* Segments */}
            {segments.map((seg, idx) => (
              <circle
                key={idx}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth="13"
                strokeDasharray={seg.strokeDash}
                strokeDashoffset={seg.strokeOffset}
                className="transition-all duration-500"
              />
            ))}
          </svg>

          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2">
            <span className="font-display font-bold text-xs sm:text-sm text-[var(--ink)] tabular-nums truncate max-w-[80px] text-center">
              {renderAmount(total, currency)}
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--muted)]">
              spent
            </span>
          </div>
        </div>

        {/* Category Legend: Category name, bold amount, percentage (Spec 5.7) */}
        <div className="flex-1 w-full space-y-1 min-w-0">
          {segments.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (item.category_id !== undefined) {
                  navigate(`/transactions?category_id=${item.category_id}`);
                }
              }}
              className={cn(
                "flex items-center justify-between gap-2 p-1.5 rounded-[4px] hover:bg-[var(--chip)] transition-colors text-xs",
                item.category_id !== undefined && "cursor-pointer"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-[var(--ink)] truncate">
                  {item.category_name}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
                <span className="font-bold text-[var(--ink)]">
                  {renderAmount(item.total, currency)}
                </span>
                <span className="text-[11px] font-medium text-[var(--muted)]">
                  ({item.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Uncategorized Warning if >30% */}
      {showUncategorizedWarning && (
        <div className="mt-3 pt-2.5 border-t border-[var(--line)] text-xs text-[var(--muted)] flex items-center justify-between gap-2">
          <span>
            {renderAmount(uncategorizedItem.total, currency)} in uncategorized transactions.
          </span>
          <Link
            to="/transactions?category_id=uncategorized"
            className="font-bold text-[var(--primary)] hover:underline shrink-0"
          >
            Categorize them →
          </Link>
        </div>
      )}
    </section>
  );
}
