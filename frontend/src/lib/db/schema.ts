import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface PasonaDB extends DBSchema {
  api_cache: {
    key: string;
    value: {
      url: string;
      data: any;
      timestamp: number;
    };
  };
  mutation_queue: {
    key: number;
    value: {
      id?: number;
      url: string;
      method: string;
      body: any;
      options: any;
      timestamp: number;
    };
  };
}

const DB_NAME = 'pasona-finance-db';
const DB_VERSION = 1;

export async function initDB(): Promise<IDBPDatabase<PasonaDB>> {
  return openDB<PasonaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('api_cache')) {
        db.createObjectStore('api_cache', { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains('mutation_queue')) {
        db.createObjectStore('mutation_queue', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

// Caching Helpers
export async function setCachedData(url: string, data: any) {
  try {
    const db = await initDB();
    await db.put('api_cache', {
      url,
      data,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('[db] setCachedData failed', err);
  }
}

export async function getCachedData(url: string) {
  try {
    const db = await initDB();
    const result = await db.get('api_cache', url);
    return result ? result.data : null;
  } catch (err) {
    console.error('[db] getCachedData failed', err);
    return null;
  }
}

export async function clearCache() {
  try {
    const db = await initDB();
    await db.clear('api_cache');
  } catch (err) {
    console.error('[db] clearCache failed', err);
  }
}

// Queue Helpers
export async function enqueueMutation(url: string, method: string, body: any, options: any) {
  try {
    const db = await initDB();
    await db.add('mutation_queue', {
      url,
      method,
      body,
      options,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('[db] enqueueMutation failed', err);
  }
}

export async function getMutationQueue() {
  try {
    const db = await initDB();
    return await db.getAll('mutation_queue');
  } catch (err) {
    console.error('[db] getMutationQueue failed', err);
    return [];
  }
}

export async function dequeueMutation(id: number) {
  try {
    const db = await initDB();
    await db.delete('mutation_queue', id);
  } catch (err) {
    console.error('[db] dequeueMutation failed', err);
  }
}
