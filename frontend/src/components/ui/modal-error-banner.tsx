import React from "react";
import { AlertCircle, RotateCcw, LogIn, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";

export interface ModalErrorBannerProps {
  error?: unknown;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Modal Failure Banner (Phase 3):
 * - Renders inside modals upon save failure.
 * - Standard copy: "We could not save this. Nothing was lost." with [Try again]
 * - If 401: prompts "Session expired. Sign in to save your changes." with [Sign in]
 * - Form values remain intact.
 */
export function ModalErrorBanner({
  error,
  onRetry,
  onDismiss,
  className = "",
}: ModalErrorBannerProps) {
  if (!error) return null;

  const is401 = error instanceof ApiError && error.status === 401;
  const isNetwork =
    error instanceof ApiError && (error.kind === "network" || error.kind === "timeout");

  const message = is401
    ? "Your session expired. Sign in to save your changes."
    : isNetwork
    ? "Could not reach the server. We saved your draft locally."
    : "We could not save this. Nothing was lost.";

  return (
    <div
      role="alert"
      className={`p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-[var(--ink)] flex items-center justify-between gap-3 animate-slide-up select-none ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <AlertCircle size={15} />
        </div>
        <p className="text-xs font-bold leading-snug truncate">
          {message}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {is401 ? (
          <button
            type="button"
            onClick={() => {
              // Trigger re-auth overlay or redirect
              window.dispatchEvent(new CustomEvent("pasona:reauth-required"));
            }}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--primary,#1F5BFF)] text-white hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
          >
            <LogIn size={12} />
            <span>Sign in</span>
          </button>
        ) : onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--chip)] transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <RotateCcw size={12} />
            <span>Try again</span>
          </button>
        ) : null}

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss banner"
            className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
