import React from "react";
import { Link } from "react-router";
import { Target } from "lucide-react";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { cn } from "@/lib/utils";

export interface GoalItem {
  id: string | number;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string;
  color?: string;
}

interface GoalsPreviewCardProps {
  goals?: GoalItem[];
  currency: string;
  className?: string;
}

export function GoalsPreviewCard({
  goals = [],
  currency,
  className = "",
}: GoalsPreviewCardProps) {
  const { renderAmount } = usePrivacyMode();

  return (
    <section aria-label="Goals" className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center px-1">
        <h3 className="font-display font-semibold text-sm sm:text-base text-[var(--ink)] leading-none">
          Goals
        </h3>
        <Link
          to="/categories"
          className="text-xs font-bold text-[var(--primary)] hover:underline"
        >
          All goals
        </Link>
      </div>

      {goals.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-3.5 sm:p-4 shadow-[var(--lift)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-[var(--muted)] font-medium text-center sm:text-left">
            Set savings targets for rent, emergencies or gifts.
          </span>
          <Link
            to="/categories"
            className="px-3 py-1.5 rounded-[4px] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--chip)] font-bold shrink-0 transition-colors"
          >
            Create goal
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.savedAmount / Math.max(g.targetAmount, 1)) * 100));
            return (
              <div
                key={g.id}
                className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-3.5 shadow-[var(--lift)] space-y-2"
              >
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-xs font-bold text-[var(--ink)] truncate">
                    {g.name}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--muted)] tabular-nums">
                    {pct}%
                  </span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-[var(--chip)] overflow-hidden">
                  <div
                    style={{ width: `${pct}%`, backgroundColor: g.color || "var(--primary)" }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>

                <div className="flex justify-between items-baseline text-[11px] text-[var(--muted)] tabular-nums">
                  <span className="font-semibold text-[var(--ink)]">
                    {renderAmount(g.savedAmount, currency)}
                  </span>
                  <span>of {renderAmount(g.targetAmount, currency)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
