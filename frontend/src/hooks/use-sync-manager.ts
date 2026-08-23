import { useEffect, useState } from 'react';
import { getMutationQueue, dequeueMutation } from '@/lib/db/schema';
import { request, RequestOptions } from '@/lib/api/client';
import { Capacitor } from "@capacitor/core";

export function useSyncManager() {
  // If not native, always assume online and skip all syncing logic
  const isNative = Capacitor.isNativePlatform();
  const [isOnline, setIsOnline] = useState(isNative ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNative) return;
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isNative]);

  useEffect(() => {
    if (!isNative || !isOnline) return;

    let mounted = true;

    async function syncQueue() {
      setIsSyncing(true);
      setSyncError(null);

      try {
        const queue = await getMutationQueue();
        
        for (const mutation of queue) {
          if (!mounted) break;
          
          try {
            await request(mutation.url, {
              method: mutation.method as any,
              body: mutation.body,
              ...mutation.options,
            });
            // Successfully synced, remove from queue
            await dequeueMutation(mutation.id!);
          } catch (err: any) {
            console.error('[SyncManager] Failed to sync mutation', mutation, err);
            // If it's a hard error (e.g. 400 Bad Request, 403, 404), we might want to discard it or alert.
            // For now, if it's not a network error, we dequeue it and alert the user.
            if (err.kind !== 'network' && err.kind !== 'timeout') {
              await dequeueMutation(mutation.id!);
              setSyncError(`A previous action failed to sync: ${err.message || 'Unknown error'}`);
            }
          }
        }
      } finally {
        if (mounted) setIsSyncing(false);
      }
    }

    // Small delay to ensure connection is stable before syncing
    const timer = setTimeout(() => {
      void syncQueue();
    }, 2000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [isOnline]);

  return { isOnline, isSyncing, syncError, clearSyncError: () => setSyncError(null) };
}
