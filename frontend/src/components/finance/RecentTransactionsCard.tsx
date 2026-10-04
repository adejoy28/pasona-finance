import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, ChevronRight } from "lucide-react";
import { type TransactionDto } from "@/lib/api";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { toNumber } from "@/lib/dashboard-math";
import { cn } from "@/lib/utils";

interface RecentTransactionsCardProps {
  transactions?: TransactionDto[];
  currency: string;
  className?: string;
}

function formatDateLabel(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export function RecentTransactionsCard({
  transactions = [],
  currency,
  className = "",
}: RecentTransactionsCardProps) {
  const { renderAmount } = usePrivacyMode();
  const recent = transactions.slice(0, 5);

  // Track highlighted transaction id for 1.5s after addition
  const [highlightId, setHighlightId] = useState<number | null>(null);

  useEffect(() => {
    if (recent.length > 0) {
      const topId = recent[0].id;
      // If we observe a newly prepended transaction, highlight for 1.5s
      const timer = setTimeout(() => {
        setHighlightId(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [recent.length > 0 ? recent[0].id : null]);

  return (
    <section
      aria-label="Recent activity"
      className={cn(
        "rounded-[6px] p-4 sm:p-5 shadow-[var(--lift)] transition-all",
        "bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)]",
        className
      )}
    >
      {/* Header: Title "Recent activity", link "View all" to History */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm sm:text-base text-[var(--ink)] leading-snug">
          Recent activity
        </h3>
        <Link
          to="/transactions"
          className="text-xs font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-0.5"
        >
          <span>View all</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="py-5 text-center">
          <p className="text-xs text-[var(--muted)]">Your first transaction will show up here.</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--line)]/60 text-xs">
          {recent.map((tx) => {
            const rawAmt = Math.abs(toNumber(tx.amount));
            const isIncome = tx.type === "income";
            const isTransfer = tx.type === "transfer";
            const isHighlighted = highlightId === tx.id;

            // Row description (fallback: category)
            const desc = tx.description || tx.category?.name || "Transaction";

            // Second line: {account} · {category} or {from_account} to {to_account}
            const accountName = tx.account?.name || "Account";
            const categoryName = tx.category?.name;
            const subtitle = isTransfer
              ? `${accountName} to ${tx.to_account?.name || "Account"}`
              : categoryName
              ? `${accountName} · ${categoryName}`
              : accountName;

            return (
              <Link
                key={tx.id}
                to={`/transactions/${tx.id}`}
                className={cn(
                  "py-2.5 flex items-center justify-between gap-3 group transition-colors rounded-[4px] px-1 -mx-1",
                  isHighlighted ? "bg-[var(--pos-soft)]/40" : "hover:bg-[var(--chip)]/50"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-[4px] flex items-center justify-center shrink-0",
                      isIncome
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : isTransfer
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-[var(--chip)] text-[var(--muted)]"
                    )}
                  >
                    {isIncome ? (
                      <ArrowDownLeft size={14} />
                    ) : isTransfer ? (
                      <ArrowRightLeft size={14} />
                    ) : (
                      <ArrowUpRight size={14} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--ink)] truncate group-hover:text-[var(--primary)] transition-colors">
                      {desc}
                    </p>
                    <p className="text-[10.5px] text-[var(--muted)] truncate mt-0.5">
                      {subtitle}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "text-xs font-bold tabular-nums",
                      isIncome
                        ? "text-[var(--pos)]"
                        : isTransfer
                        ? "text-[var(--ink)]"
                        : "text-[var(--ink)]"
                    )}
                  >
                    {isIncome ? "+" : isTransfer ? "" : "−"}
                    {renderAmount(rawAmt, currency)}
                  </p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">
                    {formatDateLabel(tx.transaction_date)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
