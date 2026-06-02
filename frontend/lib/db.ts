import Dexie, { type Table } from 'dexie';

/**
 * Offline Database (IndexedDB)
 * 
 * Uses Dexie.js to store transactions locally when offline.
 * These will be synced to the Laravel API when connection is restored.
 */

export interface OfflineTransaction {
  id?: number;
  account_id: number;
  to_account_id?: number;
  type: 'income' | 'expense' | 'transfer';
  category_id?: number;
  amount: number;
  description?: string;
  reference?: string;
  transaction_date: string;
  created_at: number;
}

export class AppDatabase extends Dexie {
  transactions!: Table<OfflineTransaction>;

  constructor() {
    super('PasonaFinanceDB');
    this.version(1).stores({
      transactions: '++id, transaction_date, created_at' // Primary key and indexes
    });
  }
}

export const db = new AppDatabase();
