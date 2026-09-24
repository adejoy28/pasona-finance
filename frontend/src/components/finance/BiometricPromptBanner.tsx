import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Capacitor } from "@capacitor/core";
import { Fingerprint, X, ChevronRight } from "lucide-react";
import { checkBiometricAvailability, hasBiometricCredentials } from "@/lib/auth/biometric";

const STORAGE_KEY = "pasona-biometric-prompt-dismissed";

export function BiometricPromptBanner() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [biometryLabel, setBiometryLabel] = useState("Fingerprint");

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1") {
      return;
    }

    let isMounted = true;
    async function checkStatus() {
      try {
        const availability = await checkBiometricAvailability();
        if (!availability.available || availability.biometryType === "none") {
          return;
        }

        const isConfigured = await hasBiometricCredentials();
        if (isConfigured) {
          return;
        }

        if (isMounted) {
          const label =
            availability.biometryType === "face"
              ? "Face ID"
              : availability.biometryType === "iris"
                ? "Iris recognition"
                : "Fingerprint";
          setBiometryLabel(label);
          setVisible(true);
        }
      } catch {
        // Silently skip if plugin is unsupported or fails
      }
    }

    void checkStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
  };

  const handleEnable = () => {
    navigate("/settings");
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 border-b border-blue-200/80 bg-blue-50/90 px-4 py-2.5 text-blue-900 backdrop-blur-sm transition-all"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Fingerprint size={16} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold truncate">
            Enable {biometryLabel} for faster, secure sign-in.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleEnable}
          className="inline-flex items-center gap-1 rounded-full bg-[#101b45] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white transition-all hover:bg-blue-900 active:scale-95 cursor-pointer shadow-xs"
        >
          Enable
          <ChevronRight size={12} />
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss fingerprint prompt"
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-blue-100/60 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
