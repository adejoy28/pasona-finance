import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

const STORAGE_KEY = "pasona-new-look-dismissed";

export function NewLookBanner() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    setHidden(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const dismiss = () => {
    setHidden(true);
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, "1");
  };

  if (hidden) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 border-b border-blue-200 bg-blue-50/80 px-4 py-2.5 text-blue-900 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles size={16} className="flex-shrink-0 text-blue-600" aria-hidden />
        <span className="text-xs font-bold truncate">
          Fresh look, same Pasona. Welcome to the new design.
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--navy-900)] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white transition-colors hover:opacity-90"
        >
          Got it
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex h-7 w-7 items-center justify-center rounded-full text-blue-700 transition-colors hover:bg-blue-100"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
