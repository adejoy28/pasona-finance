import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import api from '@/lib/api';

/**
 * Offline Sync Hook
 *
 * Monitors network status and automatically flushes the local IndexedDB queue
 * to the Laravel backend when the device comes back online.
 */

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(() => 
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);

  const flushQueue = async () => {
    const pendingTransactions = await db.transactions.toArray();

    if (pendingTransactions.length === 0) return;

    setIsSyncing(true);
    try {
      await api.post('/transactions/sync', {
        transactions: pendingTransactions.map((transaction) => {
          // Remove the local IndexedDB primary key before syncing
          const { id, ...rest } = transaction; // eslint-disable-line @typescript-eslint/no-unused-vars
          return rest;
        }),
      });

      await db.transactions.clear();
      console.log('Successfully synced offline transactions.');
    } catch (error) {
      console.error('Failed to sync offline transactions:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Only run event listeners and initialization on the client
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      void flushQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const initialize = async () => {
      if (navigator.onLine) {
        await flushQueue();
      }
    };

    void initialize();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isSyncing, flushQueue };
}
