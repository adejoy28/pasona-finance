import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { cn } from "@/lib/utils";

export interface CategorySpendItem {
  category_name: string;
  category_id?: number;
  total: number;
}

interface WhereItWentDonutProps {
  monthLabel: string;
  categories: CategorySpendItem[];
  spentTotal: number;
  currency: string;
  className?: string;
}

// 5 core palette colors per Addendum D (no extra hues)
const DONUT_COLORS = [
  "var(--c1, #2F66F0)",
  "var(--c2, #7557E0)",
  "var(--c3, #059669)",
  "var(--c4, #D9830F)",
  "var(--c5, #DC2626)",
];

export function WhereItWentDonut({
  monthLabel,
  categories,
  spentTotal,
  currency,
  className = "",
}: WhereItWentDonutProps) {
  const navigate = useNavigate();
  const { renderAmount, isRevealed } = usePrivacyMode();

  // Filter out Savings category from "Where it went" (per Phase 4.3 & Addendum D)
  const nonSavingsCategories = useMemo(
    () => categories.filter((c) => c.category_name.toLowerCase() !== "savings"),
    [categories]
  );

  const total = useMemo(
    () => nonSavingsCategories.reduce((sum, c) => sum + c.total, 0) || spentTotal || 1,
    [nonSavingsCategories, spentTotal]
  );

  // SVG Donut calculations (circumference for radius 44 is 2 * PI * 44 ≈ 276.46)
  const R = 44;
  const CIRCUMFERENCE = 2 * Math.PI * R;

  const segments = useMemo(() => {
    let offset = 0;
    return nonSavingsCategories.map((cat, idx) => {
      const pct = cat.total / total;
      const strokeDash = pct * CIRCUMFERENCE;
      const visibleDash = Math.max(0, strokeDash - 2);
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
  }, [nonSavingsCategories, total, CIRCUMFERENCE]);

  return (
    <section
      aria-label="Where it went"
      className={cn(
        "rounded-2xl p-4 sm:p-5 shadow-xs transition-all",
        "bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-base sm:text-lg text-[var(--ink)] leading-snug">
            Where it went
          </h3>
          <p className="text-[11px] font-semibold text-[var(--muted)] mt-0.5 truncate">
            {monthLabel} · {renderAmount(total, currency)} spent, savings not included
          </p>
        </div>

        <Link
          to="/categories"
          className="text-xs font-bold text-[var(--primary)] hover:underline shrink-0 pt-0.5"
        >
          Budgets
        </Link>
      </div>

      {nonSavingsCategories.length === 0 ? (
        <div className="py-8 text-center text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          No spending recorded for this month
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6 mt-2">
          {/* Donut Chart Ring with Center Text */}
          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
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
                strokeWidth="14"
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
                  strokeWidth="14"
                  strokeDasharray={seg.strokeDash}
                  strokeDashoffset={seg.strokeOffset}
                  className="transition-all duration-500"
                />
              ))}
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2">
              <span className="font-display font-bold text-xs sm:text-sm text-[var(--ink)] tabular-nums truncate max-w-[85px] text-center">
                {renderAmount(total, currency)}
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--muted)] mt-0.5">
                spent
              </span>
            </div>
          </div>

          {/* Category Legend Beside Donut */}
          <div className="flex-1 w-full space-y-1.5 min-w-0">
            {segments.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (item.category_id) {
                    navigate(`/transactions?category_id=${item.category_id}`);
                  }
                }}
                className={cn(
                  "flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-[var(--chip)] transition-colors text-xs",
                  item.category_id && "cursor-pointer"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-[var(--ink)] truncate">
                    {item.category_name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 tabular-nums">
                  <span className="text-[11px] font-bold text-[var(--muted)]">
                    {item.percentage}%
                  </span>
                  <span className="font-bold text-[var(--ink)]">
                    {renderAmount(item.total, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
