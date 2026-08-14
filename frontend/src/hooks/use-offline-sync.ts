import { useCallback, useEffect, useState } from "react";
import { useOnline } from "./use-online";
import { transactions as transactionsApi } from "@/lib/api";
import {
  clearQueuedTransactions,
  countQueuedTransactions,
  enqueueTransaction,
  listQueuedTransactions,
  type QueuedTransaction,
} from "@/lib/offline/queue";

/**
 * Offline transaction queue. Converted from TanStack Query cache invalidation
 * to a simple event-based approach.
 */
export function useOfflineSync() {
  const isOnline = useOnline();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = useCallback(async () => {
    try {
      setPendingCount(await countQueuedTransactions());
    } catch (err) {
      console.error("[offline-sync] count failed", err);
    }
  }, []);

  const flushQueue = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    let pending: QueuedTransaction[] = [];
    try {
      pending = await listQueuedTransactions();
    } catch (err) {
      console.error("[offline-sync] read queue failed", err);
      return;
    }
    if (pending.length === 0) return;
    setIsSyncing(true);
    try {
      const payload = pending.map(({ id: _id, created_at: _ca, ...rest }) => rest);
      await transactionsApi.syncTransactions(payload);
      await clearQueuedTransactions();
      // Emit a custom event so pages can refetch if they want
      window.dispatchEvent(new CustomEvent("pasona:sync-complete"));
    } catch (err) {
      console.error("[offline-sync] flush failed", err);
    } finally {
      setIsSyncing(false);
      await refreshCount();
    }
  }, [refreshCount]);

  const enqueue = useCallback(
    async (tx: Omit<QueuedTransaction, "id" | "created_at">) => {
      await enqueueTransaction(tx);
      await refreshCount();
    },
    [refreshCount],
  );

  useEffect(() => {
    void refreshCount();
    if (typeof navigator !== "undefined" && navigator.onLine) {
      void flushQueue();
    }
  }, [refreshCount, flushQueue]);

  useEffect(() => {
    if (isOnline) {
      void flushQueue();
    }
  }, [isOnline, flushQueue]);

  return { isOnline, isSyncing, pendingCount, flushQueue, enqueue };
}
