import React from "react";
import { Plus } from "lucide-react";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import type { GoalDto } from "@/lib/api";

interface GoalCardProps {
  goal: GoalDto;
  currency: string;
  onAddMoney?: (goal: GoalDto) => void;
  onDelete?: (goalId: number) => void;
}

export function GoalCard({ goal, currency, onAddMoney, onDelete }: GoalCardProps) {
  const { renderAmount } = usePrivacyMode();

  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, goal.target_amount > 0 ? goal.saved_amount / goal.target_amount : 0));
  const strokeDashoffset = circumference * (1 - pct);
  const color = goal.color || "var(--c1, #2a78d6)";
  const isDone = goal.saved_amount >= goal.target_amount;

  const targetDateObj = new Date(goal.target_date + "T00:00:00");
  const targetFormatted = targetDateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  let note = `Needs ${renderAmount(goal.monthly_needed || 0, currency)} a month to reach ${targetFormatted}`;
  if (isDone) note = "Goal met";
  else if ((goal.days_remaining ?? 0) < 0) note = "Past the target date";

  return (
    <div className="flex items-center gap-3.5 bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-3.5 sm:p-4 shadow-[var(--lift)] transition-all">
      {/* Circular Progress Ring */}
      <div className="relative shrink-0 w-14 h-14 flex items-center justify-center">
        <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            strokeWidth="5.5"
            stroke="color-mix(in srgb, var(--chip) 70%, transparent)"
          />
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            strokeWidth="5.5"
            stroke={color}
            strokeDasharray={circumference.toFixed(1)}
            strokeDashoffset={strokeDashoffset.toFixed(1)}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold tabular-nums text-[var(--ink)]">
          {Math.round(pct * 100)}%
        </span>
      </div>

      {/* Goal Details */}
      <div className="min-w-0 flex-1">
        <b className="block text-sm font-bold text-[var(--ink)] truncate">{goal.name}</b>
        <span className="block text-xs font-bold text-[var(--muted)] tabular-nums mt-0.5">
          {renderAmount(goal.saved_amount, currency)} of {renderAmount(goal.target_amount, currency)}
        </span>
        <span className="block text-[11px] font-semibold text-[var(--muted)] mt-0.5 truncate">
          {note}
        </span>
      </div>

      {/* Action: Add Money */}
      {onAddMoney && !isDone && (
        <button
          type="button"
          onClick={() => onAddMoney(goal)}
          className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] px-2.5 py-1.5 rounded-[4px] border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--chip)] transition-colors active:scale-95"
        >
          <Plus size={13} strokeWidth={2.5} />
          <span>Add</span>
        </button>
      )}
    </div>
  );
}
