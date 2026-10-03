import { createContext, useContext, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

interface UndoToastContextValue {
  showUndo: (message: string, onUndo?: (() => void | Promise<void>) | null, durationMs?: number) => void;
  dismiss: () => void;
}

const contextValue: UndoToastContextValue = {
  showUndo: (message: string, onUndo?: (() => void | Promise<void>) | null, durationMs?: number) => {
    toast.success(message, {
      duration: durationMs ?? 6000,
      undo: onUndo ? { onUndo } : undefined,
    });
  },
  dismiss: () => toast.dismiss(),
};

const UndoToastContext = createContext<UndoToastContextValue>(contextValue);

export function UndoToastProvider({ children }: { children: ReactNode }) {
  return (
    <UndoToastContext.Provider value={contextValue}>
      {children}
    </UndoToastContext.Provider>
  );
}

export function useUndoToast(): UndoToastContextValue {
  return useContext(UndoToastContext) || contextValue;
}
