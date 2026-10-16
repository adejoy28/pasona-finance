import type { BankProfile } from "./types";

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

/**
 * Parses OPay date format: "04 Jan 2026 21:57:28" or "04 Jan 2026".
 * Returns YYYY-MM-DD or null on failure — never defaults to today.
 */
export function parseOpayDate(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Match: DD Mon YYYY (e.g. 04 Jan 2026)
  const match = trimmed.match(/^(\d{1,2})\s+([a-zA-Z]{3,9})\s+(\d{4})/);
  if (match) {
    const day = parseInt(match[1]!, 10);
    const monthStr = match[2]!.slice(0, 3).toLowerCase();
    const month = MONTH_NAMES[monthStr];
    const year = parseInt(match[3]!, 10);

    if (month !== undefined && isValidDate(year, month, day)) {
      return formatDate(year, month, day);
    }
  }

  // Fallback match: YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1]!, 10);
    const month = parseInt(isoMatch[2]!, 10);
    const day = parseInt(isoMatch[3]!, 10);
    if (isValidDate(year, month, day)) {
      return formatDate(year, month, day);
    }
  }

  return null;
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (year < 1990 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const test = new Date(Date.UTC(year, month - 1, day));
  return (
    test.getUTCFullYear() === year &&
    test.getUTCMonth() + 1 === month &&
    test.getUTCDate() === day
  );
}

function formatDate(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export const opayProfile: BankProfile = {
  name: "OPay",
  expectedHeaders: [
    "Trans. Date",
    "Description",
    "Debit",
    "Credit",
  ],
  columnMap: {
    date: "Trans. Date",
    description: "Description",
    moneyIn: "Credit",
    moneyOut: "Debit",
    amount: "Amount",
    drCr: "Transaction Type",
    reference: "Transaction Reference",
  },
  dateFormat: "DD MMM YYYY HH:mm:ss",
  parseDate: parseOpayDate,
};
