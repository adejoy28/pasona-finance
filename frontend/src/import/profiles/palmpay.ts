import type { BankProfile } from "./types";

/**
 * Parses PalmPay date format: "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD".
 * Returns YYYY-MM-DD or null on failure — never defaults to today.
 */
export function parsePalmPayDate(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!match) return null;

  const year = parseInt(match[1]!, 10);
  const month = parseInt(match[2]!, 10);
  const day = parseInt(match[3]!, 10);

  if (year < 1990 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const test = new Date(Date.UTC(year, month - 1, day));
  if (
    test.getUTCFullYear() !== year ||
    test.getUTCMonth() + 1 !== month ||
    test.getUTCDate() !== day
  ) {
    return null;
  }

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export const palmpayProfile: BankProfile = {
  name: "PalmPay",
  expectedHeaders: [
    "Transaction Time",
    "Type",
    "Amount",
    "Description",
    "Order No.",
  ],
  columnMap: {
    date: "Transaction Time",
    description: "Description",
    amount: "Amount",
    drCr: "Type",
    reference: "Order No.",
  },
  dateFormat: "YYYY-MM-DD HH:mm:ss",
  parseDate: parsePalmPayDate,
};
