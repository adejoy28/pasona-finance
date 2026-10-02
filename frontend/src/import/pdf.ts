import { generateRowUuid } from "./normalize";
import type { ParsedRow, ParsedStatementResult } from "./parse";
import { palmpayProfile } from "./profiles/palmpay";
import { suggestCategoryAndType } from "./suggest";

/**
 * Client-side PDF parser for bank statements.
 * Uses the Web Streams API (DecompressionStream) to inflate PDF content streams
 * directly in memory with zero server calls and zero external binary dependencies.
 */

interface CMapData {
  map: Map<number, string>;
}

function parseCMap(cmapText: string): CMapData {
  const map = new Map<number, string>();
  const rangeRegex = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
  let m: RegExpExecArray | null;
  while ((m = rangeRegex.exec(cmapText)) !== null) {
    const start = parseInt(m[1]!, 16);
    const end = parseInt(m[2]!, 16);
    const target = parseInt(m[3]!, 16);
    for (let i = 0; i <= end - start; i++) {
      map.set(start + i, String.fromCodePoint(target + i));
    }
  }
  return { map };
}

function parsePdfStringLiteral(s: string, startIdx: number): { bytes: Uint8Array; nextIdx: number } | null {
  const result: number[] = [];
  let depth = 0;
  let i = startIdx;
  if (s[i] !== "(") return null;
  i++;
  while (i < s.length) {
    const ch = s[i];
    if (ch === "\\") {
      i++;
      if (i < s.length) {
        const next = s[i]!;
        if (next === "n") result.push(10);
        else if (next === "r") result.push(13);
        else if (next === "t") result.push(9);
        else if (next === "b") result.push(8);
        else if (next === "f") result.push(12);
        else if (next === "(") result.push(40);
        else if (next === ")") result.push(41);
        else if (next === "\\") result.push(92);
        else result.push(next.charCodeAt(0));
      }
    } else if (ch === "(") {
      depth++;
      result.push(40);
    } else if (ch === ")") {
      if (depth === 0) {
        return { bytes: new Uint8Array(result), nextIdx: i + 1 };
      }
      depth--;
      result.push(41);
    } else {
      result.push(ch!.charCodeAt(0));
    }
    i++;
  }
  return null;
}

function decodePdfBytes(b: Uint8Array, cmap: CMapData): string {
  // Check if ASCII timestamp format: MM/DD/YYYY
  const textDecoder = new TextDecoder("utf-8");
  const ascii = textDecoder.decode(b);
  if (/^\d{2}\/\d{2}\/\d{4}/.test(ascii)) {
    return ascii;
  }

  let res = "";
  for (let i = 0; i < b.length; i += 2) {
    const code = (b[i]! << 8) | (b[i + 1] ?? 0);
    if (cmap.map.has(code)) {
      res += cmap.map.get(code);
    } else if (b[i + 1] !== undefined) {
      res += String.fromCharCode(b[i + 1]!);
    }
  }
  return res;
}

async function decompressDeflate(raw: Uint8Array): Promise<string> {
  // If running in Node.js / test environment with zlib
  if (typeof process !== "undefined" && typeof (process as any).versions?.node !== "undefined") {
    try {
      // Dynamic import to avoid bundling zlib in browser build
      const zlibModule = "node:zlib";
      const zlib = await import(/* @vite-ignore */ zlibModule);
      if (zlib && typeof zlib.inflateSync === "function") {
        const decomp = zlib.inflateSync(raw);
        let binary = "";
        const chunkSz = 8192;
        for (let i = 0; i < decomp.length; i += chunkSz) {
          binary += String.fromCharCode(...decomp.subarray(i, i + chunkSz));
        }
        return binary;
      }
    } catch {
      // Fallback to Web Streams
    }
  }

  // Web Streams API in browser: write and read concurrently to avoid backpressure deadlock
  const ds = new DecompressionStream("deflate");
  const writer = ds.writable.getWriter();
  const reader = ds.readable.getReader();

  const writePromise = (async () => {
    try {
      await writer.write(raw);
      await writer.close();
    } catch {
      // Stream error handled by reader
    }
  })();

  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  await writePromise;

  // Combine chunks
  let totalLen = 0;
  for (const c of chunks) totalLen += c.length;
  const merged = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }

  // Convert to binary string
  let binary = "";
  const chunkSz = 8192;
  for (let i = 0; i < merged.length; i += chunkSz) {
    binary += String.fromCharCode(...merged.subarray(i, i + chunkSz));
  }
  return binary;
}

export function isPdfStatement(file: File): boolean {
  return file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
}

/**
 * Parses a PalmPay PDF statement and returns normalized ParsedStatementResult.
 */
