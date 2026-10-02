import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { BankProfile } from "./profiles/types";
import { normalizeRows, validateHeaders, type NormalizedRow, canonicalHeader } from "./normalize";
import { suggestCategoryAndType, type SuggestionResult } from "./suggest";
import {
  sniffColumns,
  createGenericAutoProfile,
  type SniffedColumnMapping,
} from "./profiles/generic-auto";
import { kudaProfile } from "./profiles/kuda";
import { opayProfile } from "./profiles/opay";
import { palmpayProfile } from "./profiles/palmpay";
import { sterlingProfile } from "./profiles/sterling";
import { genericProfile } from "./profiles/generic";
import { isPdfStatement, parsePdfStatement } from "./pdf";

export interface ParsedRow extends NormalizedRow {
  suggestedCategory?: string;
  suggestedType: "income" | "expense" | "transfer";
}

export interface ParsedStatementResult {
  profile: BankProfile;
  headers: string[];
  rows: ParsedRow[];
  totalCount: number;
  dateErrorCount: number;
  availableSheets?: string[];
  fallbackToGenericAuto?: boolean;
  sniffedMapping?: SniffedColumnMapping;
}

/**
 * Extracts headers and raw row records across ALL sheets from an XLSX ArrayBuffer.
 * Searches for header rows that match bank statements (handling introductory/metadata rows).
 * Supports multi-sheet statements like OPay (Wallet + OWealth).
 */
function parseXlsxBuffer(
  buffer: ArrayBuffer,
  expectedHeaders?: string[],
): { headers: string[]; data: (Record<string, string> & { __sheet?: string })[]; availableSheets: string[] } {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const availableSheets: string[] = [];
  const allHeadersSet = new Set<string>();
  const allData: (Record<string, string> & { __sheet?: string })[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Convert to 2D array of strings
    const rows: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    if (!rows || rows.length === 0) continue;

    // 1. Check if sheet has no explicit text header row and starts directly with data
    // (e.g. OPay Wallet Account Transactions and Savings Account Transactions)
    const row0 = rows[0] || [];
    const isDirectDataRow =
      row0.length >= 4 &&
      row0[0] &&
      (/\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/.test(String(row0[0])) ||
        /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(String(row0[0])));

    if (isDirectDataRow) {
      const syntheticHeaders = [
        "Trans. Date",
        "Value Date",
        "Description",
        "Debit",
        "Credit",
        "Balance After",
        "Channel",
        "Transaction Reference",
      ];
      syntheticHeaders.forEach((h) => allHeadersSet.add(h));
      availableSheets.push(sheetName);

      for (const r of rows) {
        if (!r || r.length === 0 || !r[0]) continue;
        const obj: Record<string, string> & { __sheet?: string } = { __sheet: sheetName };
        for (let j = 0; j < syntheticHeaders.length; j++) {
          obj[syntheticHeaders[j]!] = String(r[j] ?? "").trim();
        }
        allData.push(obj);
      }
      continue;
    }

    // 2. Normal sheet: search for header row that has BOTH a date header and a money header
    // (skipping summary boxes like Kuda's Row 8 which only has Money In/Out without Date/Time)
    let headerIndex = -1;
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const row = rows[i] || [];
      const canonRow = row.map((c) => canonicalHeader(String(c ?? "")));
      const hasDate = canonRow.some((c) => c.includes("date") || c.includes("time"));
      const hasMoney = canonRow.some(
        (c) =>
          c.includes("money") ||
          c.includes("amount") ||
          c.includes("debit") ||
          c.includes("credit") ||
          c.includes("balance"),
      );
      if (hasDate && hasMoney) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      // Fallback: look for row with >= 3 non-empty cells
      for (let i = 0; i < Math.min(rows.length, 25); i++) {
        const nonEmpties = (rows[i] ?? []).filter((c) => String(c ?? "").trim().length > 0);
        if (nonEmpties.length >= 3) {
          headerIndex = i;
          break;
        }
      }
    }

    if (headerIndex === -1) continue;

    const rawHeaders = (rows[headerIndex] ?? []).map((c) => String(c ?? "").trim());
    const validHeaders = rawHeaders.filter(Boolean);
    if (validHeaders.length < 2) continue;

    validHeaders.forEach((h) => allHeadersSet.add(h));
    availableSheets.push(sheetName);

    const dataRows = rows.slice(headerIndex + 1);
    for (const r of dataRows) {
      if (!r || r.length === 0) continue;
      const obj: Record<string, string> & { __sheet?: string } = {
        __sheet: sheetName,
      };
      let hasContent = false;
      for (let j = 0; j < rawHeaders.length; j++) {
        const h = rawHeaders[j];
        if (h && typeof h === "string" && h.trim()) {
          const val = String(r[j] ?? "").trim();
          obj[h.trim()] = val;
          if (val) hasContent = true;
        }
      }
      if (hasContent) {
        allData.push(obj);
      }
    }
  }

  return {
    headers: Array.from(allHeadersSet),
    data: allData,
    availableSheets,
  };
}

