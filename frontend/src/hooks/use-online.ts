import { useEffect, useState } from "react";

/**
 * Real online/offline state from `navigator.onLine` + browser events.
 *
 * Note: `navigator.onLine` reports the network interface state, not actual
 * reachability of the API — a captive portal or DNS failure can still
 * leave requests failing while this reports `true`. For those, surface
 * the request error in the UI; this hook is for the coarse online/offline
 * pill and for gating the offline queue.
 */
export function useOnline(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator === "undefined") return true;
    return navigator.onLine;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
