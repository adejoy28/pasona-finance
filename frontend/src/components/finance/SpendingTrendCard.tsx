import React, { useMemo, useState } from "react";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { cn } from "@/lib/utils";

export interface MonthlySpendPoint {
  month: string; // e.g. "Mar", "Apr", "May"
  spent: number;
  isCurrent?: boolean;
}

interface SpendingTrendCardProps {
  trendData: MonthlySpendPoint[];
  currency: string;
  className?: string;
}

export function SpendingTrendCard({
  trendData,
  currency,
  className = "",
}: SpendingTrendCardProps) {
  const { isRevealed, renderAmount } = usePrivacyMode();
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  const maxVal = useMemo(
    () => Math.max(...trendData.map((d) => d.spent), 100),
    [trendData]
  );

  return (
    <section
      aria-label="Spending trend"
      className={cn(
        "rounded-2xl p-4 sm:p-5 shadow-xs transition-all",
        "bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-4">
        <div>
          <h3 className="font-display font-semibold text-base sm:text-lg text-[var(--ink)] leading-snug">
            Spending trend
          </h3>
          <p className="text-[11px] font-semibold text-[var(--muted)] mt-0.5">
            Last 6 months
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewMode((m) => (m === "chart" ? "table" : "chart"))}
          className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer pt-0.5"
        >
          {viewMode === "chart" ? "Table" : "Chart"}
        </button>
      </div>

      {!isRevealed ? (
        <div className="h-36 flex items-center justify-center border border-dashed border-[var(--line)] rounded-xl text-xs font-bold text-[var(--muted)]">
          Hidden in privacy mode
        </div>
      ) : viewMode === "table" ? (
        <div className="max-h-40 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--line)] text-[10px] uppercase font-bold text-[var(--muted)]">
                <th className="text-left py-1.5 font-bold">Month</th>
                <th className="text-right py-1.5 font-bold">Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]/50">
              {trendData.map((pt, i) => (
                <tr key={i} className="hover:bg-[var(--chip)]/50">
                  <td className="py-2 text-[var(--ink)] font-semibold">{pt.month}</td>
                  <td className="py-2 text-right text-[var(--ink)] font-bold tabular-nums">
                    {renderAmount(pt.spent, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Visual SVG / HTML Column Chart */
        <div className="space-y-2">
          <div className="h-28 flex items-end justify-between gap-2 pt-2 px-1">
            {trendData.map((pt, i) => {
              const heightPct = Math.max(4, Math.round((pt.spent / maxVal) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[9px] font-bold text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity tabular-nums truncate max-w-full">
                    {renderAmount(pt.spent, currency)}
                  </span>
                  <div className="w-full max-w-[28px] h-full flex items-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={cn(
                        "w-full rounded-t-md transition-all duration-500",
                        pt.isCurrent
                          ? "bg-[var(--primary)] shadow-xs"
                          : "bg-[var(--chip)] hover:bg-[var(--line)]"
                      )}
                      title={`${pt.month}: ${renderAmount(pt.spent, currency)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Month labels on x-axis */}
          <div className="flex justify-between gap-2 border-t border-[var(--line)] pt-1.5 px-1">
            {trendData.map((pt, i) => (
              <span
                key={i}
                className={cn(
                  "flex-1 text-center text-[10px] font-bold",
                  pt.isCurrent ? "text-[var(--primary)] font-extrabold" : "text-[var(--muted)]"
                )}
              >
                {pt.month}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