export async function parsePdfStatement(buffer: ArrayBuffer): Promise<ParsedStatementResult> {
  const uint8 = new Uint8Array(buffer);
  let pdfStr = "";
  const chunkSz = 8192;
  for (let i = 0; i < uint8.length; i += chunkSz) {
    pdfStr += String.fromCharCode(...uint8.subarray(i, i + chunkSz));
  }

  // 1. Locate and parse ToUnicode CMap
  let cmapData: CMapData = { map: new Map() };
  const refMatch = pdfStr.match(/\/ToUnicode\s+(\d+)\s+\d+\s+R/);
  const targetObjId = refMatch ? refMatch[1] : "33";
  const objRegex = new RegExp(`${targetObjId}\\s+0\\s+obj[\\s\\S]*?stream\\r?\\n([\\s\\S]*?)\\r?\\nendstream`);
  const cmapStreamMatch = pdfStr.match(objRegex);

  if (cmapStreamMatch && cmapStreamMatch[1]) {
    try {
      const rawBytes = new Uint8Array(cmapStreamMatch[1].length);
      for (let i = 0; i < cmapStreamMatch[1].length; i++) {
        rawBytes[i] = cmapStreamMatch[1].charCodeAt(i);
      }
      const decompressedCMap = await decompressDeflate(rawBytes);
      cmapData = parseCMap(decompressedCMap);
    } catch {
      // Continue with empty CMap fallback
    }
  }

  // 2. Iterate and decompress stream objects
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let sm: RegExpExecArray | null;
  const rawTransactions: { date: string; time: string; tokens: string[] }[] = [];

  while ((sm = streamRegex.exec(pdfStr)) !== null) {
    try {
      const streamContent = sm[1];
      if (!streamContent) continue;
      const rawBytes = new Uint8Array(streamContent.length);
      for (let i = 0; i < streamContent.length; i++) {
        rawBytes[i] = streamContent.charCodeAt(i);
      }
      const decompressed = await decompressDeflate(rawBytes);
      if (!decompressed.includes("Tj") && !decompressed.includes("TJ")) continue;

      // Extract literal strings
      const tokens: string[] = [];
      let idx = 0;
      while (idx < decompressed.length) {
        const p = decompressed.indexOf("(", idx);
        if (p === -1) break;
        const parsed = parsePdfStringLiteral(decompressed, p);
        if (!parsed) {
          idx = p + 1;
          continue;
        }
        idx = parsed.nextIdx;
        const decoded = decodePdfBytes(parsed.bytes, cmapData).trim();
        if (decoded) tokens.push(decoded);
      }

      // Group tokens into transaction records
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]!;
        const dateMatch = t.match(/^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2}\s+(?:AM|PM))/);
        if (dateMatch) {
          const rowTokens: string[] = [];
          let j = i + 1;
          while (
            j < tokens.length &&
            !tokens[j]!.match(/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}/) &&
            !/^\d+$/.test(tokens[j]!)
          ) {
            rowTokens.push(tokens[j]!);
            j++;
          }
          rawTransactions.push({
            date: dateMatch[1]!,
            time: dateMatch[2]!,
            tokens: rowTokens,
          });
          i = j - 1;
        }
      }
    } catch (err) {
      console.error("DEBUG stream error:", err);
    }
  }

  // 3. Transform to ParsedRow[]
  const parsedRows: ParsedRow[] = [];

  for (const item of rawTransactions) {
    // Skip header or metadata row (no amount)
    const tokens = item.tokens;
    if (tokens.length === 0) continue;

    // Find amount token: starts with + or - followed by digits and decimal (e.g. +30000.00, -10800.00)
    let amountIdx = -1;
    for (let k = 0; k < tokens.length; k++) {
      if (/^[+-]?[\d,]+\.\d{2}$/.test(tokens[k]!)) {
        amountIdx = k;
        break;
      }
    }

    if (amountIdx === -1) continue;

    const amountToken = tokens[amountIdx]!;
    const isCredit = amountToken.startsWith("+");
    const rawNumeric = amountToken.replace(/[+,-]/g, "");
    const amount = parseFloat(rawNumeric);
    if (isNaN(amount) || amount === 0) continue;

    // Tokens before amount are description parts
    const descParts = tokens.slice(0, amountIdx);
    const description = descParts.join(" ").replace(/\s+/g, " ").trim() || "PalmPay Transaction";

    // Token after amount is usually the reference/order no.
    const refToken = tokens[amountIdx + 1];
    const reference = refToken && refToken.length >= 8 ? refToken : undefined;

    // Parse date: "MM/DD/YYYY" -> "YYYY-MM-DD"
    const [mm, dd, yyyy] = item.date.split("/");
    const isoDate = `${yyyy}-${mm!.padStart(2, "0")}-${dd!.padStart(2, "0")}`;

    const suggestion = suggestCategoryAndType(description, isCredit ? "cr" : "dr");

    parsedRows.push({
      uuid: generateRowUuid(),
      date: isoDate,
      description,
      amount,
      drCr: isCredit ? "cr" : "dr",
      reference,
      dateError: false,
      suggestedCategory: suggestion.categoryName,
      suggestedType: suggestion.type,
    });
  }

  return {
    profile: palmpayProfile,
    headers: ["Transaction Time", "Description", "Amount", "Type", "Order No."],
    rows: parsedRows,
    totalCount: parsedRows.length,
    dateErrorCount: 0,
    availableSheets: ["PalmPay Statement"],
  };
}
