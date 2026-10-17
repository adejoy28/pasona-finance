import type { TransactionDto } from "./api/types";

export type MatchChip = {
  label: string;
  matched: boolean;
};

export type DuplicatePairKind = "dup" | "transfer";

export interface DuplicatePair {
  id: string;
  kind: DuplicatePairKind;
  a: TransactionDto;
  b: TransactionDto;
  matchChips: MatchChip[];
  date: string;
}

const STORAGE_KEY = "pasona.duplicate_review_dismissed";

export function getDismissedPairIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function dismissPair(pairId: string): void {
  if (typeof window === "undefined") return;
  try {
    const set = getDismissedPairIds();
    set.add(pairId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new CustomEvent("pasona:duplicates-changed"));
  } catch {
    // ignore local storage errors
  }
}

export function restorePair(pairId: string): void {
  if (typeof window === "undefined") return;
  try {
    const set = getDismissedPairIds();
    set.delete(pairId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new CustomEvent("pasona:duplicates-changed"));
  } catch {
    // ignore
  }
}

export function getTxSource(tx: TransactionDto): "import" | "alert" | "mary" | "typed" {
  if (typeof window !== "undefined") {
    try {
      const meta = localStorage.getItem(`pasona.tx_meta:${tx.id}`);
      if (meta) {
        const parsed = JSON.parse(meta);
        if (parsed.source) return parsed.source;
      }
    } catch {
      // ignore
    }
  }

  const ref = (tx.reference || "").toUpperCase();
  if (ref.includes("IMPORT") || ref.includes("OPAY") || ref.includes("KUDA") || ref.includes("CSV")) {
    return "import";
  }
  if (ref.includes("ALERT") || ref.includes("SMS")) {
    return "alert";
  }
  if (ref.includes("MARY")) {
    return "mary";
  }
  return "typed";
}

function normalizeDay(dateStr: string): string {
  if (!dateStr) return "";
  return dateStr.split("T")[0].split(" ")[0];
}

function normalizeAmount(val: number | string): number {
  const num = typeof val === "number" ? val : parseFloat(String(val));
  return isNaN(num) ? 0 : Math.round(Math.abs(num) * 100) / 100;
}

export function computeDuplicateChips(a: TransactionDto, b: TransactionDto): MatchChip[] {
  const sameDate = normalizeDay(a.transaction_date) === normalizeDay(b.transaction_date);
  const sameAmount = normalizeAmount(a.amount) === normalizeAmount(b.amount);
  const sameAccount = a.account_id === b.account_id;
  const sameType = a.type === b.type;
  const descA = (a.description || "").trim().toLowerCase();
  const descB = (b.description || "").trim().toLowerCase();
  const sameDesc = descA === descB;

  return [
    { label: "Same date", matched: sameDate },
    { label: "Same amount", matched: sameAmount },
    { label: "Same account", matched: sameAccount },
    { label: "Same type", matched: sameType },
    { label: sameDesc ? "Same description" : "Descriptions differ", matched: sameDesc },
  ];
}

export function computeTransferChips(a: TransactionDto, b: TransactionDto): MatchChip[] {
  const sameDay = normalizeDay(a.transaction_date) === normalizeDay(b.transaction_date);
  const sameAmount = normalizeAmount(a.amount) === normalizeAmount(b.amount);
  const oppositeDirections = (a.type === "expense" && b.type === "income") || (a.type === "income" && b.type === "expense");
  const differentAccounts = a.account_id !== b.account_id;

  return [
    { label: "Same day", matched: sameDay },
    { label: "Same amount", matched: sameAmount },
    { label: "Opposite directions", matched: oppositeDirections },
    { label: "Different accounts", matched: differentAccounts },
  ];
}

export function detectDuplicatePairs(
  transactions: TransactionDto[],
  dismissed: Set<string> = getDismissedPairIds()
): DuplicatePair[] {
  const pairs: DuplicatePair[] = [];
  const handledIds = new Set<string>();

  // 1. Detect duplicate candidates (same day, same amount, same account, same type)
  for (let i = 0; i < transactions.length; i++) {
    const a = transactions[i];
    if (a.type === "transfer") continue;

    for (let j = i + 1; j < transactions.length; j++) {
      const b = transactions[j];
      if (b.type === "transfer") continue;

      const sameDay = normalizeDay(a.transaction_date) === normalizeDay(b.transaction_date);
      const sameAmount = normalizeAmount(a.amount) === normalizeAmount(b.amount);
      const sameAccount = a.account_id === b.account_id;
      const sameType = a.type === b.type;

      if (sameDay && sameAmount && sameAccount && sameType) {
        const pairId = `dup_${Math.min(a.id, b.id)}_${Math.max(a.id, b.id)}`;
        if (!dismissed.has(pairId) && !handledIds.has(pairId)) {
          handledIds.add(pairId);
          pairs.push({
            id: pairId,
            kind: "dup",
            a,
            b,
            date: a.transaction_date,
            matchChips: computeDuplicateChips(a, b),
          });
        }
      }
    }
  }

  // 2. Detect transfer candidates (same day, same amount, different accounts, opposite types)
  for (let i = 0; i < transactions.length; i++) {
    const a = transactions[i];
    if (a.type !== "expense" && a.type !== "income") continue;

    for (let j = i + 1; j < transactions.length; j++) {
      const b = transactions[j];
      if (b.type !== "expense" && b.type !== "income") continue;

      const sameDay = normalizeDay(a.transaction_date) === normalizeDay(b.transaction_date);
      const sameAmount = normalizeAmount(a.amount) === normalizeAmount(b.amount);
      const differentAccounts = a.account_id !== b.account_id;
      const oppositeTypes = a.type !== b.type;

      if (sameDay && sameAmount && differentAccounts && oppositeTypes) {
        const pairId = `tr_${Math.min(a.id, b.id)}_${Math.max(a.id, b.id)}`;
        if (!dismissed.has(pairId) && !handledIds.has(pairId)) {
          handledIds.add(pairId);
          // Order pair so that expense is 'a' (from) and income is 'b' (to)
          const first = a.type === "expense" ? a : b;
          const second = a.type === "expense" ? b : a;
          pairs.push({
            id: pairId,
            kind: "transfer",
            a: first,
            b: second,
            date: first.transaction_date,
            matchChips: computeTransferChips(first, second),
          });
        }
      }
    }
  }

  return pairs;
}
