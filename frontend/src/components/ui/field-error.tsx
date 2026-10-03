import React, { useState, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export interface FieldErrorProps {
  error?: string | null;
  className?: string;
}

/**
 * Accessible field-level error message:
 * - Displays underneath form input or label
 * - role="alert" for immediate screen reader announcement
 * - Styled with semantic negative token
 */
export function FieldError({ error, className }: FieldErrorProps) {
  if (!error) return null;

  return (
    <p
      role="alert"
      className={cn(
        "text-[11.5px] font-semibold text-[var(--neg,#B63F2E)] mt-1.5 flex items-center gap-1.5 animate-slide-up",
        className,
      )}
    >
      <AlertCircle size={13} className="shrink-0" />
      <span>{error}</span>
    </p>
  );
}

/**
 * Hook to manage field-level form validation errors:
 * - Direct mapping from Laravel 422 API responses
 * - Automatically scrolls and focuses the first invalid input
 * - Clears error on edit/keystroke
 */
export function useFieldErrors<T extends Record<string, unknown>>() {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const setFieldError = useCallback((field: keyof T, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setFromApiError = useCallback((err: unknown): boolean => {
    if (err instanceof ApiError && err.status === 422) {
      const valErrors = err.getValidationErrors();
      const mapped: Partial<Record<keyof T, string>> = {};

      for (const [key, msgs] of Object.entries(valErrors)) {
        if (msgs && msgs.length > 0) {
          mapped[key as keyof T] = msgs[0];
        }
      }

      setErrors(mapped);

      // Move keyboard focus to the first invalid field
      const firstField = Object.keys(mapped)[0];
      if (firstField && typeof document !== "undefined") {
        setTimeout(() => {
          const el =
            document.querySelector(`[name="${firstField}"]`) ||
            document.querySelector(`#${firstField}`) ||
            document.querySelector(`[data-field="${firstField}"]`);

          if (el instanceof HTMLElement) {
            el.focus();
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 50);
      }

      return true;
    }
    return false;
  }, []);

  const clearAll = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    setFieldError,
    clearFieldError,
    setFromApiError,
    clearAll,
    hasErrors: Object.keys(errors).length > 0,
  };
}
