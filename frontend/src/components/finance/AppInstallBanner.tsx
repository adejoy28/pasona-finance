import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { Capacitor } from "@capacitor/core";
import { X, Smartphone } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { motion, AnimatePresence } from "framer-motion";

export function AppInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isInstallable, install } = usePwaInstall();

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

    // 3. Check sessionStorage so it only reappears per-session
    const isHidden = sessionStorage.getItem("pasona_hide_install_banner");
    if (!isHidden) {
      // Delay showing it slightly for a subtler entry
      const timer = setTimeout(() => setIsVisible(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem("pasona_hide_install_banner", "true");
  };

  const handleInstall = () => {
    if (isInstallable) {
      install();
    } else {
      navigate("/download");
    }
    // Also hide the banner after they click install to avoid friction
    handleClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-3 left-3 right-3 md:left-auto md:right-4 z-[100] md:w-96"
        >
          <div className="bg-[#0b1329]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 flex items-center justify-between gap-4 relative overflow-hidden">
            {/* Subtle glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-emerald-500/10 blur-xl opacity-50 pointer-events-none" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Smartphone size={20} />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-white">Get the App</p>
                <p className="text-[10px] text-slate-400">Faster, offline, secure.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
              <button
                onClick={handleInstall}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
              >
                Install
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
