import type { BankProfile, ColumnMap } from "./types";

export type DetectedDateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

export interface SniffedColumnMapping {
  columnMap: ColumnMap;
  confidence: {
    date: boolean;
    description: boolean;
    amount: boolean;
    drCr: boolean;
  };
  suggestedDateFormat: DetectedDateFormat;
}

/**
 * Sniffs headers and sample row values to infer the column mapping.
 * Fuzzy-matches by column name and content shape.
 */
export function sniffColumns(
  headers: string[],
  sampleRows: Record<string, string>[],
): SniffedColumnMapping {
  const mapping: ColumnMap = {
    date: "",
    description: "",
  };

  const confidence = {
    date: false,
    description: false,
    amount: false,
    drCr: false,
  };

  const cleanHeaders = headers.map((h) => h.trim());
  const lowerHeaders = cleanHeaders.map((h) => h.toLowerCase());

  // 1. Name-based matching helpers
  const findHeader = (patterns: string[]): string | undefined => {
    for (const pat of patterns) {
      const idx = lowerHeaders.findIndex((h) => h === pat || h.includes(pat));
      if (idx !== -1) return cleanHeaders[idx];
    }
    return undefined;
  };

  // Date
  const dateHeader = findHeader(["trans. date", "transaction date", "date/time", "txn date", "date", "time"]);
  if (dateHeader) {
    mapping.date = dateHeader;
    confidence.date = true;
  }

  // Description
  const descHeader = findHeader(["narration", "narrative", "description", "details", "memo", "remarks", "to/from"]);
  if (descHeader) {
    mapping.description = descHeader;
    confidence.description = true;
  }

  // Split Money In / Money Out vs Single Amount
  const moneyInHeader = findHeader(["money in", "credit(₦)", "credit", "inflow", "deposit"]);
  const moneyOutHeader = findHeader(["money out", "debit(₦)", "debit", "outflow", "withdrawal"]);

  if (moneyInHeader && moneyOutHeader) {
    mapping.moneyIn = moneyInHeader;
    mapping.moneyOut = moneyOutHeader;
    confidence.amount = true;
  } else {
    const amountHeader = findHeader(["amount(₦)", "net amount", "amount", "total"]);
    if (amountHeader) {
      mapping.amount = amountHeader;
      confidence.amount = true;
    }
  }

  // Dr / Cr / Type
  const typeHeader = findHeader(["transaction type", "trans type", "dr/cr", "type", "d/c"]);
  if (typeHeader) {
    mapping.drCr = typeHeader;
    confidence.drCr = true;
  }

  // Reference
  const refHeader = findHeader(["transaction reference", "ref no", "reference", "order no.", "session id"]);
  if (refHeader) {
    mapping.reference = refHeader;
  }

  // 2. Content shape sniffing for missing fields
  if (sampleRows.length > 0) {
    for (const header of cleanHeaders) {
      const values = sampleRows
        .map((r) => String(r[header] ?? "").trim())
        .filter((v) => v.length > 0);
      if (values.length === 0) continue;

      // Sniff Type column if missing
      if (!mapping.drCr && !mapping.moneyIn) {
        const isType = values.every((v) => {
          const l = v.toLowerCase();
          return ["dr", "cr", "debit", "credit", "in", "out"].some((k) => l.includes(k));
        });
        if (isType) {
          mapping.drCr = header;
          confidence.drCr = true;
          continue;
        }
      }

      // Sniff Amount column if missing
      if (!mapping.amount && !mapping.moneyIn) {
        const isNumeric = values.every((v) => {
          const cleaned = v.replace(/[₦,$\s]/g, "");
          return !isNaN(parseFloat(cleaned)) && isFinite(Number(cleaned));
        });
        if (isNumeric) {
          mapping.amount = header;
          confidence.amount = true;
          continue;
        }
      }

      // Sniff Date column if missing
      if (!mapping.date) {
        const isDate = values.every((v) => {
          return /\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/.test(v);
        });
        if (isDate) {
          mapping.date = header;
          confidence.date = true;
          continue;
        }
      }

      // Sniff Description if missing (longest strings)
      if (!mapping.description && header !== mapping.date && header !== mapping.amount) {
        mapping.description = header;
        confidence.description = true;
      }
    }
  }

  // 3. Sniff suggested date format
  let suggestedDateFormat: DetectedDateFormat = "DD/MM/YYYY";
  if (mapping.date && sampleRows.length > 0) {
    const sampleDates = sampleRows
      .map((r) => String(r[mapping.date] ?? "").trim())
      .filter(Boolean);

    for (const d of sampleDates) {
      if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(d)) {
        suggestedDateFormat = "YYYY-MM-DD";
        break;
      }
      const match = d.match(/^(\d{1,2})[-/](\d{1,2})[-/]\d{2,4}/);
      if (match) {
        const first = parseInt(match[1]!, 10);
        const second = parseInt(match[2]!, 10);
        if (first > 12) {
          suggestedDateFormat = "DD/MM/YYYY";
          break;
        } else if (second > 12) {
          suggestedDateFormat = "MM/DD/YYYY";
          break;
        }
      }
    }
  }

  return {
    columnMap: mapping,
    confidence,
    suggestedDateFormat,
  };
}

/**
 * Creates a generic BankProfile given user-confirmed column mapping and dateFormat.
 * parseDate MUST return null on failure, never default to today.
 */
export function createGenericAutoProfile(
  columnMap: ColumnMap,
  dateFormat: DetectedDateFormat = "DD/MM/YYYY",
): BankProfile {
  return {
    name: "Generic Statement (Auto-detected)",
    expectedHeaders: [], // accepts whatever headers were confirmed
    columnMap,
    dateFormat,
    parseDate: (raw: string): string | null => {
      if (!raw || typeof raw !== "string") return null;
      const trimmed = raw.trim();
      if (!trimmed) return null;

      // 1. ISO format check (YYYY-MM-DD)
      const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (isoMatch) {
        const y = parseInt(isoMatch[1]!, 10);
        const m = parseInt(isoMatch[2]!, 10);
        const d = parseInt(isoMatch[3]!, 10);
        if (isValidDate(y, m, d)) return formatDate(y, m, d);
      }

      // 2. Delimited date check: DD/MM/YYYY or MM/DD/YYYY
      const partsMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
      if (partsMatch) {
        const p1 = parseInt(partsMatch[1]!, 10);
        const p2 = parseInt(partsMatch[2]!, 10);
        let y = parseInt(partsMatch[3]!, 10);
        if (y < 100) y += 2000;

        let day = p1;
        let month = p2;

        if (dateFormat === "MM/DD/YYYY") {
          month = p1;
          day = p2;
        }

        if (isValidDate(y, month, day)) {
          return formatDate(y, month, day);
        }
      }

      // 3. Fallback standard parse with validation
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
    },
  };
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
