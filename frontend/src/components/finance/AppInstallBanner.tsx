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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  checkForUpdate,
  AppUpdateNative,
  type UpdateCheckResult,
} from "@/lib/updater";

type UpdateState =
  | "idle"
  | "available"
  | "downloading"
  | "ready"
  | "needs_permission"
  | "error";

export function AppInstallBanner() {
  const location = useLocation();
  const navigate = useNavigate();

  // Web banner state
  const [isWebVisible, setIsWebVisible] = useState(false);

  // Native Android updater state
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [downloadPercent, setDownloadPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const isNativeAndroid =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

  const isCheckingRef = useRef(false);

  // =========================================================================
  // Native Android Update Flow
  // =========================================================================

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

    // Check on startup
    void performUpdateCheck();

    // Check when resuming from background
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
        // Automatically attempt installation once downloaded
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
  // Web / PWA Fallback Flow
  // =========================================================================

  const apkUrl =
    import.meta.env.VITE_ANDROID_APK_URL ||
    "https://pub-ec0e39289eae45ad9b4b896d31ed8d25.r2.dev/pasona.apk";
  const apkVersion = import.meta.env.VITE_ANDROID_APK_VERSION || "1.0";
  const apkSize = import.meta.env.VITE_ANDROID_APK_SIZE || "12 MB";

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    if (location.pathname === "/download") {
      setIsWebVisible(false);
      return;
    }

    const isDismissed = sessionStorage.getItem("pasona_hide_apk_prompt");
    if (!isDismissed) {
      const timer = setTimeout(() => setIsWebVisible(true), 2200);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleCloseWebBanner = () => {
    setIsWebVisible(false);
    sessionStorage.setItem("pasona_hide_apk_prompt", "true");
  };

  const handleDownloadWebApk = () => {
    handleCloseWebBanner();
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
  // Render: Native Android Updater
  // =========================================================================

  if (isNativeAndroid) {
    if (updateState === "idle") return null;

    return (
      <AnimatePresence>
        <motion.aside
          role="region"
          aria-label="Application Update"
          initial={{ y: -20, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="fixed top-3 left-3 right-3 sm:left-auto sm:right-5 sm:top-auto sm:bottom-5 sm:max-w-[390px] z-50"
        >
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/25 bg-[#0b132b]/98 p-4 shadow-2xl backdrop-blur-xl card-shadow text-white">
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-blue-500/20 blur-2xl" />

            {/* Header: Title and Dismiss */}
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-400">
                  {updateState === "ready" ? (
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  ) : updateState === "error" ? (
                    <AlertCircle size={20} className="text-rose-400" />
                  ) : updateState === "downloading" ? (
                    <RefreshCw size={19} className="animate-spin text-blue-400" />
                  ) : (
                    <Smartphone size={20} className="stroke-[2.2]" />
                  )}
                </div>

                <div className="space-y-0.5 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold tracking-tight text-white">
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
                    <span className="rounded-full bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-bold text-blue-300">
                      v{updateResult?.metadata?.latestVersionName}
                    </span>
                  </div>

                  <p className="text-[11px] leading-tight text-slate-300">
                    {updateState === "downloading"
                      ? `Downloading APK... ${downloadPercent}%`
                      : updateState === "ready"
                      ? "Download complete. Continue to install."
                      : updateState === "needs_permission"
                      ? "Allow install from unknown apps in Settings."
                      : updateState === "error"
                      ? errorMessage || "An unexpected error occurred."
                      : `Pasona ${updateResult?.metadata?.latestVersionName} is available.`}
                  </p>
                </div>
              </div>

              {!updateResult?.isForced && updateState !== "downloading" && (
                <button
                  type="button"
                  onClick={handleDismissUpdate}
                  className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
                  aria-label="Dismiss update"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Release notes if available and in prompt state */}
            {updateState === "available" && updateResult?.metadata?.releaseNotes && (
              <div className="relative z-10 mt-2.5 rounded-lg bg-white/5 p-2 text-[11px] text-slate-300 line-clamp-2 border border-white/5">
                {updateResult.metadata.releaseNotes}
              </div>
            )}

            {/* Progress bar during download */}
            {updateState === "downloading" && (
              <div className="relative z-10 mt-3 space-y-1.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-150"
                    style={{ width: `${downloadPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Downloading package</span>
                  <span>{downloadPercent}%</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="relative z-10 mt-3 flex items-center justify-end gap-2 pt-1 border-t border-white/5">
              {updateState === "available" && (
                <>
                  {!updateResult?.isForced && (
                    <button
                      type="button"
                      onClick={handleDismissUpdate}
                      className="px-2.5 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:text-white"
                    >
                      Later
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleStartDownload}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition-all hover:bg-blue-500 active:scale-95"
                  >
                    <Download size={13} strokeWidth={2.5} />
                    Update now
                  </button>
                </>
              )}

              {updateState === "ready" && (
                <button
                  type="button"
                  onClick={() => handleTriggerInstall()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 transition-all hover:bg-emerald-500 active:scale-95"
                >
                  <Download size={13} strokeWidth={2.5} />
                  Install update
                </button>
              )}

              {updateState === "needs_permission" && (
                <>
                  <button
                    type="button"
                    onClick={handleOpenSettings}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-amber-600/30 transition-all hover:bg-amber-500 active:scale-95"
                  >
                    <SettingsIcon size={13} />
                    Open Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerInstall()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-blue-500 active:scale-95"
                  >
                    Try Install
                  </button>
                </>
              )}

              {updateState === "error" && (
                <button
                  type="button"
                  onClick={handleStartDownload}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-blue-500 active:scale-95"
                >
                  <RefreshCw size={13} />
                  Retry
                </button>
              )}
            </div>
          </div>
        </motion.aside>
      </AnimatePresence>
    );
  }

  // =========================================================================
  // Render: Web / Desktop Visitor Banner
  // =========================================================================

  return (
    <AnimatePresence>
      {isWebVisible && (
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
                onClick={handleCloseWebBanner}
                className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
                aria-label="Dismiss download prompt"
              >
                <X size={15} />
              </button>
            </div>

            <div className="relative z-10 mt-3 flex items-center justify-end gap-2 pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  handleCloseWebBanner();
                  navigate("/download");
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:text-white"
              >
                Details <ArrowRight size={12} />
              </button>
              <button
                type="button"
                onClick={handleDownloadWebApk}
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
