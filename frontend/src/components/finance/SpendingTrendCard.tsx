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

function getSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function SpendingTrendCard({
  trendData,
  currency,
  className = "",
}: SpendingTrendCardProps) {
  const { isRevealed, renderAmount } = usePrivacyMode();
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const maxVal = useMemo(
    () => Math.max(...trendData.map((d) => d.spent), 100),
    [trendData]
  );

  // SVG coordinate calculations for responsive line graph
  const SVG_WIDTH = 500;
  const SVG_HEIGHT = 160;
  const PADDING_X = 35;
  const PADDING_TOP = 25;
  const PADDING_BOTTOM = 25;
  const PLOT_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const points = useMemo(() => {
    if (trendData.length === 0) return [];
    const stepX = (SVG_WIDTH - 2 * PADDING_X) / Math.max(1, trendData.length - 1);

    return trendData.map((d, i) => {
      const x = PADDING_X + i * stepX;
      const normalizedY = maxVal > 0 ? d.spent / maxVal : 0;
      const y = PADDING_TOP + (1 - normalizedY) * PLOT_HEIGHT;
      return { x, y, ...d };
    });
  }, [trendData, maxVal]);

  const linePath = useMemo(() => getSmoothPath(points), [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const firstX = points[0].x.toFixed(1);
    const lastX = points[points.length - 1].x.toFixed(1);
    const bottomY = (SVG_HEIGHT - PADDING_BOTTOM + 5).toFixed(1);
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, points]);

  const activePoint = activeIdx !== null && points[activeIdx] ? points[activeIdx] : null;

  return (
    <section
      aria-label="Spending trend"
      className={cn(
        "rounded-[6px] p-4 sm:p-5 shadow-[var(--lift)] transition-all",
        "bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-2">
        <div>
          <h3 className="font-semibold text-sm sm:text-base text-[var(--ink)] leading-snug">
            Spending trend
          </h3>
          <p className="text-[11px] font-semibold text-[var(--muted)] mt-0.5">
            {activePoint ? (
              <span className="text-[var(--primary)] font-bold">
                {activePoint.month}: {renderAmount(activePoint.spent, currency)}
              </span>
            ) : (
              "6-month flow of expenses"
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewMode((m) => (m === "chart" ? "table" : "chart"))}
          className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer pt-0.5"
        >
          {viewMode === "chart" ? "Table view" : "Line graph"}
        </button>
      </div>

      {!isRevealed ? (
        <div className="h-36 flex items-center justify-center border border-dashed border-[var(--line)] rounded-[6px] text-xs font-bold text-[var(--muted)]">
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
        /* Smooth SVG Line Graph showing spending flow */
        <div className="relative w-full select-none pt-1">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-36 overflow-visible"
            onMouseLeave={() => setActiveIdx(null)}
          >
            <defs>
              <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
                <stop offset="85%" stopColor="var(--primary)" stopOpacity="0.03" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Subtle horizontal reference lines */}
            <line
              x1={PADDING_X}
              y1={PADDING_TOP}
              x2={SVG_WIDTH - PADDING_X}
              y2={PADDING_TOP}
              stroke="var(--line)"
              strokeDasharray="3 3"
              strokeWidth="1"
              strokeOpacity="0.7"
            />
            <line
              x1={PADDING_X}
              y1={PADDING_TOP + PLOT_HEIGHT / 2}
              x2={SVG_WIDTH - PADDING_X}
              y2={PADDING_TOP + PLOT_HEIGHT / 2}
              stroke="var(--line)"
              strokeDasharray="3 3"
              strokeWidth="1"
              strokeOpacity="0.7"
            />
            <line
              x1={PADDING_X}
              y1={SVG_HEIGHT - PADDING_BOTTOM}
              x2={SVG_WIDTH - PADDING_X}
              y2={SVG_HEIGHT - PADDING_BOTTOM}
              stroke="var(--line)"
              strokeWidth="1"
            />

            {/* Shaded Area Fill */}
            {areaPath && (
              <path
                d={areaPath}
                fill="url(#trend-fill)"
                className="transition-all duration-300"
              />
            )}

            {/* Flow Curve Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-xs"
              />
            )}

            {/* Data Dots along the line curve */}
            {points.map((pt, i) => {
              const isHovered = activeIdx === i;
              const isCurrent = pt.isCurrent;

              return (
                <g key={i}>
                  {/* Invisible broad hit area for easy hover / touch */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={18}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => setActiveIdx(i)}
                  />

                  {/* Highlight ring if active or current */}
                  {(isHovered || isCurrent) && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 9 : 6.5}
                      fill="var(--primary)"
                      fillOpacity={isHovered ? 0.25 : 0.15}
                      className="transition-all duration-200"
                    />
                  )}

                  {/* Crisp dot marker */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5 : isCurrent ? 4.5 : 3.5}
                    fill="var(--surface)"
                    stroke="var(--primary)"
                    strokeWidth={isHovered || isCurrent ? 2.5 : 2}
                    className="transition-all duration-200"
                  />
                </g>
              );
            })}
          </svg>

          {/* Month labels on x-axis below chart */}
          <div className="flex justify-between px-2 pt-1 border-t border-[var(--line)]/60">
            {trendData.map((pt, i) => {
              const isSelected = activeIdx === i || (activeIdx === null && pt.isCurrent);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    "text-[10.5px] font-bold transition-colors cursor-pointer text-center",
                    isSelected
                      ? "text-[var(--primary)] font-extrabold"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  )}
                >
                  {pt.month}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
