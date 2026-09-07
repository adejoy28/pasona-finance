import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { Capacitor } from "@capacitor/core";
import { X, Smartphone, Download, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AppInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const apkUrl = import.meta.env.VITE_ANDROID_APK_URL || "https://pub-ec0e39289eae45ad9b4b896d31ed8d25.r2.dev/pasona.apk";
  const apkVersion = import.meta.env.VITE_ANDROID_APK_VERSION || "1.0";
  const apkSize = import.meta.env.VITE_ANDROID_APK_SIZE || "12 MB";

  useEffect(() => {
    // 1. Never show if running natively in the APK/Capacitor shell
    if (Capacitor.isNativePlatform()) {
      return;
    }

    // 2. Never show if they are actively on the /download page
    if (location.pathname === "/download") {
      setIsVisible(false);
      return;
    }

    // 3. Check sessionStorage so it only appears once per session if dismissed
    const isDismissed = sessionStorage.getItem("pasona_hide_apk_prompt");
    if (!isDismissed) {
      // Delay showing it slightly for a smooth, subtle entry
      const timer = setTimeout(() => setIsVisible(true), 2200);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem("pasona_hide_apk_prompt", "true");
  };

  const handleDownloadClick = () => {
    handleClose();
    // Navigate or trigger APK download
    if (apkUrl) {
      const link = document.createElement("a");
      link.href = apkUrl;
      link.setAttribute("download", "pasona.apk");
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      navigate("/download");
    }
  };

  const handleLearnMore = () => {
    handleClose();
    navigate("/download");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          role="region"
          aria-label="Android App Download Prompt"
          initial={{ y: -20, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="fixed top-3 left-3 right-3 sm:left-auto sm:right-5 sm:top-auto sm:bottom-5 sm:max-w-[370px] z-50"
        >
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-[#0b132b]/95 p-3.5 shadow-2xl backdrop-blur-xl card-shadow">
            {/* Ambient subtle glow */}
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-blue-500/15 blur-2xl" />
            <div className="pointer-events-none absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/15 text-blue-400 shadow-inner">
                  <Smartphone size={20} className="stroke-[2.2]" />
                </div>
                <div className="space-y-0.5 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold tracking-tight text-white">
                      Get Pasona for Android
                    </span>
                    <span className="rounded-full bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-bold text-blue-300">
                      APK
                    </span>
                  </div>
                  <p className="text-[11px] leading-tight text-slate-400">
                    Faster, offline access & native experience
                  </p>
                  <p className="text-[10px] text-slate-500">
                    v{apkVersion} • {apkSize}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
                aria-label="Dismiss download prompt"
              >
                <X size={15} />
              </button>
            </div>

            {/* Actions */}
            <div className="relative z-10 mt-3 flex items-center justify-end gap-2 pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={handleLearnMore}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:text-white"
              >
                Details <ArrowRight size={12} />
              </button>
              <button
                type="button"
                onClick={handleDownloadClick}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition-all hover:bg-blue-500 active:scale-95"
              >
                <Download size={13} strokeWidth={2.5} />
                Download APK
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

