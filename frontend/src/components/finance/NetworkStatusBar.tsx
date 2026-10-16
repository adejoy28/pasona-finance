import React, { useState, useEffect } from "react";
import { CloudOff, RefreshCw, AlertCircle, LogIn, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { notify } from "@/hooks/use-toast";
import { useNavigate } from "react-router";

export function NetworkStatusBar() {
  const { isOnline, isSyncing, pendingCount, flushQueue } = useOfflineSync();
  const [serverUnreachable, setServerUnreachable] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const navigate = useNavigate();

  // Listen to network status events dispatched by the API interceptor
  useEffect(() => {
    const handleServerDown = () => setServerUnreachable(true);
    const handleServerUp = () => setServerUnreachable(false);
    const handleReauth = () => setSessionExpired(true);
    const handleAuthRestored = () => setSessionExpired(false);
    const handleSyncStart = (e: any) => {
      setSyncCount(e.detail?.count || pendingCount || 0);
    };

    window.addEventListener("pasona:server-unreachable", handleServerDown);
    window.addEventListener("pasona:server-restored", handleServerUp);
    window.addEventListener("pasona:reauth-required", handleReauth);
    window.addEventListener("pasona:auth-restored", handleAuthRestored);
    window.addEventListener("pasona:sync-start", handleSyncStart);

    return () => {
      window.removeEventListener("pasona:server-unreachable", handleServerDown);
      window.removeEventListener("pasona:server-restored", handleServerUp);
      window.removeEventListener("pasona:reauth-required", handleReauth);
      window.removeEventListener("pasona:auth-restored", handleAuthRestored);
      window.removeEventListener("pasona:sync-start", handleSyncStart);
    };
  }, [pendingCount]);

  // When syncing completes, emit feedback
  useEffect(() => {
    const handleSyncComplete = (e: any) => {
      const count = e.detail?.count || 1;
      notify.success(`Synced ${count} change${count === 1 ? "" : "s"}`);
    };

    window.addEventListener("pasona:sync-success", handleSyncComplete);
    return () => {
      window.removeEventListener("pasona:sync-success", handleSyncComplete);
    };
  }, []);

  const handleRetryServer = async () => {
    try {
      const res = await fetch("/api/up", { method: "GET" }).catch(() => null);
      if (res && res.ok) {
        setServerUnreachable(false);
        notify.success("Connected to server");
        void flushQueue();
      } else {
        notify.error("Server is still unreachable");
      }
    } catch {
      notify.error("Server is still unreachable");
    }
  };

  const handleSignIn = () => {
    setSessionExpired(false);
    void navigate("/login");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[90] pointer-events-none flex justify-center">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto mt-2 px-3.5 py-1.5 rounded-full bg-[#12193A] text-amber-300 text-xs font-bold border border-amber-500/30 shadow-lg flex items-center gap-2 select-none"
          >
            <CloudOff size={13} className="shrink-0 text-amber-400" />
            <span>Offline — changes are saved on this device</span>
            {pendingCount > 0 && (
              <span className="bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full text-[10px]">
                {pendingCount} pending
              </span>
            )}
          </motion.div>
        )}

        {isOnline && isSyncing && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto mt-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)] text-[var(--ink)] text-xs font-bold border border-[var(--line)] shadow-lg flex items-center gap-2 select-none"
          >
            <RefreshCw size={13} className="animate-spin text-[var(--primary)] shrink-0" />
            <span>
              {syncCount > 0
                ? `Syncing ${syncCount} change${syncCount === 1 ? "" : "s"}...`
                : "Syncing changes..."}
            </span>
          </motion.div>
        )}

        {isOnline && serverUnreachable && !isSyncing && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto mt-2 px-3.5 py-1.5 rounded-full bg-rose-950 text-rose-200 text-xs font-bold border border-rose-500/40 shadow-lg flex items-center gap-2.5 select-none"
          >
            <AlertCircle size={13} className="shrink-0 text-rose-400" />
            <span>Server unreachable</span>
            <button
              type="button"
              onClick={() => void handleRetryServer()}
              className="px-2 py-0.5 rounded-md bg-rose-500/30 hover:bg-rose-500/50 text-white text-[10.5px] font-black uppercase cursor-pointer"
            >
              Try again
            </button>
          </motion.div>
        )}

        {sessionExpired && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto mt-2 px-3.5 py-1.5 rounded-full bg-indigo-950 text-indigo-200 text-xs font-bold border border-indigo-500/40 shadow-lg flex items-center gap-2.5 select-none"
          >
            <LogIn size={13} className="shrink-0 text-indigo-400" />
            <span>Session expired</span>
            <button
              type="button"
              onClick={handleSignIn}
              className="px-2 py-0.5 rounded-md bg-indigo-500 text-white text-[10.5px] font-black uppercase hover:bg-indigo-400 cursor-pointer"
            >
              Sign in
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
