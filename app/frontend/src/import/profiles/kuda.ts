import type { BankProfile } from "./types";

/**
 * Parses Kuda date format: DD/MM/YY HH:mm:ss, DD/MM/YYYY, DD-MM-YYYY, ISO, or Excel serial numbers.
 * Returns YYYY-MM-DD or null on failure — never defaults to today.
 */
export function parseKudaDate(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  // 1. Handle Excel serial date numbers (e.g. 45457.43)
  if (/^\d{5}(\.\d+)?$/.test(trimmed)) {
    const serial = parseFloat(trimmed);
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime()) && date.getUTCFullYear() >= 1990 && date.getUTCFullYear() <= 2100) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }

  // 2. Match DD/MM/YY or DD/MM/YYYY or DD-MM-YYYY with optional time
  const match = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (match) {
    const day = parseInt(match[1]!, 10);
    const month = parseInt(match[2]!, 10);
    let year = parseInt(match[3]!, 10);
    if (year < 100) year += 2000;

    if (isValidDate(year, month, day)) {
      return formatDate(year, month, day);
    }
  }

  // 3. Fallback ISO YYYY-MM-DD
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

export const kudaProfile: BankProfile = {
  name: "Kuda Bank",
  expectedHeaders: [
    "Date/Time",
    "Money In",
    "Money Out",
  ],
  columnMap: {
    date: "Date/Time",
    description: "Description",
    moneyIn: "Money In",
    moneyOut: "Money Out",
    reference: "Reference",
  },
  dateFormat: "DD/MM/YY HH:mm:ss",
  parseDate: parseKudaDate as (raw: string) => string | null,
};
