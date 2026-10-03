import { createContext, useContext, type ReactNode } from "react";
import { toast, type ToastOptions } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export interface PopupContextValue {
  success: (message: string, opts?: { description?: string; duration?: number; undo?: ToastOptions["undo"] }) => void;
  error: (message: string, opts?: { description?: string; duration?: number }) => void;
  info: (message: string, opts?: { description?: string; duration?: number }) => void;
  fact: (message: string, opts?: { description?: string; duration?: number }) => void;
}

const contextValue: PopupContextValue = {
  success: (msg, opts) =>
    toast.success(msg, { description: opts?.description, duration: opts?.duration, undo: opts?.undo }),
  error: (msg, opts) =>
    toast.error(msg, { description: opts?.description, duration: opts?.duration }),
  info: (msg, opts) =>
    toast.info(msg, { description: opts?.description, duration: opts?.duration }),
  fact: (msg, opts) =>
    toast.warn(msg, { title: "Money Insight", description: opts?.description, duration: opts?.duration ?? 7000 }),
};

const PopupContext = createContext<PopupContextValue>(contextValue);

export function PopupProvider({ children }: { children: ReactNode }) {
  return (
    <PopupContext.Provider value={contextValue}>
      {children}
      <Toaster />
    </PopupContext.Provider>
  );
}

export function usePopup(): PopupContextValue {
  return useContext(PopupContext) || contextValue;
}
