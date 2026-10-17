import { api } from "./client";
import type { ImportPreviewRow } from "./types";

export type ImportBankSlug = "generic" | "kuda" | "opay";

export interface CheckExistingInput {
  account_id: number;
  date_from: string;
  date_to: string;
}

export interface ExistingTransactionTuple {
  date: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  reference?: string | null;
}

export interface StoreImportTransactionItem {
  uuid: string;
  account_id: number;
  type: "income" | "expense" | "transfer";
  amount: number;
  description?: string;
  transaction_date: string;
  reference?: string;
  to_account_id?: number;
  category_id?: number;
}

export interface StoreImportInput {
  import_batch_id?: string;
  transactions: StoreImportTransactionItem[];
}

export interface StoreImportResult {
  message: string;
  imported_count: number;
  skipped_count: number;
  import_batch_id?: string;
}

export interface UndoBatchResult {
  message: string;
  deleted_count: number;
}

export function checkImportExisting(
  payload: CheckExistingInput,
): Promise<ExistingTransactionTuple[]> {
  return api.post<ExistingTransactionTuple[]>("/import/check", payload);
}

export function storeImportTransactions(
  payload: StoreImportInput,
): Promise<StoreImportResult> {
  return api.post<StoreImportResult>("/import/store", payload);
}

export function undoImportBatch(batchId: string): Promise<UndoBatchResult> {
  return api.post<UndoBatchResult>(`/import/batches/${batchId}/undo`);
}

// Backwards compatibility alias for older callers
export type CommitImportInput = StoreImportInput;
export type CommitImportResult = StoreImportResult;

export function commitImport(
  _storePath: string,
  payload: CommitImportInput,
): Promise<CommitImportResult> {
  return storeImportTransactions(payload);
}
