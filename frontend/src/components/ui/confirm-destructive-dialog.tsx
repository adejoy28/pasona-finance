import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export interface ConfirmDestructiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmKeyword?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingWarning?: string;
  onConfirm: () => Promise<void> | void;
}

/**
 * Universal Destructive Confirmation Dialog (Phase 3):
 * - Used for: delete account, undo import, delete category, sign out with offline records.
 * - Optional confirmKeyword (e.g. "DELETE") required to activate destructive CTA.
 * - Focus safely defaults to "Cancel" on mount to prevent accidental keystroke triggers.
 */
export function ConfirmDestructiveDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmKeyword,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  pendingWarning,
  onConfirm,
}: ConfirmDestructiveDialogProps) {
  const [typedKeyword, setTypedKeyword] = useState("");
  const [busy, setBusy] = useState(false);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setTypedKeyword("");
      setBusy(false);
      setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
    }
  }, [open]);

  const canConfirm = !confirmKeyword || typedKeyword.trim().toUpperCase() === confirmKeyword.toUpperCase();

  const handleConfirm = async () => {
    if (!canConfirm || busy) return;
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      console.error("Destructive action failed", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <AlertDialogContent className="max-w-[400px] rounded-3xl p-6 bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] shadow-2xl">
        <AlertDialogHeader className="space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-[var(--neg,#B63F2E)] flex items-center justify-center shrink-0">
            <AlertTriangle size={22} />
          </div>

          <AlertDialogTitle className="text-lg font-bold text-[var(--ink)] tracking-tight">
            {title}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-xs font-medium text-[var(--muted)] leading-relaxed">
            {description}
          </AlertDialogDescription>

          {pendingWarning && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-[var(--warn,#E8A317)] flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{pendingWarning}</span>
            </div>
          )}

          {confirmKeyword && (
            <div className="space-y-1.5 pt-1">
              <label
                htmlFor="destructive-confirm-input"
                className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block"
              >
                Type <strong className="text-[var(--neg,#B63F2E)]">{confirmKeyword}</strong> to confirm
              </label>
              <input
                id="destructive-confirm-input"
                type="text"
                autoComplete="off"
                spellCheck="false"
                value={typedKeyword}
                onChange={(e) => setTypedKeyword(e.target.value)}
                placeholder={confirmKeyword}
                className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--ink)] focus:outline-none focus:border-[var(--neg)] shadow-inner tracking-widest uppercase"
              />
            </div>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-row items-center justify-end gap-2 pt-3">
          <AlertDialogCancel
            ref={cancelBtnRef}
            disabled={busy}
            className="mt-0 py-2.5 px-4 rounded-xl text-xs font-bold bg-[var(--chip)] border-0 text-[var(--ink)] hover:bg-[var(--line)] cursor-pointer"
          >
            {cancelLabel}
          </AlertDialogCancel>

          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!canConfirm || busy}
            className={cn(
              "py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm",
              "bg-[var(--neg,#B63F2E)] hover:brightness-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed",
            )}
          >
            {busy ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Working...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