/**
 * Parses raw CSV content (or File) against the specified BankProfile.
 */
export async function parseStatementCsv(
  input: File | string,
  profile: BankProfile,
): Promise<ParsedStatementResult> {
  let csvText: string;

  if (typeof input === "string") {
    csvText = input;
  } else {
    csvText = await input.text();
  }

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        resolve(processParsedRows(headers, results.data, profile));
      },
      error: (err: { message: string }) => {
        reject(new Error(`Failed to parse CSV: ${err.message}`));
      },
    });
  });
}

/**
 * Automatically inspects headers, sheets, and file contents to resolve the matching bank profile.
 */
export function detectBankProfile(
  fileName: string,
  headers: string[],
  availableSheets: string[] = [],
  sampleRows: Record<string, string>[] = [],
): BankProfile {
  const fName = (fileName || "").toLowerCase();
  const canonHeaders = new Set(headers.map(canonicalHeader));

  // 1. OPay detection
  const isOpaySheet = availableSheets.some(
    (s) =>
      s.toLowerCase().includes("wallet account") ||
      s.toLowerCase().includes("savings account"),
  );
  const isOpayHeader =
    canonHeaders.has("channel") ||
    canonHeaders.has("balanceafter") ||
    (canonHeaders.has("debit") && canonHeaders.has("credit") && canonHeaders.has("valuedate"));
  const hasOpayInDesc = sampleRows.some((r) =>
    Object.values(r).some((v) => typeof v === "string" && v.toLowerCase().includes("opay")),
  );

  if (isOpaySheet || fName.includes("opay") || isOpayHeader || hasOpayInDesc) {
    return opayProfile;
  }

  // 2. Kuda detection
  const isKudaHeader =
    (canonHeaders.has("moneyin") && canonHeaders.has("moneyout")) ||
    canonHeaders.has("tofrom");
  const hasKudaInDesc = sampleRows.some((r) =>
    Object.values(r).some((v) => typeof v === "string" && v.toLowerCase().includes("kuda")),
  );

  if (fName.includes("kuda") || isKudaHeader || hasKudaInDesc) {
    return kudaProfile;
  }

  // 3. PalmPay detection
  const isPalmpayHeader =
    canonHeaders.has("orderno") ||
    canonHeaders.has("orderid") ||
    (canonHeaders.has("fee") && canonHeaders.has("creditdebit"));
  const hasPalmpayInDesc = sampleRows.some((r) =>
    Object.values(r).some((v) => typeof v === "string" && v.toLowerCase().includes("palmpay")),
  );

  if (fName.includes("palmpay") || isPalmpayHeader || hasPalmpayInDesc) {
    return palmpayProfile;
  }

  // 4. Sterling detection
  if (fName.includes("sterling") || (canonHeaders.has("originatingbranch") && canonHeaders.has("valuedate"))) {
    return sterlingProfile;
  }

  // 5. Generic auto-sniffing for any other statement
  const sniffed = sniffColumns(headers, sampleRows.slice(0, 20));
  return createGenericAutoProfile(sniffed.columnMap, sniffed.suggestedDateFormat);
}

