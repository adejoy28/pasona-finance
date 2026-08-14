// Client-side offline queue for transactions.
//
// Backed by IndexedDB via Dexie. The server doesn't know about queued
// items until the user comes back online and we POST to /transactions/sync.
// Treat this as a transient buffer — never source-of-truth.
//
// SSR-safe: the DB is only opened on first client-side access. Dexie
// touches `indexedDB` at construction, which doesn't exist in the Node
// runtime used by TanStack Start's server build.

import Dexie, { type Table } from "dexie";

export type QueuedTransaction = {
  id?: number;
  account_id: number;
  to_account_id?: number;
  type: "income" | "expense" | "transfer";
  category_id?: number;
  amount: number;
  description?: string;
  reference?: string;
  transaction_date: string;
  /** Local epoch ms — used only to order the flush; not sent to the API. */
  created_at: number;
};

class PasonaOfflineDB extends Dexie {
  transactions!: Table<QueuedTransaction>;

  constructor() {
    super("PasonaFinanceDB");
    this.version(1).stores({
      // ++id = auto-incrementing primary key. Indexes on date + created_at
      // so we can range-read by day and order the flush by enqueue time.
      transactions: "++id, transaction_date, created_at",
    });
  }
}

let _db: PasonaOfflineDB | null = null;

function getDb(): PasonaOfflineDB {
  if (!_db) _db = new PasonaOfflineDB();
  return _db;
}

export async function enqueueTransaction(
  tx: Omit<QueuedTransaction, "id" | "created_at">,
): Promise<number> {
  return getDb().transactions.add({ ...tx, created_at: Date.now() });
}

export async function listQueuedTransactions(): Promise<QueuedTransaction[]> {
  return getDb().transactions.orderBy("created_at").toArray();
}

export async function countQueuedTransactions(): Promise<number> {
  return getDb().transactions.count();
}

export async function clearQueuedTransactions(): Promise<void> {
  return getDb().transactions.clear();
}
