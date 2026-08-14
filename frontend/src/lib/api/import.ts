import { api } from "./client";
import type { ImportPreviewRow } from "./types";

/**
 * Per-bank import API.
 *
 * The backend exposes two routes per bank:
 *   POST /api/import/{bank}/preview   (multipart: file, account_id)
 *   POST /api/import/{bank}/store     (json: { transactions: [...] })
 *
 * The bank segment is empty for the generic CSV import, so the path
 * is `/api/import/preview` (not `/api/import//preview`). The bank
 * config in `src/config/banks.ts` carries the full path so the caller
 * never has to assemble it.
 */

export type ImportBankSlug = "generic" | "kuda" | "opay";

export type CommitImportInput = {
  transactions: Array<{
    account_id: number;
    type: "income" | "expense" | "transfer";
    amount: number;
    description?: string;
    /** ISO date (YYYY-MM-DD). */
    transaction_date: string;
    /** OPay and any future banks that surface a statement reference. */
    reference?: string;
    /** Required when `type === "transfer"`. */
    to_account_id?: number;
  }>;
};

export type CommitImportResult = { message: string };

export function previewImport(
  previewPath: string,
  formData: FormData,
): Promise<ImportPreviewRow[]> {
  return api.post<ImportPreviewRow[]>(previewPath, formData);
}

export function commitImport(
  storePath: string,
  payload: CommitImportInput,
): Promise<CommitImportResult> {
  return api.post<CommitImportResult>(storePath, payload);
}
