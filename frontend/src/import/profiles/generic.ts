import type { BankProfile } from "./types";

/**
 * Parses generic date strings into ISO YYYY-MM-DD.
 * Supports YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, and YYYY/MM/DD.
 * MUST return null on failure — never defaults to today.
 */
export function parseGenericDate(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1]!, 10);
    const month = parseInt(isoMatch[2]!, 10);
    const day = parseInt(isoMatch[3]!, 10);
    if (isValidDate(year, month, day)) {
      return formatDate(year, month, day);
    }
  }

  // 2. Day-first or Month-first: DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (slashMatch) {
    const p1 = parseInt(slashMatch[1]!, 10);
    const p2 = parseInt(slashMatch[2]!, 10);
    let p3 = parseInt(slashMatch[3]!, 10);
    if (p3 < 100) p3 += 2000;

    // Check if DD/MM/YYYY
    if (isValidDate(p3, p2, p1)) {
      return formatDate(p3, p2, p1);
    }
    // Check if MM/DD/YYYY
    if (isValidDate(p3, p1, p2)) {
      return formatDate(p3, p1, p2);
    }
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = parsed.getMonth() + 1;
    const d = parsed.getDate();
    if (isValidDate(y, m, d)) {
      return formatDate(y, m, d);
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

export const genericProfile: BankProfile = {
  name: "Generic CSV",
  expectedHeaders: ["Date", "Description", "Amount", "Type"],
  columnMap: {
    date: "Date",
    description: "Description",
    amount: "Amount",
    drCr: "Type",
  },
  dateFormat: "YYYY-MM-DD or DD/MM/YYYY",
  parseDate: parseGenericDate,
};
