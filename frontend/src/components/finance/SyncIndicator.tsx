import { useSyncManager } from "@/hooks/use-sync-manager";
import { CloudOff, RefreshCw, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Capacitor } from "@capacitor/core";

export function SyncIndicator() {
  const { isOnline, isSyncing, syncError, clearSyncError } = useSyncManager();

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

        {syncError && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="pointer-events-auto bg-rose-600 text-white shadow-lg rounded-full pl-4 pr-2 py-1.5 flex items-center gap-3 text-xs font-bold tracking-wide border border-rose-500 max-w-sm"
          >
            <div className="flex items-center gap-2 truncate">
              <AlertTriangle size={14} className="text-rose-200 shrink-0" />
              <span className="truncate">{syncError}</span>
            </div>
            <button
              onClick={clearSyncError}
              className="p-1 hover:bg-rose-700 rounded-full transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
