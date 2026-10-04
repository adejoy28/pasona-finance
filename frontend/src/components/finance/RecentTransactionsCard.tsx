import React from "react";
import { Link } from "react-router";
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, ChevronRight, Plus } from "lucide-react";
import { type TransactionDto } from "@/lib/api";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { cn } from "@/lib/utils";

interface RecentTransactionsCardProps {
  transactions: TransactionDto[];
  currency: string;
  className?: string;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecentTransactionsCard({
  transactions,
  currency,
  className = "",
}: RecentTransactionsCardProps) {
  const { renderAmount } = usePrivacyMode();
  const recent = transactions.slice(0, 5);

  return (
    <section
      aria-label="Recent transactions"
      className={cn(
        "rounded-[6px] p-4 sm:p-5 shadow-[var(--lift)] transition-all",
        "bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)]",
        className
      )}
    >
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-semibold text-sm sm:text-base text-[var(--ink)] leading-snug">
            Recent activity
          </h3>
          <p className="text-[11px] font-semibold text-[var(--muted)] mt-0.5">
            Latest logged transactions
          </p>
        </div>
        <Link
          to="/transactions"
          className="text-xs font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-0.5"
        >
          <span>View all</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-[var(--line)] rounded-[6px] p-4">
          <p className="text-xs font-semibold text-[var(--muted)]">No transactions logged yet</p>
          <Link
            to="/transactions/add"
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[var(--primary)] text-white text-xs font-bold hover:brightness-105 active:scale-95 transition-all"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Add transaction</span>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[var(--line)]/60 text-xs">
          {recent.map((tx) => {
            const rawAmt = typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;
            const isIncome = tx.type === "income";
            const isTransfer = tx.type === "transfer";

            return (
              <Link
                key={tx.id}
                to={`/transactions/${tx.id}`}
                className="py-2.5 flex items-center justify-between gap-3 group hover:opacity-85 transition-opacity"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-[4px] flex items-center justify-center shrink-0",
                      isIncome
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : isTransfer
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
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
                      {tx.description || tx.category?.name || "Transaction"}
                    </p>
                    <p className="text-[10.5px] text-[var(--muted)] truncate">
                      {tx.account?.name ?? "Account"}
                      {tx.category?.name ? ` · ${tx.category.name}` : ""}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "text-xs font-bold tabular-nums",
                      isIncome ? "text-[var(--pos)]" : "text-[var(--ink)]"
                    )}
                  >
                    {isIncome ? "+" : isTransfer ? "" : "−"}
                    {renderAmount(rawAmt, currency)}
                  </p>
                  <p className="text-[10px] text-[var(--muted)]">
                    {formatDate(tx.transaction_date)}
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
