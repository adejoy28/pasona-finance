import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Check, Flame, ArrowRight, Loader2 } from "lucide-react";
import { notify } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { parseQuickLogSentence, calculateStreak } from "@/lib/quick-log";
import { transactions as transactionsApi, type TransactionDto } from "@/lib/api";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { DEFAULT_CURRENCY } from "@/lib/currencies";

interface AccountRef {
  id: number;
  name: string;
}

interface CategoryRef {
  id: number;
  name: string;
}

interface QuickLogCardProps {
  transactions: TransactionDto[];
  accounts: AccountRef[];
  categories: CategoryRef[];
  currency?: string;
  onRefresh?: () => void;
  className?: string;
}

export function QuickLogCard({
  transactions,
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

  // Today's transactions and total spend
  const todayTx = useMemo(
    () => transactions.filter((t) => t.transaction_date && t.transaction_date.slice(0, 10) === todayStr),
    [transactions, todayStr]
  );

  const todaySpent = useMemo(
    () =>
      todayTx
        .filter((t) => t.type === "expense" && t.category?.name !== "Savings")
        .reduce((sum, t) => sum + (typeof t.amount === "string" ? parseFloat(t.amount) : t.amount), 0),
    [todayTx]
  );

  const { streak, loggedToday } = useMemo(
    () => calculateStreak(transactions),
    [transactions]
  );

  // Top 3 distinct recent expenses for "Log again" chips (Addendum G4.2)
  const recentDistinctExpenses = useMemo(() => {
    const seen = new Set<string>();
    const rec: TransactionDto[] = [];
    const sorted = [...transactions].sort((a, b) => (a.transaction_date < b.transaction_date ? 1 : -1));

    for (const t of sorted) {
      if (t.type !== "expense" || t.category?.name === "Savings" || rec.length >= 3) continue;
      const key = `${t.description || ""}|${t.amount}|${t.account_id || t.account?.name || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rec.push(t);
    }
    return rec;
  }, [transactions]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFreeTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputVal.trim();
    if (!text) {
      navigate("/transactions/add");
      return;
    }

    const parsed = parseQuickLogSentence(text, accounts, categories);

    // If an amount is detected and an account is available, directly log it!
    const targetAccountId = parsed.accountName
      ? accounts.find((a) => a.name.toLowerCase() === parsed.accountName?.toLowerCase())?.id
      : (accounts.length === 1 ? accounts[0].id : accounts[0]?.id);

    const targetCategoryId = parsed.categoryName
      ? categories.find((c) => c.name.toLowerCase() === parsed.categoryName?.toLowerCase())?.id
      : undefined;

    if (parsed.amount && parsed.amount > 0 && targetAccountId) {
      setIsSubmitting(true);
      try {
        const desc = parsed.description || (parsed.type === "income" ? "Income" : "Expense");
        const created = await transactionsApi.createTransaction({
          amount: parsed.amount,
          type: parsed.type,
          description: desc,
          account_id: targetAccountId,
          category_id: targetCategoryId,
          transaction_date: todayStr,
        });

        setInputVal("");
        onRefresh?.();

        notify.success(`Logged ${desc} (${renderAmount(parsed.amount, currency)})`, {
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
        // Fallback to prefilled /transactions/add if direct log encounters validation error
        const params = new URLSearchParams();
        params.set("amount", String(parsed.amount));
        if (parsed.description) params.set("description", parsed.description);
        params.set("type", parsed.type);
        if (targetAccountId) params.set("account_id", String(targetAccountId));
        if (targetCategoryId) params.set("category_id", String(targetCategoryId));
        navigate(`/transactions/add?${params.toString()}`);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Otherwise, open /transactions/add with prefilled parameters
    const params = new URLSearchParams();
    if (parsed.amount) params.set("amount", String(parsed.amount));
    if (parsed.description) params.set("description", parsed.description);
    if (parsed.type) params.set("type", parsed.type);
    if (targetAccountId) params.set("account_id", String(targetAccountId));
    if (targetCategoryId) params.set("category_id", String(targetCategoryId));

    if (!parsed.amount) {
      notify.info("Enter the amount on the form.");
    }

    navigate(`/transactions/add?${params.toString()}`);
  };

  const handleLogAgain = async (item: TransactionDto) => {
    const itemAmount = typeof item.amount === "string" ? parseFloat(item.amount) : item.amount;
    const itemAccountId = item.account_id ?? accounts[0]?.id;

    // Check if duplicate already exists today for this amount & account
    const alreadyLoggedToday = todayTx.some(
      (t) =>
        t.type === "expense" &&
        t.account_id === itemAccountId &&
        Math.abs((typeof t.amount === "string" ? parseFloat(t.amount) : t.amount) - itemAmount) < 0.001
    );

    if (alreadyLoggedToday || !itemAccountId) {
      // Open prefilled form so user and duplicate guard can review
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

    // Direct one-tap log for today + Undo toast (Addendum G4.2)
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

  const isHighlighted = todayTx.length === 0;

  return (
    <section
      aria-label="Quick log"
      className={cn(
        "rounded-[6px] p-3.5 transition-all duration-300",
        "bg-[var(--surface)] border text-[var(--ink)] shadow-[var(--lift)]",
        isHighlighted
          ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/15"
          : "border-[var(--line)]",
        className
      )}
    >
      {/* Header: Status and Streak Chip */}
      <div className="flex justify-between items-start gap-2.5 mb-2.5">
        <div className="min-w-0">
          <h2 className="font-semibold text-sm text-[var(--ink)] leading-snug">
            {todayTx.length > 0
              ? `${todayTx.length} ${todayTx.length === 1 ? "transaction" : "transactions"} logged today`
              : "Nothing logged today"}
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            {todayTx.length > 0
              ? `You spent ${renderAmount(todaySpent, currency)} today. Anything else?`
              : "Log it now while you remember. It takes 10 seconds."}
          </p>
        </div>

        {/* Streak badge (.streak and .streak.on with 4px radius) */}
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
            {loggedToday ? `${streak} day streak` : `Keep your ${streak} day streak`}
          </span>
        </span>
      </div>

      {/* Quick Sentence Input Form */}
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
          disabled={isSubmitting}
          className="px-4 py-2 bg-[var(--primary)] text-white text-xs sm:text-sm font-bold rounded-[4px] transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <>
              <span>Log</span>
              <ArrowRight size={13} className="hidden sm:inline" />
            </>
          )}
        </button>
      </form>

      {/* Log again chips (.caprep with 4px radius) */}
      {recentDistinctExpenses.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mt-2.5 pt-2 border-t border-[var(--line)]/60">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)] mr-1 shrink-0">
            Log again
          </span>
          {recentDistinctExpenses.map((t) => {
            const amt = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
            const isItemLogging = loggingId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                disabled={Boolean(loggingId)}
                onClick={() => handleLogAgain(t)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-xs font-semibold bg-[var(--chip)] text-[var(--ink)] hover:bg-[var(--line)] transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isItemLogging && <Loader2 size={11} className="animate-spin text-[var(--primary)]" />}
                <span className="truncate max-w-[120px]">{t.description || "Expense"}</span>
                <span className="text-[var(--muted)]">·</span>
                <span className="font-bold tabular-nums">{renderAmount(amt, currency)}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