/**
 * Universal file parser: parses CSV or XLSX File client-side against the specified or auto-detected BankProfile.
 * Immediately discards the raw File/ArrayBuffer after producing normalized row objects.
 */
export async function parseStatementFile(
  file: File,
  profile?: BankProfile,
  allowFallbackToGenericAuto: boolean = true,
): Promise<ParsedStatementResult> {
  if (isPdfStatement(file)) {
    const arrayBuffer = await file.arrayBuffer();
    return parsePdfStatement(arrayBuffer);
  }

  const isXlsx =
    file.name.endsWith(".xlsx") ||
    file.name.endsWith(".xls") ||
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel";

  let headers: string[] = [];
  let rawData: (Record<string, string> & { __sheet?: string })[] = [];
  let availableSheets: string[] = [];

  if (isXlsx) {
    const arrayBuffer = await file.arrayBuffer();
    const parsed = parseXlsxBuffer(arrayBuffer, profile?.expectedHeaders);
    headers = parsed.headers;
    rawData = parsed.data;
    availableSheets = parsed.availableSheets;
    // Memory release: arrayBuffer is not retained beyond this scope
  } else {
    const text = await file.text();
    const parsed = await new Promise<{ headers: string[]; data: Record<string, string>[] }>(
      (resolve, reject) => {
        Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: "greedy",
          transformHeader: (h) => h.trim(),
          complete: (res) => {
            resolve({
              headers: res.meta.fields ?? [],
              data: res.data,
            });
          },
          error: (err) => reject(new Error(`Failed to parse CSV: ${err.message}`)),
        });
      },
    );
    headers = parsed.headers;
    rawData = parsed.data;
  }

  // Auto-detect profile if none provided or if default "Generic CSV" was passed
  const resolvedProfile =
    profile && profile.name !== "Generic CSV"
      ? profile
      : detectBankProfile(file.name, headers, availableSheets, rawData);

  // Validate headers if resolved profile has expectedHeaders
  if (resolvedProfile.expectedHeaders && resolvedProfile.expectedHeaders.length > 0) {
    const validation = validateHeaders(headers, resolvedProfile);
    if (!validation.valid) {
      if (!allowFallbackToGenericAuto) {
        throw new Error(validation.error ?? `Invalid headers for ${resolvedProfile.name}`);
      }

      // Sniff columns to enable generic-auto fallback
      const sniffed = sniffColumns(headers, rawData.slice(0, 15));
      const autoProfile = createGenericAutoProfile(
        sniffed.columnMap,
        sniffed.suggestedDateFormat,
      );

      const processed = processParsedRows(headers, rawData, autoProfile);
      return {
        ...processed,
        availableSheets,
        fallbackToGenericAuto: true,
        sniffedMapping: sniffed,
      };
    }
  }

  const processed = processParsedRows(headers, rawData, resolvedProfile);
  return {
    ...processed,
    availableSheets,
  };
}

/**
 * Normalizes rows, checks dates, and attaches category/type suggestions.
 */
function processParsedRows(
  headers: string[],
  data: (Record<string, string> & { __sheet?: string })[],
  profile: BankProfile,
): ParsedStatementResult {
  const normalized = normalizeRows(data, profile);

  const rowsWithSuggestions: ParsedRow[] = normalized.map((row) => {
    const suggestion: SuggestionResult = suggestCategoryAndType(
      row.description,
      row.drCr,
    );

    return {
      ...row,
      suggestedCategory: suggestion.categoryName,
      suggestedType: suggestion.type,
    };
  });

  const dateErrorCount = rowsWithSuggestions.filter((r) => r.dateError).length;

  return {
    profile,
    headers,
    rows: rowsWithSuggestions,
    totalCount: rowsWithSuggestions.length,
    dateErrorCount,
  };
}
