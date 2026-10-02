import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import {
  X,
  Smartphone,
  Download,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Settings as SettingsIcon,
  Loader2,
  Fingerprint,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  checkForUpdate,
  AppUpdateNative,
  type UpdateCheckResult,
} from "@/lib/updater";
import { checkBiometricAvailability, hasBiometricCredentials } from "@/lib/auth/biometric";
import { useMe } from "@/hooks/use-me";

type UpdateState =
  | "idle"
  | "available"
  | "downloading"
  | "ready"
  | "needs_permission"
  | "error";

const BIOMETRIC_STORAGE_KEY = "pasona-biometric-prompt-dismissed";
const APK_PROMPT_STORAGE_KEY = "pasona_hide_apk_prompt";

/**
 * Unified subtle, dismissable popup manager for:
 * 1. App Updates (Native Android OTA)
 * 2. Biometric Registration Prompt (Native Android / iOS)
 * 3. App Download Prompt (Web / PWA visitors)
 *
 * Designed to never clash with:
 * - Mobile bottom navigation bar (fixed bottom-0)
 * - Desktop sidebar (fixed left-0 w-64)
 * - AI Chat floating button (bottom-24 right-5)
 * - Page headers & interactive components
 */
export function SubtlePopups() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: currentUser } = useMe();

  const isNative = Capacitor.isNativePlatform();
  const isNativeAndroid = isNative && Capacitor.getPlatform() === "android";

  // =========================================================================
  // 1. Native Android Update State & Flow
  // =========================================================================
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [downloadPercent, setDownloadPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const isCheckingRef = useRef(false);

  const performUpdateCheck = useCallback(async () => {
    if (!isNativeAndroid || isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      const result = await checkForUpdate();
      if (result.hasUpdate && result.metadata) {
        const dismissKey = `pasona_dismiss_update_${result.metadata.latestVersionCode}`;
        const isDismissed = sessionStorage.getItem(dismissKey);

        if (!isDismissed || result.isForced) {
          setUpdateResult(result);
          setUpdateState("available");
        }
      }
    } catch (err) {
      console.warn("[updater] Update check error:", err);
    } finally {
      isCheckingRef.current = false;
    }
  }, [isNativeAndroid]);

  useEffect(() => {
    if (!isNativeAndroid) return;

    void performUpdateCheck();

    const handlePromise = CapApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        void performUpdateCheck();
      }
    });

    return () => {
      void handlePromise.then((h) => h.remove());
    };
  }, [isNativeAndroid, performUpdateCheck]);

  const handleDismissUpdate = () => {
    if (updateResult?.metadata) {
      sessionStorage.setItem(
        `pasona_dismiss_update_${updateResult.metadata.latestVersionCode}`,
        "true"
      );
    }
    setUpdateState("idle");
  };

  const handleStartDownload = async () => {
    if (!updateResult?.metadata) return;

    setUpdateState("downloading");
    setDownloadPercent(0);
    setErrorMessage("");

    let progressSub: { remove: () => void } | null = null;

    try {
      progressSub = await AppUpdateNative.addListener(
        "downloadProgress",
        (p) => {
          if (p.percent >= 0) {
            setDownloadPercent(Math.min(p.percent, 100));
          }
        }
      );

      const res = await AppUpdateNative.downloadApk({
        url: updateResult.metadata.downloadUrl,
        versionCode: updateResult.metadata.latestVersionCode,
      });

      if (res.success) {
        setDownloadPercent(100);
        setUpdateState("ready");
        await handleTriggerInstall(updateResult.metadata.latestVersionCode);
      } else {
        throw new Error("Download completed without success flag");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[updater] Download error:", msg);
      setErrorMessage(msg || "Failed to download update APK.");
      setUpdateState("error");
    } finally {
      if (progressSub) {
        progressSub.remove();
      }
    }
  };

  const handleTriggerInstall = async (versionCodeOverride?: number) => {
    const vCode = versionCodeOverride || updateResult?.metadata?.latestVersionCode;
    if (!vCode) return;

    try {
      const perm = await AppUpdateNative.canRequestPackageInstalls();
      if (!perm.canInstall) {
        setUpdateState("needs_permission");
        return;
      }

      const res = await AppUpdateNative.installApk({ versionCode: vCode });
      if (res.needsPermission) {
        setUpdateState("needs_permission");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[updater] Install trigger error:", msg);
      setErrorMessage(msg || "Failed to launch package installer.");
      setUpdateState("error");
    }
  };

  const handleOpenSettings = async () => {
    try {
      await AppUpdateNative.openInstallPermissionSettings();
    } catch (err) {
      console.error("[updater] Failed to open settings:", err);
    }
  };

  // =========================================================================
  // 2. Biometric Registration Prompt State & Flow
  // =========================================================================
  const [biometricVisible, setBiometricVisible] = useState(false);
  const [biometryLabel, setBiometryLabel] = useState("Fingerprint");

  useEffect(() => {
    // Biometric prompt is only for native app users who are logged in
    if (!isNative || !currentUser) {
      setBiometricVisible(false);
      return;
    }

    if (typeof localStorage !== "undefined" && localStorage.getItem(BIOMETRIC_STORAGE_KEY) === "1") {
      setBiometricVisible(false);
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
          setBiometricVisible(true);
        }
      } catch {
        // Silently skip if plugin fails
      }
    }

    void checkStatus();

    return () => {
      isMounted = false;
    };
  }, [isNative, currentUser]);

  const handleDismissBiometrics = () => {
    setBiometricVisible(false);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(BIOMETRIC_STORAGE_KEY, "1");
    }
  };

  const handleEnableBiometrics = () => {
    setBiometricVisible(false);
    navigate("/settings");
  };

  // =========================================================================
  // 3. Web / PWA Download APK Prompt Flow
  // =========================================================================
  const [isWebVisible, setIsWebVisible] = useState(false);
  const apkUrl =
    import.meta.env.VITE_ANDROID_APK_URL ||
    "https://pub-ec0e39289eae45ad9b4b896d31ed8d25.r2.dev/pasona.apk";
  const apkVersion = import.meta.env.VITE_ANDROID_APK_VERSION || "1.0";
  const apkSize = import.meta.env.VITE_ANDROID_APK_SIZE || "12 MB";

  useEffect(() => {
    if (isNative) return;
    if (location.pathname === "/download") {
      setIsWebVisible(false);
      return;
    }

    const isDismissed = sessionStorage.getItem(APK_PROMPT_STORAGE_KEY);
    if (!isDismissed) {
      const timer = setTimeout(() => setIsWebVisible(true), 2400);
      return () => clearTimeout(timer);
    }
  }, [isNative, location.pathname]);

  const handleCloseWebDownload = () => {
    setIsWebVisible(false);
    sessionStorage.setItem(APK_PROMPT_STORAGE_KEY, "true");
  };

  const handleDownloadWebApk = () => {
    handleCloseWebDownload();
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

  // =========================================================================
  // Priority Arbitration: Show only ONE subtle popup at a time
  // 1. App Update (Critical / maintenance)
  // 2. Biometric Registration (Native security improvement)
  // 3. Web APK Download (Web user enhancement)
  // =========================================================================
  let currentPopup: "update" | "biometric" | "download" | null = null;
  if (updateState !== "idle") {
    currentPopup = "update";
  } else if (biometricVisible) {
    currentPopup = "biometric";
  } else if (isWebVisible) {
    currentPopup = "download";
  }

  return (
    <aside aria-label="Notifications and updates">
      <AnimatePresence mode="wait">
        {currentPopup === "update" && (
          <motion.div
            key="popup-update"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="fixed z-40 top-[max(0.75rem,env(safe-area-inset-top))] left-3 right-3 sm:left-auto sm:right-6 sm:top-5 sm:max-w-[390px] pointer-events-none"
          >
            <div className="pointer-events-auto relative overflow-hidden rounded-2xl border border-blue-500/25 bg-[#0b1434]/95 p-3.5 shadow-2xl backdrop-blur-xl text-white ring-1 ring-black/40">
              <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-blue-500/20 blur-2xl" />

              {/* Header */}
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-400">
                    {updateState === "ready" ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : updateState === "error" ? (
                      <AlertCircle size={18} className="text-rose-400" />
                    ) : updateState === "downloading" ? (
                      <Loader2 size={18} className="animate-spin text-blue-400" />
                    ) : (
                      <Smartphone size={18} className="stroke-[2.2]" />
                    )}
                  </div>

                  <div className="space-y-0.5 pt-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold tracking-tight text-white">
                        {updateState === "downloading"
                          ? "Downloading Update"
                          : updateState === "ready"
                          ? "Update Ready"
                          : updateState === "needs_permission"
                          ? "Permission Required"
                          : updateState === "error"
                          ? "Update Error"
                          : "New Version Available"}
                      </span>
                      {updateResult?.metadata?.latestVersionName && (
                        <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-300">
                          v{updateResult.metadata.latestVersionName}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] leading-tight text-slate-300">
                      {updateState === "downloading"
                        ? `Downloading package... ${downloadPercent}%`
                        : updateState === "ready"
                        ? "Download complete. Continue to install."
                        : updateState === "needs_permission"
                        ? "Allow install from unknown apps in Settings."
                        : updateState === "error"
                        ? errorMessage || "An unexpected error occurred."
                        : `Pasona ${updateResult?.metadata?.latestVersionName || "update"} is available.`}
                    </p>
                  </div>
                </div>

                {!updateResult?.isForced && updateState !== "downloading" && (
                  <button
                    type="button"
                    onClick={handleDismissUpdate}
                    className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 cursor-pointer"
                    aria-label="Dismiss update prompt"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Release notes if provided */}
              {updateState === "available" && updateResult?.metadata?.releaseNotes && (
                <div className="relative z-10 mt-2 rounded-lg bg-white/5 p-2 text-[10px] text-slate-300 line-clamp-2 border border-white/5">
                  {updateResult.metadata.releaseNotes}
                </div>
              )}

              {/* Progress bar */}
              {updateState === "downloading" && (
                <div className="relative z-10 mt-2.5 space-y-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-150"
                      style={{ width: `${downloadPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Downloading APK</span>
                    <span>{downloadPercent}%</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="relative z-10 mt-2.5 flex items-center justify-end gap-2 pt-1.5 border-t border-white/10">
                {updateState === "available" && (
                  <>
                    {!updateResult?.isForced && (
                      <button
                        type="button"
                        onClick={handleDismissUpdate}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:text-white cursor-pointer"
                      >
                        Later
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleStartDownload}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition-all hover:bg-blue-500 active:scale-95 cursor-pointer"
                    >
                      <Download size={12} strokeWidth={2.5} />
                      Update now
                    </button>
                  </>
                )}

                {updateState === "ready" && (
                  <button
                    type="button"
                    onClick={() => handleTriggerInstall()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 transition-all hover:bg-emerald-500 active:scale-95 cursor-pointer"
                  >
                    <Download size={12} strokeWidth={2.5} />
                    Install update
                  </button>
                )}

                {updateState === "needs_permission" && (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenSettings}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-amber-600/30 transition-all hover:bg-amber-500 active:scale-95 cursor-pointer"
                    >
                      <SettingsIcon size={12} />
                      Open Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTriggerInstall()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-md transition-all hover:bg-blue-500 active:scale-95 cursor-pointer"
                    >
                      Try Install
                    </button>
                  </>
                )}

                {updateState === "error" && (
                  <button
                    type="button"
                    onClick={handleStartDownload}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-md transition-all hover:bg-blue-500 active:scale-95 cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    Retry
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {currentPopup === "biometric" && (
          <motion.div
            key="popup-biometric"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="fixed z-40 top-[max(0.75rem,env(safe-area-inset-top))] left-3 right-3 sm:left-auto sm:right-6 sm:top-5 sm:max-w-[380px] pointer-events-none"
          >
            <div className="pointer-events-auto relative overflow-hidden rounded-2xl border border-indigo-500/25 bg-[#0b1434]/95 p-3.5 shadow-2xl backdrop-blur-xl text-white ring-1 ring-black/40">
              <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-indigo-500/15 blur-2xl" />

              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-400">
                    <Fingerprint size={18} className="stroke-[2.2]" />
                  </div>

                  <div className="space-y-0.5 pt-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold tracking-tight text-white">
                        Enable {biometryLabel}
                      </span>
                      <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300">
                        Security
                      </span>
                    </div>

                    <p className="text-[11px] leading-tight text-slate-300">
                      Sign in faster and more securely with device biometrics.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismissBiometrics}
                  className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 cursor-pointer"
                  aria-label="Dismiss biometric prompt"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="relative z-10 mt-2.5 flex items-center justify-end gap-2 pt-1.5 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleDismissBiometrics}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:text-white cursor-pointer"
                >
                  Later
                </button>
                <button
                  type="button"
                  onClick={handleEnableBiometrics}
                  className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition-all hover:bg-blue-500 active:scale-95 cursor-pointer"
                >
                  Enable
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {currentPopup === "download" && (
          <motion.div
            key="popup-download"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="fixed z-40 top-[max(0.75rem,env(safe-area-inset-top))] left-3 right-3 sm:left-auto sm:right-6 sm:top-5 sm:max-w-[380px] pointer-events-none"
          >
            <div className="pointer-events-auto relative overflow-hidden rounded-2xl border border-blue-500/25 bg-[#0b1434]/95 p-3.5 shadow-2xl backdrop-blur-xl text-white ring-1 ring-black/40">
              <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-blue-500/15 blur-2xl" />
              <div className="pointer-events-none absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />

              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-400">
                    <Smartphone size={18} className="stroke-[2.2]" />
                  </div>

                  <div className="space-y-0.5 pt-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold tracking-tight text-white">
                        Get Pasona for Android
                      </span>
                      <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-300">
                        APK
                      </span>
                    </div>

                    <p className="text-[11px] leading-tight text-slate-300">
                      Faster offline access, biometric login & native speed.
                    </p>
                    <p className="text-[10px] text-slate-400">
                      v{apkVersion} • {apkSize}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseWebDownload}
                  className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 cursor-pointer"
                  aria-label="Dismiss download prompt"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="relative z-10 mt-2.5 flex items-center justify-end gap-2 pt-1.5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    handleCloseWebDownload();
                    navigate("/download");
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:text-white cursor-pointer"
                >
                  Details <ArrowRight size={11} />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadWebApk}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition-all hover:bg-blue-500 active:scale-95 cursor-pointer"
                >
                  <Download size={12} strokeWidth={2.5} />
                  Download APK
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
