import React from "react";
import { Link } from "react-router";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { cn } from "@/lib/utils";

export interface RecurringBill {
  id: string | number;
  name: string;
  amount: number;
  nextDue: string; // ISO date string YYYY-MM-DD
  categoryName?: string;
}

interface ComingUpCardProps {
  bills?: RecurringBill[];
  currency: string;
  className?: string;
}

export function ComingUpCard({ bills = [], currency, className = "" }: ComingUpCardProps) {
  const { renderAmount } = usePrivacyMode();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calculateDays = (isoDate: string) => {
    const target = new Date(isoDate);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  // Filter bills due in next 14 days or overdue
  const relevantBills = bills
    .filter((b) => {
      const days = calculateDays(b.nextDue);
      return days <= 14; // overdue (negative) or within 14 days
    })
    .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime());

  // Spec 5.6: If 0 bills: do not render the card
  if (relevantBills.length === 0) {
    return null;
  }

  const displayedBills = relevantBills.slice(0, 3);
  const totalCount = relevantBills.length;

  return (
    <div
      className={cn(
        "bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-3.5 sm:p-4 shadow-[var(--lift)] space-y-3",
        className
      )}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Coming up
        </h3>
        <Link
          to="/budgets?tab=recurring"
          className="text-xs font-bold text-[var(--primary)] hover:underline"
        >
          All recurring →
        </Link>
      </div>

      <div className="divide-y divide-[var(--line)]/60">
        {displayedBills.map((bill) => {
          const days = calculateDays(bill.nextDue);
          const isOverdue = days < 0;
          const overdueDays = Math.abs(days);

          return (
            <div
              key={bill.id}
              className="py-2 flex items-center justify-between gap-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {/* Small badge: red for overdue, amber for today, subtle chip for upcoming */}
                  {isOverdue ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[var(--neg-soft)] text-[var(--neg)] uppercase tracking-wider shrink-0">
                      Overdue {overdueDays}d
                    </span>
                  ) : days === 0 ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 uppercase tracking-wider shrink-0">
                      Due today
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--chip)] text-[var(--muted)] uppercase tracking-wider shrink-0">
                      In {days}d
                    </span>
                  )}
                  <b className="text-xs font-bold text-[var(--ink)] truncate">
                    {bill.name}
                  </b>
                </div>
                {bill.categoryName && (
                  <span className="text-[10px] text-[var(--muted)] block mt-0.5 pl-0.5 truncate">
                    {bill.categoryName}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  "font-bold text-xs tabular-nums shrink-0",
                  isOverdue ? "text-[var(--neg)] font-extrabold" : "text-[var(--ink)]"
                )}
              >
                {renderAmount(bill.amount, currency)}
              </span>
            </div>
          );
        })}
      </div>

      {totalCount > 3 && (
        <div className="pt-1 border-t border-[var(--line)]/40">
          <Link
            to="/budgets?tab=recurring"
            className="text-xs font-bold text-[var(--primary)] hover:underline inline-block"
          >
            See all {totalCount} bills →
          </Link>
        </div>
      )}
    </div>
  );
}
