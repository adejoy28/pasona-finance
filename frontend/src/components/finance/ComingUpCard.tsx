import React from "react";
import { Link } from "react-router";
import { Calendar, ChevronRight } from "lucide-react";
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

  return (
    <section aria-label="Coming up" className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center px-1">
        <h3 className="font-display font-semibold text-sm sm:text-base text-[var(--ink)] leading-none">
          Coming up
        </h3>
        <Link
          to="/categories"
          className="text-xs font-bold text-[var(--primary)] hover:underline"
        >
          All recurring →
        </Link>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 shadow-xs">
        {bills.length === 0 ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[var(--muted)] font-medium text-center sm:text-left">
              Add recurring bills and Pasona shows what's due.
            </span>
            <Link
              to="/settings"
              className="px-3 py-1.5 rounded-xl border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--chip)] font-bold shrink-0 transition-colors"
            >
              Add recurring
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]/60">
            {bills.map((bill) => {
              const days = calculateDays(bill.nextDue);
              const isOverdue = days < 0;
              const overdueDays = Math.abs(days);

              return (
                <div
                  key={bill.id}
                  className="py-2.5 flex items-center justify-between gap-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {/* Small OVERDUE badge plus n days per Phase 4.5 (No filled red row) */}
                      {isOverdue ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[var(--neg-soft)] text-[var(--neg)] uppercase tracking-wider">
                          Overdue {overdueDays}d
                        </span>
                      ) : days === 0 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 uppercase tracking-wider">
                          Due today
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--chip)] text-[var(--muted)] uppercase tracking-wider">
                          In {days}d
                        </span>
                      )}
                      <b className="text-xs font-bold text-[var(--ink)] truncate">
                        {bill.name}
                      </b>
                    </div>
                    {bill.categoryName && (
                      <span className="text-[10px] text-[var(--muted)] block mt-0.5">
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
        )}
      </div>
    </section>
  );
}
