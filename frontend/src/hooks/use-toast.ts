import { useState, useEffect } from "react";

export type ToastType = "success" | "info" | "warn" | "error";

export interface ToastUndoAction {
  label?: string;
  onUndo: () => void | Promise<void>;
}

export interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  duration?: number;
  undo?: ToastUndoAction;
}

export interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
  message: string;
  createdAt: number;
}

const TOAST_LIMIT = 3;
const DEFAULT_DISMISS_DELAY = 5000;

let count = 0;
function genId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return `toast-${count}-${Date.now()}`;
}

type Action =
  | { type: "ADD_TOAST"; toast: ToastItem }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

interface State {
  toasts: ToastItem[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

let memoryState: State = { toasts: [] };
const listeners: Array<(state: State) => void> = [];

function dispatch(action: Action) {
  switch (action.type) {
    case "ADD_TOAST": {
      // Stack max 3: if exceeding, drop oldest
      const nextToasts = [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT);
      memoryState = { toasts: nextToasts };
      break;
    }
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) {
        memoryState = {
          toasts: memoryState.toasts.filter((t) => t.id !== toastId),
        };
      } else {
        memoryState = { toasts: [] };
      }
      break;
    }
    case "REMOVE_TOAST": {
      const { toastId } = action;
      if (toastId) {
        memoryState = {
          toasts: memoryState.toasts.filter((t) => t.id !== toastId),
        };
      }
      break;
    }
  }

  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function addToRemoveQueue(toastId: string, duration: number) {
  if (duration <= 0) return; // Errors or persistent toasts stay until dismissed

  if (toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId)!);
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "DISMISS_TOAST", toastId });
  }, duration);

  toastTimeouts.set(toastId, timeout);
}

export function toast(type: ToastType, message: string, options?: ToastOptions): string {
  const id = options?.id || genId();
  // Brief spec: auto-dismiss 5s, except error toasts which stay until dismissed
  const duration =
    options?.duration !== undefined
      ? options.duration
      : type === "error"
      ? 0
      : DEFAULT_DISMISS_DELAY;

  const item: ToastItem = {
    ...options,
    id,
    type,
    message,
    duration,
    createdAt: Date.now(),
  };

  dispatch({ type: "ADD_TOAST", toast: item });
  addToRemoveQueue(id, duration);

  return id;
}

toast.success = (message: string, options?: ToastOptions) => toast("success", message, options);
toast.info = (message: string, options?: ToastOptions) => toast("info", message, options);
toast.warn = (message: string, options?: ToastOptions) => toast("warn", message, options);
toast.error = (message: string, options?: ToastOptions) => toast("error", message, options);
toast.dismiss = (toastId?: string) => {
  if (toastId && toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId)!);
    toastTimeouts.delete(toastId);
  }
  dispatch({ type: "DISMISS_TOAST", toastId });
};

export function useToast() {
  const [state, setState] = useState<State>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    toasts: state.toasts,
    toast,
    dismiss: (toastId?: string) => toast.dismiss(toastId),
    success: (msg: string, opts?: ToastOptions) => toast.success(msg, opts),
    info: (msg: string, opts?: ToastOptions) => toast.info(msg, opts),
    warn: (msg: string, opts?: ToastOptions) => toast.warn(msg, opts),
    error: (msg: string, opts?: ToastOptions) => toast.error(msg, opts),
  };
}
