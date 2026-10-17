import React, { useState } from "react";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import type { DailyPacePoint } from "@/hooks/use-budgets";

interface SpendingAgainstPlanChartProps {
  pacePoints: DailyPacePoint[];
  currency: string;
  monthLabel: string;
}

export function SpendingAgainstPlanChart({
  pacePoints,
  currency,
  monthLabel,
}: SpendingAgainstPlanChartProps) {
  const [showTable, setShowTable] = useState(false);
  const { renderAmount, isPrivacyMode } = usePrivacyMode();

  const maxVal = Math.max(
    ...pacePoints.map((p) => Math.max(p.cumSpent, p.planPace)),
    1000
  );

  // SVG Chart Dimensions
  const width = 600;
  const height = 160;
  const margin = { top: 15, right: 15, bottom: 25, left: 45 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const count = pacePoints.length || 1;
  const getX = (index: number) => margin.left + (index / (count - 1)) * innerW;
  const getY = (val: number) => margin.top + innerH * (1 - Math.min(1, val / maxVal));

  // Build SVG Path strings
  const spentPts = pacePoints.map((p, i) => `${getX(i).toFixed(1)},${getY(p.cumSpent).toFixed(1)}`);
  const planPts = pacePoints.map((p, i) => `${getX(i).toFixed(1)},${getY(p.planPace).toFixed(1)}`);

  const spentPathD = spentPts.length > 0 ? `M${spentPts.join(" L")}` : "";
  const planPathD = planPts.length > 0 ? `M${planPts.join(" L")}` : "";
  const areaPathD =
    spentPts.length > 0
      ? `M${spentPts.join(" L")} L${getX(count - 1)},${getY(0)} L${getX(0)},${getY(0)} Z`
      : "";

  const ticks = [0, maxVal / 2, maxVal];

  return (
    <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-3.5 sm:p-4 shadow-[var(--lift)]">
      {/* Header */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <div>
          <h3 className="font-display font-medium text-sm sm:text-base text-[var(--ink)] tracking-tight">
            Spending against plan
          </h3>
          <span className="text-[11px] font-semibold text-[var(--muted)]">
            Cumulative, {monthLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="text-xs font-bold text-[var(--primary)] hover:underline px-1 py-0.5"
        >
          {showTable ? "Chart" : "Table"}
        </button>
      </div>

      {/* Body: Accessible Data Table vs SVG Line Chart */}
      {showTable ? (
        <div className="max-h-[170px] overflow-auto border border-[var(--line)] rounded-[4px] mt-2">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--bg)]/50">
                <th className="p-2 text-left text-[10px] uppercase font-bold tracking-wider text-[var(--muted)]">
                  Day
                </th>
                <th className="p-2 text-right text-[10px] uppercase font-bold tracking-wider text-[var(--muted)]">
                  Spent
                </th>
                <th className="p-2 text-right text-[10px] uppercase font-bold tracking-wider text-[var(--muted)]">
                  Plan Pace
                </th>
              </tr>
            </thead>
            <tbody>
              {pacePoints.map((pt) => (
                <tr key={pt.day} className="border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--chip)]/30">
                  <td className="p-2 font-medium text-[var(--ink)]">{pt.dateStr}</td>
                  <td className="p-2 text-right font-bold text-[var(--ink)] tabular-nums">
                    {renderAmount(pt.cumSpent, currency)}
                  </td>
                  <td className="p-2 text-right text-[var(--muted)] font-semibold tabular-nums">
                    {renderAmount(pt.planPace, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : isPrivacyMode ? (
        <div className="h-[140px] flex items-center justify-center text-xs font-semibold text-[var(--muted)] border border-dashed border-[var(--line)] rounded-[6px] my-2">
          Hidden in privacy mode
        </div>
      ) : (
        <div className="relative w-full overflow-hidden my-1">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-[160px] overflow-visible"
            aria-label={`Spending against plan chart for ${monthLabel}`}
          >
            {/* Grid & Axis Ticks */}
            {ticks.map((t, idx) => {
              const y = getY(t);
              return (
                <g key={idx}>
                  <line
                    x1={margin.left}
                    x2={width - margin.right}
                    y1={y}
                    y2={y}
                    stroke="var(--line)"
                    strokeWidth="1"
                    strokeDasharray={idx === 0 ? "none" : "2,2"}
                  />
                  <text
                    x={margin.left - 6}
                    y={y + 3.5}
                    textAnchor="end"
                    className="text-[9px] fill-[var(--muted)] font-mono font-semibold"
                  >
                    {t >= 1000 ? `${Math.round(t / 1000)}k` : Math.round(t)}
                  </text>
                </g>
              );
            })}

            {/* X-axis day indicators */}
            {[1, 8, 15, 22, 29].map((d) => {
              const idx = Math.min(d - 1, pacePoints.length - 1);
              if (idx < 0) return null;
              const x = getX(idx);
              return (
                <text
                  key={d}
                  x={x}
                  y={height - 6}
                  textAnchor="middle"
                  className="text-[9px] fill-[var(--muted)] font-mono font-semibold"
                >
                  {d}
                </text>
              );
            })}

            {/* Area Fill */}
            {areaPathD && (
              <path d={areaPathD} fill="var(--primary)" fillOpacity="0.08" />
            )}

            {/* Plan pace reference line */}
            {planPathD && (
              <path
                d={planPathD}
                fill="none"
                stroke="var(--muted)"
                strokeWidth="1.8"
                strokeDasharray="4,4"
              />
            )}

            {/* Main actual spent cumulative line */}
            {spentPathD && (
              <path
                d={spentPathD}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* End point dot */}
            {spentPts.length > 0 && (
              <circle
                cx={getX(count - 1)}
                cy={getY(pacePoints[count - 1].cumSpent)}
                r="3.5"
                fill="var(--primary)"
              />
            )}
          </svg>

          {/* Legend keys matching redesign */}
          <div className="flex items-center gap-4 mt-2 text-[11px] font-semibold text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <i className="w-3 h-0.5 rounded-full bg-[var(--primary)] block" />
              Spent so far
            </span>
            <span className="flex items-center gap-1.5">
              <i className="w-3 h-0.5 rounded-full bg-[var(--muted)] block" />
              Plan pace
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
