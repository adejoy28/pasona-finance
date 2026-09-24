import { useEffect } from "react";
import { useSyncManager } from "@/hooks/use-sync-manager";
import { usePopup } from "@/components/ui/popup";
import { CloudOff, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Capacitor } from "@capacitor/core";

export function SyncIndicator() {
  const { isOnline, isSyncing, syncError, clearSyncError } = useSyncManager();
  const popup = usePopup();

  // Surface sync errors through the standard dismissible popup system,
  // which works on all platforms and matches the app's normal error display.
  useEffect(() => {
    if (!syncError) return;
    popup.error("A previous action was not successful", {
      description: syncError,
    });
    clearSyncError();
  }, [syncError]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="pointer-events-auto bg-slate-800 text-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold tracking-wide border border-slate-700 backdrop-blur-md"
          >
            <CloudOff size={14} className="text-slate-400" /> Offline Mode
          </motion.div>
        )}

        {isOnline && isSyncing && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="pointer-events-auto bg-indigo-600 text-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold tracking-wide border border-indigo-500"
          >
            <RefreshCw size={14} className="animate-spin text-indigo-200" /> Syncing...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
