import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Check, Flame, ArrowRight } from "lucide-react";
import { notify } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { parseQuickLogSentence } from "@/lib/quick-log";
import { transactions as transactionsApi, type TransactionDto } from "@/lib/api";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { toNumber } from "@/lib/dashboard-math";

interface AccountRef {
  id: number;
  name: string;
}

interface CategoryRef {
  id: number;
  name: string;
}

interface QuickLogCardProps {
  todayCount: number;
  todaySpent: number;
  loggedToday: boolean;
  streakDays: number;
  recentTransactions: TransactionDto[];
  accounts: AccountRef[];
  categories: CategoryRef[];
  currency?: string;
  onRefresh?: () => void;
  className?: string;
}

export function QuickLogCard({
  todayCount,
  todaySpent,
  loggedToday,
  streakDays,
  recentTransactions,
  accounts,
  categories,
  currency = DEFAULT_CURRENCY,
  onRefresh,
  className = "",
}: QuickLogCardProps) {
  const navigate = useNavigate();
  const { renderAmount } = usePrivacyMode();
  const [inputVal, setInputVal] = useState("");
  const [loggingId, setLoggingId] = useState<string | number | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Top 3 distinct recent expenses for "Log again" chips
  // Distinct by description + amount + account
  const recentDistinctExpenses = useMemo(() => {
    const seen = new Set<string>();
    const rec: { tx: TransactionDto; label: string }[] = [];
    const sorted = [...recentTransactions].sort((a, b) =>
      a.transaction_date < b.transaction_date ? 1 : -1
    );

    for (const t of sorted) {
      if (t.type !== "expense") continue;
      const amt = Math.abs(toNumber(t.amount));
      if (amt <= 0) continue;

      const desc = (t.description || "").trim();
      const cat = (t.category?.name || "").trim();
      const accId = t.account_id ?? "";

      // Label format: {description} · NGN {amount}. Fallback to {category} · NGN {amount}.
      // If still empty or only "Expense", do NOT show that chip.
      let titlePart = desc;
      if (!titlePart && cat && cat.toLowerCase() !== "expense") {
        titlePart = cat;
      }
      if (!titlePart || titlePart.toLowerCase() === "expense") {
        continue;
      }

      const key = `${titlePart.toLowerCase()}_${amt}_${accId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rec.push({
        tx: t,
        label: `${titlePart} · ${renderAmount(amt, currency)}`,
      });

      if (rec.length >= 3) break;
    }

    return rec;
  }, [recentTransactions, renderAmount, currency]);

  // Sentence submission: NEVER saves directly from free text per Spec 5.2.
  // Parses sentence and opens /transactions/add prefilled.
  const handleFreeTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputVal.trim();
    if (!text) return;

    const parsed = parseQuickLogSentence(text);

    // Resolve matching account
    let targetAccountId = "";
    if (parsed.accountName) {
      const lower = parsed.accountName.toLowerCase();
      const matched = accounts.find((a) => a.name.toLowerCase().includes(lower));
      if (matched) targetAccountId = String(matched.id);
    }

    // Resolve matching category
    let targetCategoryId = "";
    if (parsed.categoryName) {
      const lower = parsed.categoryName.toLowerCase();
      const matched = categories.find((c) => c.name.toLowerCase().includes(lower));
      if (matched) targetCategoryId = String(matched.id);
    }

    const params = new URLSearchParams();
    if (parsed.amount) {
      params.set("amount", String(parsed.amount));
    }
    if (parsed.description) {
      params.set("description", parsed.description);
    }
    params.set("type", parsed.type || "expense");
    if (targetAccountId) {
      params.set("account_id", targetAccountId);
    }
    if (targetCategoryId) {
      params.set("category_id", targetCategoryId);
    }

    if (!parsed.amount) {
      notify.info("Enter the amount on the form.");
    }

    navigate(`/transactions/add?${params.toString()}`);
  };

  // Log Again: 1-tap logs for today unless already logged today for this amount & account
  const handleLogAgain = async (item: TransactionDto) => {
    const itemAmount = Math.abs(toNumber(item.amount));
    const itemAccountId = item.account_id ?? accounts[0]?.id;

    // Check if duplicate already exists today
    const alreadyLoggedToday = recentTransactions.some(
      (t) =>
        t.transaction_date &&
        t.transaction_date.slice(0, 10) === todayStr &&
        t.type === "expense" &&
        t.account_id === itemAccountId &&
        Math.abs(Math.abs(toNumber(t.amount)) - itemAmount) < 0.001
    );

    if (alreadyLoggedToday || !itemAccountId) {
      const params = new URLSearchParams({
        amount: String(itemAmount),
        description: item.description || "",
        type: "expense",
        account_id: String(itemAccountId || ""),
        category_id: String(item.category_id || ""),
      });
      navigate(`/transactions/add?${params.toString()}`);
      return;
    }

    setLoggingId(item.id);
    try {
      const created = await transactionsApi.createTransaction({
        amount: itemAmount,
        type: "expense",
        description: item.description || undefined,
        account_id: itemAccountId,
        category_id: item.category_id || undefined,
        transaction_date: todayStr,
      });

      onRefresh?.();

      notify.success(`Logged ${item.description || "expense"}`, {
        undo: async () => {
          try {
            await transactionsApi.deleteTransaction(created.id);
            notify.info("Log undone");
            onRefresh?.();
          } catch {
            notify.error("Failed to undo transaction");
          }
        },
      });
    } catch {
      notify.error("Unable to log transaction. Try from the add form.");
      const params = new URLSearchParams({
        amount: String(itemAmount),
        description: item.description || "",
        type: "expense",
        account_id: String(itemAccountId),
      });
      navigate(`/transactions/add?${params.toString()}`);
    } finally {
      setLoggingId(null);
    }
  };

  const isHighlighted = todayCount === 0;

  return (
    <section
      aria-label="Quick log"
      className={cn(
        "rounded-[6px] p-4 sm:p-5 transition-all shadow-[var(--lift)] flex flex-col justify-between",
        "bg-[var(--surface)] border text-[var(--ink)]",
        isHighlighted
          ? "border-[var(--primary)] ring-1 ring-[var(--primary)]/20"
          : "border-[var(--line)]",
        className
      )}
    >
      <div>
        {/* Header: Status and Streak Chip */}
        <div className="flex justify-between items-start gap-2.5 mb-2.5">
          <div className="min-w-0">
            <h2 className="font-semibold text-sm sm:text-base text-[var(--ink)] leading-snug">
              {todayCount > 0
                ? `${todayCount} ${todayCount === 1 ? "transaction" : "transactions"} logged today`
                : "Nothing logged today"}
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {todayCount === 0
                ? "Log it now while you remember. It takes 10 seconds."
                : todaySpent > 0
                ? `You spent ${renderAmount(todaySpent, currency)} today. Anything else?`
                : "Anything else?"}
            </p>
          </div>

          {/* Streak chip: before logging today "Keep your n day streak" (only if n >= 1);
              after logging "n day streak". If streak is 0 and nothing logged, show no chip. */}
          {((loggedToday && streakDays > 0) || (!loggedToday && streakDays >= 1)) && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-[4px] shrink-0 transition-colors whitespace-nowrap",
                loggedToday
                  ? "bg-[var(--pos-soft)] text-[var(--pos)]"
                  : "bg-[var(--chip)] text-[var(--muted)]"
              )}
              title={loggedToday ? "Streak updated for today" : "Log today to keep your streak"}
            >
              {loggedToday ? (
                <Check size={12} className="stroke-[3]" />
              ) : (
                <Flame size={12} className="text-amber-500 fill-amber-500" />
              )}
              <span>
                {loggedToday ? `${streakDays} day streak` : `Keep your ${streakDays} day streak`}
              </span>
            </span>
          )}
        </div>

        {/* Free-text form: parses sentence and opens /transactions/add prefilled */}
        <form onSubmit={handleFreeTextSubmit} className="flex gap-2">
          <input
            id="cap-in"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Spent 2,500 on lunch from OPay"
            autoComplete="off"
            aria-label="Quick log a transaction"
            className="flex-1 min-w-0 bg-[var(--bg)] border border-[var(--line)] rounded-[4px] px-3 py-2 text-xs sm:text-sm font-medium text-[var(--ink)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--primary)] text-white text-xs sm:text-sm font-bold rounded-[4px] transition-all hover:brightness-105 active:scale-95 shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <span>Log</span>
            <ArrowRight size={13} className="hidden sm:inline" />
          </button>
        </form>
      </div>

      {/* Log again row: up to 3 chips */}
      {recentDistinctExpenses.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2.5 border-t border-[var(--line)]/60">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)] mr-1 shrink-0">
            Log again
          </span>
          {recentDistinctExpenses.map(({ tx, label }) => (
            <button
              key={tx.id}
              type="button"
              disabled={loggingId === tx.id}
              onClick={() => void handleLogAgain(tx)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-semibold bg-[var(--chip)] text-[var(--ink)] hover:bg-[var(--line)] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
