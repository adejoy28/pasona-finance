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
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      flushQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also attempt a flush on mount if online
    if (navigator.onLine) {
      flushQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const flushQueue = async () => {
    const pendingTransactions = await db.transactions.toArray();
    
    if (pendingTransactions.length === 0) return;

    setIsSyncing(true);
    try {
      // Send all pending transactions to the sync endpoint
      await api.post('/transactions/sync', {
        transactions: pendingTransactions.map(({ id, ...rest }) => rest)
      });

      // Clear the local queue on success
      await db.transactions.clear();
      console.log('Successfully synced offline transactions.');
    } catch (error) {
      console.error('Failed to sync offline transactions:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return { isOnline, isSyncing, flushQueue };
}
