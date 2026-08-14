import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type PopupVariant = "success" | "error" | "info";

interface PopupItem {
  id: number;
  message: string;
  description?: string;
  variant: PopupVariant;
  removing: boolean;
}

interface PopupContextValue {
  success: (message: string, opts?: { description?: string; duration?: number }) => void;
  error: (message: string, opts?: { description?: string; duration?: number }) => void;
  info: (message: string, opts?: { description?: string; duration?: number }) => void;
}

const PopupContext = createContext<PopupContextValue | null>(null);

let nextId = 0;

const VARIANT_STYLES: Record<PopupVariant, { accent: string; icon: string }> = {
  success: { accent: "bg-emerald-500", icon: "✓" },
  error: { accent: "bg-red-500", icon: "✕" },
  info: { accent: "bg-blue-500", icon: "ℹ" },
};

const DEFAULT_DURATIONS: Record<PopupVariant, number> = {
  success: 3000,
  error: 5000,
  info: 3000,
};

export function PopupProvider({ children }: { children: ReactNode }) {
  const [popups, setPopups] = useState<PopupItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setPopups((prev) => prev.map((p) => (p.id === id ? { ...p, removing: true } : p)));
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 200);
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (variant: PopupVariant, message: string, opts?: { description?: string; duration?: number }) => {
      const id = nextId++;
      const duration = opts?.duration ?? DEFAULT_DURATIONS[variant];
      setPopups((prev) => [...prev, { id, message, description: opts?.description, variant, removing: false }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const contextValue: PopupContextValue = {
    success: (msg, opts) => show("success", msg, opts),
    error: (msg, opts) => show("error", msg, opts),
    info: (msg, opts) => show("info", msg, opts),
  };

  return (
    <PopupContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
        {popups.map((p) => (
          <PopupCard key={p.id} item={p} onDismiss={() => dismiss(p.id)} />
        ))}
      </div>
    </PopupContext.Provider>
  );
}

function PopupCard({ item, onDismiss }: { item: PopupItem; onDismiss: () => void }) {
  const v = VARIANT_STYLES[item.variant];
  return (
    <div
      className={cn(
        "pointer-events-auto w-80 rounded-2xl border border-border bg-background shadow-lg overflow-hidden",
        "animate-[popup-in_250ms_ease-out_forwards]",
        item.removing && "animate-[popup-out_200ms_ease-in_forwards]",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 p-4">
        <span
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
            v.accent,
          )}
        >
          {v.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-snug">{item.message}</p>
          {item.description && (
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.description}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 mt-0.5 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export function usePopup(): PopupContextValue {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error("usePopup must be used within a PopupProvider");
  return ctx;
}
