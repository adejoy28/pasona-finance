import React from "react";
import { ArrowDownLeft, Repeat, Check } from "lucide-react";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import type { RecurringBillDto } from "@/lib/api";
import { cn } from "@/lib/utils";

interface RecurringBillRowProps {
  bill: RecurringBillDto;
  currency: string;
  onMarkPaid?: (billId: number) => void;
  onDelete?: (billId: number) => void;
}

export function RecurringBillRow({ bill, currency, onMarkPaid }: RecurringBillRowProps) {
  const { renderAmount } = usePrivacyMode();
  const isIncome = bill.type === "income";

  let dueBadgeText = "";
  let dueBadgeClass = "bg-[var(--chip)] text-[var(--muted)]";

  if (bill.is_overdue) {
    const days = Math.abs(bill.days_until_due);
    dueBadgeText = `Overdue ${days} ${days === 1 ? "day" : "days"}`;
    dueBadgeClass = "bg-[var(--neg-soft)] text-[var(--neg)]";
  } else if (bill.is_due_today) {
    dueBadgeText = "Due today";
    dueBadgeClass = "bg-[var(--neg-soft)] text-[var(--neg)]";
  } else if (bill.days_until_due === 1) {
    dueBadgeText = "Tomorrow";
    dueBadgeClass = "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300";
  } else if (bill.days_until_due <= 7) {
    dueBadgeText = `In ${bill.days_until_due} days`;
    dueBadgeClass = "bg-[var(--chip)] text-[var(--muted)]";
  } else {
    const d = new Date(bill.next_due + "T00:00:00");
    dueBadgeText = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dueBadgeClass = "bg-[var(--chip)] text-[var(--muted)]";
  }

  const capitalize = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

  return (
    <div className="flex items-center gap-3 py-2.5 sm:py-3 border-b border-[var(--line)] last:border-b-0">
      {/* Icon */}
      <span
        className={cn(
          "w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0",
          isIncome
            ? "bg-[var(--pos-soft)] text-[var(--pos)]"
            : "bg-[var(--neg-soft)] text-[var(--neg)]"
        )}
      >
        {isIncome ? <ArrowDownLeft size={16} /> : <Repeat size={15} />}
      </span>

      {/* Bill Meta */}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-[var(--ink)] truncate">{bill.name}</div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] mt-0.5 flex-wrap">
          <span className={cn("inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-[4px]", dueBadgeClass)}>
            {dueBadgeText}
          </span>
          <span className="truncate">
            {capitalize(bill.frequency)} · {bill.account_name || "Account"}
          </span>
        </div>
      </div>

      {/* Amount */}
      <span
        className={cn(
          "text-sm font-extrabold tabular-nums shrink-0 whitespace-nowrap",
          isIncome ? "text-[var(--pos)]" : "text-[var(--ink)]"
        )}
      >
        {isIncome ? "+" : "-"}
        {renderAmount(bill.amount, currency)}
      </span>

      {/* Action: Mark Paid */}
      {onMarkPaid && (
        <button
          type="button"
          onClick={() => onMarkPaid(bill.id)}
          className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] px-2.5 py-1.5 rounded-[4px] border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--chip)] transition-colors active:scale-95"
        >
          <Check size={12} strokeWidth={2.5} />
          <span>{isIncome ? "Received" : "Paid"}</span>
        </button>
      )}
    </div>
  );
}
