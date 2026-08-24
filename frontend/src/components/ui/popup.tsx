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
  success: { accent: "bg-[#101b45]", icon: "✓" },
  error: { accent: "bg-rose-500", icon: "!" },
  info: { accent: "bg-blue-500", icon: "i" },
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
      <div
        className={cn(
          "fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 p-4 transition-all duration-500",
          popups.length > 0
            ? "bg-slate-900/40 backdrop-blur-sm pointer-events-auto opacity-100"
            : "bg-slate-900/0 backdrop-blur-none pointer-events-none opacity-0"
        )}
      >
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
        "pointer-events-auto w-full max-w-[320px] rounded-3xl bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] overflow-hidden p-8 flex flex-col items-center text-center",
        "animate-[popup-in_250ms_ease-out_forwards]",
        item.removing && "animate-[popup-out_200ms_ease-in_forwards]",
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full text-5xl font-black text-white mb-6 transition-transform duration-500",
          item.variant === "success" && "animate-[bounce_1s_ease-in-out_infinite]",
          v.accent,
        )}
      >
        {v.icon}
      </div>
      <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
        {item.variant === "success" && !item.message.toLowerCase().includes("success") ? "Success!" : ""}
        {item.variant === "error" && !item.message.toLowerCase().includes("error") ? "Uh oh" : ""}
        {(item.variant === "info" || item.message.toLowerCase().includes("success") || item.message.toLowerCase().includes("error")) ? item.message : ""}
      </h3>
      
      <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
        {(item.variant === "success" && !item.message.toLowerCase().includes("success")) || (item.variant === "error" && !item.message.toLowerCase().includes("error")) ? item.message : ""}
        {item.description && <><br /><span className="opacity-80">{item.description}</span></>}
      </p>

      <button
        onClick={onDismiss}
        className={cn(
          "w-full py-3.5 rounded-2xl font-bold text-base text-white transition-opacity hover:opacity-90 active:scale-[0.98]",
          v.accent,
        )}
      >
        Close
      </button>
    </div>
  );
}

export function usePopup(): PopupContextValue {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error("usePopup must be used within a PopupProvider");
  return ctx;
}
