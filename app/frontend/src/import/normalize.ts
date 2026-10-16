import type { BankProfile } from "./profiles/types";

export interface NormalizedRow {
  uuid: string;
  date: string;
  description: string;
  amount: number;
  drCr: "dr" | "cr";
  dateError: boolean;
  reference?: string;
  sheet?: string;
}

export interface HeaderValidationResult {
  valid: boolean;
  error?: string;
  matchedHeaders?: string[];
}

/**
 * Normalizes header string to lowercase alphanumeric only for resilient matching.
 * e.g. "Money In (₦)" -> "moneyin", "Date / Time" -> "datetime"
 */
export function canonicalHeader(header: string): string {
  return header.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

/**
 * Validates whether the given CSV/XLSX headers match the profile's expectedHeaders.
 * Uses canonical matching to ignore currency symbols, punctuation, and extra whitespace.
 */
export function validateHeaders(
  headers: string[],
  profile: BankProfile,
): HeaderValidationResult {
  if (!headers || headers.length === 0) {
    return {
      valid: false,
      error: `This doesn't look like a ${profile.name} statement: no headers found.`,
    };
  }

  const canonHeaders = new Set(headers.map(canonicalHeader).filter(Boolean));

  const missing = profile.expectedHeaders.filter((expected) => {
    const canonExp = canonicalHeader(expected);
    if (canonHeaders.has(canonExp)) return false;
    for (const h of canonHeaders) {
      if (h.includes(canonExp) || canonExp.includes(h)) return false;
    }
    return true;
  });

  // If more than half the expected headers or primary columns are missing, reject
  if (missing.length > 0 && missing.length >= Math.ceil(profile.expectedHeaders.length / 2)) {
    return {
      valid: false,
      error: `This doesn't look like a ${profile.name} statement. Missing columns: ${missing.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Generate a cryptographically secure or pseudo-random UUID v4 string client-side.
 */
export function generateRowUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Strip ₦ symbols, commas, spaces, currency symbols, parentheses, and parse float.
 */
export function parseCleanAmount(raw: unknown): number {
  if (typeof raw === "number") return Math.abs(raw);
  if (!raw) return 0;
  const str = String(raw).trim();
  if (!str || str === "--" || str === "-") return 0;
  const cleaned = str.replace(/[₦,$\s()]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

/**
 * Normalizes raw parsed CSV/XLSX row objects according to the bank profile.
 */
export function normalizeRows(
  rawRows: (Record<string, string> & { __sheet?: string })[],
  profile: BankProfile,
): NormalizedRow[] {
  const normalized: NormalizedRow[] = [];

  // Helper for resilient column lookup (exact -> lowercase -> canonical -> partial)
  const getVal = (row: Record<string, string>, colName?: string): string => {
    if (!colName) return "";
    if (colName in row && row[colName] !== undefined && row[colName] !== "") {
      return String(row[colName]).trim();
    }
    const lower = colName.toLowerCase();
    for (const key of Object.keys(row)) {
      if (key === "__sheet") continue;
      if (key.trim().toLowerCase() === lower) {
        return String(row[key] ?? "").trim();
      }
    }
    const canon = canonicalHeader(colName);
    for (const key of Object.keys(row)) {
      if (key === "__sheet") continue;
      if (canonicalHeader(key) === canon) {
        return String(row[key] ?? "").trim();
      }
    }
    for (const key of Object.keys(row)) {
      if (key === "__sheet") continue;
      const kCanon = canonicalHeader(key);
      if (kCanon.includes(canon) || canon.includes(kCanon)) {
        return String(row[key] ?? "").trim();
      }
    }
    return "";
  };

  for (const row of rawRows) {
    // Skip empty rows
    const values = Object.entries(row)
      .filter(([k]) => k !== "__sheet")
      .map(([, v]) => String(v ?? "").trim());
    if (values.every((v) => !v)) {
      continue;
    }

    const rawDate = getVal(row, profile.columnMap.date);
    const parsedDate = profile.parseDate(rawDate);
    const dateError = parsedDate === null;
    const date = parsedDate ?? rawDate;

    let description = getVal(row, profile.columnMap.description);
    // If description is empty, check "To/From" or narration
    if (!description) {
      description = getVal(row, "To/From") || getVal(row, "Narration") || getVal(row, "Memo");
    }

    const reference = getVal(row, profile.columnMap.reference) || undefined;
    const sheet = row.__sheet;

    let amount = 0;
    let drCr: "dr" | "cr" = "dr";

    // Scenario A: Bank uses separate Money In / Money Out columns (e.g. Kuda, Sterling)
    const hasMoneyCols = profile.columnMap.moneyIn || profile.columnMap.moneyOut;
    let handledByMoneyCols = false;

    if (hasMoneyCols) {
      const inVal = parseCleanAmount(getVal(row, profile.columnMap.moneyIn));
      const outVal = parseCleanAmount(getVal(row, profile.columnMap.moneyOut));

      if (inVal > 0) {
        amount = inVal;
        drCr = "cr";
        handledByMoneyCols = true;
      } else if (outVal > 0) {
        amount = outVal;
        drCr = "dr";
        handledByMoneyCols = true;
      }
    }

    if (!handledByMoneyCols) {
      // Scenario B: Single Amount column + Dr/Cr column
      amount = parseCleanAmount(getVal(row, profile.columnMap.amount));
      const rawDrCr = getVal(row, profile.columnMap.drCr).toLowerCase();

      if (
        rawDrCr.includes("cr") ||
        rawDrCr.includes("credit") ||
        rawDrCr.includes("income") ||
        rawDrCr.includes("in") ||
        rawDrCr.includes("deposit")
      ) {
        drCr = "cr";
      } else {
        drCr = "dr";
      }
    }

    // Skip rows where amount is 0 and no date/description was found
    if (amount === 0 && !date && !description) {
      continue;
    }

    normalized.push({
      uuid: generateRowUuid(),
      date,
      description,
      amount,
      drCr,
      dateError,
      reference,
      sheet,
    });
  }

  return normalized;
}
