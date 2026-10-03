import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastItem, useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ICONS = {
  success: <CheckCircle2 size={18} className="text-[var(--pos,#1B7A52)] shrink-0 mt-0.5" />,
  error: <AlertCircle size={18} className="text-[var(--neg,#B63F2E)] shrink-0 mt-0.5" />,
  warn: <AlertTriangle size={18} className="text-[var(--warn,#E8A317)] shrink-0 mt-0.5" />,
  info: <Info size={18} className="text-[var(--accent,#1747D1)] shrink-0 mt-0.5" />,
};

interface ToastCardProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

export function ToastCard({ item, onDismiss }: ToastCardProps) {
  const [undoing, setUndoing] = useState(false);

  const handleUndo = async () => {
    if (!item.undo || undoing) return;
    setUndoing(true);
    try {
      await item.undo.onUndo();
    } catch (err) {
      console.error("Undo action failed", err);
    } finally {
      setUndoing(false);
      onDismiss(item.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      role={item.type === "error" ? "alert" : "status"}
      aria-live={item.type === "error" ? "assertive" : "polite"}
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-2xl p-3.5 shadow-xl border flex items-start gap-3 backdrop-blur-md select-none transition-colors",
        "bg-[var(--surface)] text-[var(--ink)] border-[var(--line)]",
        item.type === "error" && "border-rose-500/30",
        item.type === "warn" && "border-amber-500/30",
      )}
    >
      {ICONS[item.type]}

      <div className="flex-1 min-w-0 pr-1">
        {item.title && (
          <h4 className="text-xs font-bold text-[var(--ink)] tracking-tight mb-0.5 leading-tight truncate">
            {item.title}
          </h4>
        )}
        <p className="text-xs font-semibold text-[var(--ink)] leading-snug break-words">
          {item.message}
        </p>
        {item.description && (
          <p className="text-[11px] font-medium text-[var(--muted)] mt-0.5 leading-tight break-words">
            {item.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        {item.undo && (
          <button
            type="button"
            onClick={() => void handleUndo()}
            disabled={undoing}
            className="px-2 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider text-[var(--primary,#1F5BFF)] bg-[var(--chip)] hover:bg-[var(--line)] active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {undoing ? (
              <span className="flex items-center gap-1">
                <Loader2 size={11} className="animate-spin" />
                Undoing
              </span>
            ) : (
              item.undo.label || "Undo"
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          aria-label="Dismiss"
          className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      aria-label="Notifications"
      className="fixed z-[100] pointer-events-none flex flex-col gap-2 max-w-sm w-full px-4 bottom-20 left-1/2 -translate-x-1/2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0 items-center sm:items-end"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
