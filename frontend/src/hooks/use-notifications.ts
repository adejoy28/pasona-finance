import { useCallback, useEffect, useRef, useState } from "react";
import {
  listNotifications,
  getUnreadCount,
  markRead as apiMarkRead,
  markAllRead as apiMarkAllRead,
  type NotificationDto,
} from "@/lib/api/notifications";

type UseNotificationsResult = {
  notifications: NotificationDto[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  /** Fetch the next page (appends to the list). */
  loadMore: () => Promise<void>;
  /** Mark a single notification as read. */
  markRead: (id: number) => Promise<void>;
  /** Mark all notifications as read. */
  markAllRead: () => Promise<void>;
  /** Re-fetch from page 1 and reset the list. */
  refresh: () => Promise<void>;
};

/**
 * Central hook for the notification bell.
 *
 * - Fetches unread count on mount.
 * - Polls unread count every 60 seconds while the tab is visible.
 * - Fetches the full notification list lazily (only when the panel opens).
 */
export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  const hasMore = currentPage < lastPage;

  // --- Unread count polling ---
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { count } = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Silently ignore — polling shouldn't crash the UI.
    }
  }, []);

  useEffect(() => {
    void fetchUnreadCount();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchUnreadCount();
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // --- Paginated list ---
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || currentPage >= lastPage) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const nextPage = currentPage + 1;
      const result = await listNotifications(nextPage);
      setNotifications((prev) =>
        nextPage === 1 ? result.data : [...prev, ...result.data],
      );
      setCurrentPage(result.current_page);
      setLastPage(result.last_page);
    } catch {
      // Ignore — the UI can show a retry hint.
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [currentPage, lastPage]);

  // --- Actions ---
  const markRead = useCallback(
    async (id: number) => {
      try {
        const updated = await apiMarkRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? updated : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // Ignore — optimistic update isn't worth reverting for this.
      }
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    try {
      await apiMarkAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  }, []);

  const refresh = useCallback(async () => {
    setCurrentPage(0);
    setLastPage(1);
    setNotifications([]);
    loadingRef.current = false;
    // loadMore will pick up from page 0 → fetch page 1
    try {
      setLoading(true);
      const result = await listNotifications(1);
      setNotifications(result.data);
      setCurrentPage(result.current_page);
      setLastPage(result.last_page);
      void fetchUnreadCount();
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadMore,
    markRead,
    markAllRead,
    refresh,
  };
}
