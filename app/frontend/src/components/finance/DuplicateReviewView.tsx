import { useMemo, useState } from "react";
import { ChevronLeft, Check, X, Trash2, ShieldCheck } from "lucide-react";
import type { TransactionDto } from "@/lib/api/types";
import { transactions as transactionsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/finance";
import { notify } from "@/hooks/use-toast";
import {
  detectDuplicatePairs,
  dismissPair,
  restorePair,
  getTxSource,
  getDismissedPairIds,
  type DuplicatePair,
} from "@/lib/duplicate-detector";

interface DuplicateReviewViewProps {
  transactions: TransactionDto[];
  userCurrency: string;
  onRefresh: () => Promise<void> | void;
  onBack: () => void;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso.split("T")[0] || iso;
  }
}

export function DuplicateReviewView({
  transactions,
  userCurrency,
  onRefresh,
  onBack,
}: DuplicateReviewViewProps) {
  const [dismissedVersion, setDismissedVersion] = useState(0);
  const [busyPairId, setBusyPairId] = useState<string | null>(null);

  const openPairs = useMemo(() => {
    // dismissedVersion forces re-evaluation when dismissed state updates
    void dismissedVersion;
    const dismissed = getDismissedPairIds();
    return detectDuplicatePairs(transactions, dismissed);
  }, [transactions, dismissedVersion]);

  const handleKeepBoth = (pair: DuplicatePair) => {
    dismissPair(pair.id);
    setDismissedVersion((v) => v + 1);
    notify.success(pair.kind === "dup" ? "Kept both" : "Kept separate", {
      undo: () => {
        restorePair(pair.id);
        setDismissedVersion((v) => v + 1);
      },
    });
  };

  const handleRemoveOne = async (pair: DuplicatePair, target: TransactionDto) => {
    setBusyPairId(pair.id);
    try {
      await transactionsApi.deleteTransaction(target.id);
      dismissPair(pair.id);
      setDismissedVersion((v) => v + 1);

      notify.success("Duplicate removed", {
        undo: async () => {
          try {
            await transactionsApi.createTransaction({
              account_id: target.account_id,
              to_account_id: target.to_account_id ?? undefined,
              category_id: target.category_id ?? undefined,
              type: target.type,
              amount: Number(target.amount),
              description: target.description ?? undefined,
              reference: target.reference ?? undefined,
              transaction_date: target.transaction_date,
              force: true,
            });
            restorePair(pair.id);
            setDismissedVersion((v) => v + 1);
            await onRefresh();
          } catch {
            notify.error("Failed to restore transaction");
          }
        },
      });

      await onRefresh();
    } catch {
      notify.error("Failed to remove duplicate");
    } finally {
      setBusyPairId(null);
    }
  };

  const handleLinkTransfer = async (pair: DuplicatePair) => {
    setBusyPairId(pair.id);
    try {
      const fromTx = pair.a;
      const toTx = pair.b;

      const createdTransfer = await transactionsApi.createTransaction({
        account_id: fromTx.account_id,
        to_account_id: toTx.account_id,
        type: "transfer",
        amount: Number(fromTx.amount),
        transaction_date: fromTx.transaction_date,
        description:
          fromTx.description ||
          `Transfer from ${fromTx.account?.name || "Account"} to ${toTx.account?.name || "Account"}`,
        force: true,
      });

      await Promise.all([
        transactionsApi.deleteTransaction(fromTx.id),
        transactionsApi.deleteTransaction(toTx.id),
      ]);

      dismissPair(pair.id);
      setDismissedVersion((v) => v + 1);

      notify.success("Linked as one transfer", {
        undo: async () => {
          try {
            await transactionsApi.deleteTransaction(createdTransfer.id);
            await transactionsApi.createTransaction({
              account_id: fromTx.account_id,
              category_id: fromTx.category_id ?? undefined,
              type: fromTx.type,
              amount: Number(fromTx.amount),
              description: fromTx.description ?? undefined,
              reference: fromTx.reference ?? undefined,
              transaction_date: fromTx.transaction_date,
              force: true,
            });
            await transactionsApi.createTransaction({
              account_id: toTx.account_id,
              category_id: toTx.category_id ?? undefined,
              type: toTx.type,
              amount: Number(toTx.amount),
              description: toTx.description ?? undefined,
              reference: toTx.reference ?? undefined,
              transaction_date: toTx.transaction_date,
              force: true,
            });
            restorePair(pair.id);
            setDismissedVersion((v) => v + 1);
            await onRefresh();
          } catch {
            notify.error("Failed to undo link transfer");
          }
        },
      });

      await onRefresh();
    } catch {
      notify.error("Failed to link transactions as transfer");
    } finally {
      setBusyPairId(null);
    }
  };

  const renderSide = (pair: DuplicatePair, r: TransactionDto) => {
    const src = getTxSource(r);
    const amountVal = Number(r.amount);
    const isIncome = r.type === "income";

    return (
      <div className="border border-[var(--line)] rounded-xl p-3 bg-[var(--bg)] flex flex-col gap-1.5 min-w-0">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)]">
          {src}
        </span>
        <b className="text-[13px] font-bold text-[var(--ink)] break-words">
          {r.description || r.account?.name || "Transaction"}
        </b>
        <div className="text-[11px] text-[var(--muted)] truncate">
          {r.type === "transfer"
            ? `${r.account?.name || "Account"} → ${r.to_account?.name || "Target"}`
            : `${r.account?.name || "Account"} · ${r.category?.name || "Uncategorized"}`}
        </div>
        <div
          className={`font-extrabold font-mono text-[13px] ${
            isIncome ? "text-[var(--pos)]" : "text-[var(--ink)]"
          }`}
        >
          {isIncome ? "+" : "−"}
          {formatCurrency(amountVal, userCurrency)}
        </div>
        {pair.kind === "dup" && (
          <button
            type="button"
            disabled={busyPairId === pair.id}
            onClick={() => handleRemoveOne(pair, r)}
            className="self-start mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[var(--neg)] bg-[var(--neg-soft)] hover:opacity-85 px-2 py-1 rounded-[var(--r-sm)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={13} />
            <span>Remove this</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Back Crumb */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-text)] hover:underline cursor-pointer py-1"
      >
        <ChevronLeft size={16} />
        <span>History</span>
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="font-display font-semibold text-2xl tracking-tight text-[var(--ink)]">
            Duplicate review
          </h1>
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mt-0.5">
            {openPairs.length
              ? `${openPairs.length} ${openPairs.length === 1 ? "item" : "items"} waiting`
              : "All clear"}
          </div>
        </div>
      </div>

      <p className="text-xs text-[var(--muted)] leading-relaxed max-w-[62ch]">
        Pasona flags rows with the same date, type, amount and account. Nothing is removed until you
        choose. Two matching legs of one move between your accounts can be linked so neither counts
        as spending.
      </p>

      {openPairs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
          {openPairs.map((pair) => (
            <section
              key={pair.id}
              className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 shadow-[var(--lift)] flex flex-col gap-2.5"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display font-semibold text-[15px] text-[var(--ink)]">
                    {pair.kind === "dup" ? "Possible duplicate" : "Looks like one transfer"}
                  </h3>
                  <span className="text-[11px] font-medium text-[var(--muted)]">
                    {formatDate(pair.date)}
                  </span>
                </div>
              </div>

              {/* Match Chips */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {pair.matchChips.map((chip) => (
                  <span
                    key={chip.label}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-[var(--r-sm)] ${
                      chip.matched
                        ? "bg-[var(--pos-soft)] text-[var(--pos)]"
                        : "bg-[var(--chip)] text-[var(--muted)]"
                    }`}
                  >
                    {chip.matched ? <Check size={11} /> : <X size={11} />}
                    <span>{chip.label}</span>
                  </span>
                ))}
              </div>

              {/* Pair Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3.5 my-2">
                {renderSide(pair, pair.a)}
                {renderSide(pair, pair.b)}
              </div>

              {/* Resolution Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--line)]">
                {pair.kind === "dup" ? (
                  <button
                    type="button"
                    disabled={busyPairId === pair.id}
                    onClick={() => handleKeepBoth(pair)}
                    className="border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--bg)] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Keep both
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={busyPairId === pair.id}
                      onClick={() => handleLinkTransfer(pair)}
                      className="bg-[var(--primary)] text-white hover:opacity-90 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Link as one transfer
                    </button>
                    <button
                      type="button"
                      disabled={busyPairId === pair.id}
                      onClick={() => handleKeepBoth(pair)}
                      className="border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--bg)] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Keep separate
                    </button>
                  </>
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-8 text-center flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--info-soft)] text-[var(--accent-text)] flex items-center justify-center mb-1">
            <ShieldCheck size={28} />
          </div>
          <b className="text-sm font-bold text-[var(--ink)]">No possible duplicates</b>
          <span className="text-xs text-[var(--muted)] max-w-sm">
            Everything you add or import is checked against your history first.
          </span>
          <button
            type="button"
            onClick={onBack}
            className="mt-3 border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--bg)] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Back to history
          </button>
        </div>
      )}
    </div>
  );
}
