import React from "react";
import { Link } from "react-router";
import { CreditCard, Wallet, Plus } from "lucide-react";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { cn } from "@/lib/utils";
import type { Account } from "@/lib/finance";

interface AccountsCardProps {
  accounts: Account[];
  totalBalance: number;
  currency: string;
  className?: string;
}

export function AccountsCard({
  accounts = [],
  totalBalance,
  currency,
  className = "",
}: AccountsCardProps) {
  const { renderAmount, renderCompactAmount } = usePrivacyMode();

  return (
    <div
      className={cn(
        "bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-3.5 sm:p-4 shadow-[var(--lift)] space-y-3",
        className
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Accounts
        </h3>
        <Link
          to="/accounts"
          className="text-xs font-bold text-[var(--primary)] hover:underline"
        >
          View all →
        </Link>
      </div>

      {accounts.length === 0 ? (
        <div className="py-6 text-center text-xs text-[var(--muted)] flex flex-col items-center justify-center gap-2">
          <span>No accounts yet</span>
          <Link
            to="/accounts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[var(--primary)] text-white text-xs font-bold hover:brightness-105 transition-all"
          >
            <Plus size={14} />
            <span>Add account</span>
          </Link>
        </div>
      ) : (
        <div className="flex overflow-x-auto gap-2.5 pb-1 -mx-1 px-1 scrollbar-hide">
          {accounts.map((account) => {
            const sharePct =
              totalBalance > 0 && account.balance > 0
                ? Math.min(100, Math.max(0, (account.balance / totalBalance) * 100)).toFixed(1)
                : "0";

            const isBank = account.type === "bank";
            const isMobile = account.type === "mobile";

            return (
              <Link
                key={account.id}
                to={`/accounts/${account.id}`}
                className="flex-shrink-0 w-32 bg-[var(--surface-2)]/40 hover:bg-[var(--chip)] p-2.5 rounded-[4px] border border-[var(--line)] space-y-1.5 block hover:border-[var(--primary)]/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "p-1 inline-flex rounded-[3px]",
                      isBank
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : isMobile
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {isBank ? <CreditCard size={13} /> : <Wallet size={13} />}
                  </div>
                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-[var(--muted)] bg-[var(--surface)] px-1 py-0.5 rounded-[3px] border border-[var(--line)]">
                    {account.type}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-[var(--muted)] truncate">
                    {account.name}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-[var(--ink)] truncate tabular-nums">
                    {renderCompactAmount(account.balance, currency)}
                  </p>
                </div>

                <div className="h-1 w-full rounded-full bg-[var(--line)]/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                    style={{ width: `${sharePct}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
