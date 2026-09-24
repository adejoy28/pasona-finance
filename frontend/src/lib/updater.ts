import { Capacitor, registerPlugin } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { env } from "./env";

export interface AppUpdateMetadata {
  latestVersionCode: number;
  latestVersionName: string;
  downloadUrl: string;
  releaseNotes: string;
  minimumVersionCode?: number;
  forceUpdate?: boolean;
}

export interface AppInfo {
  versionCode: number;
  versionName: string;
  packageName: string;
}

export interface DownloadProgress {
  percent: number;
  bytesRead: number;
  totalBytes: number;
}

export interface AppUpdateNativePlugin {
  getAppInfo(): Promise<AppInfo>;
  canRequestPackageInstalls(): Promise<{ canInstall: boolean }>;
  openInstallPermissionSettings(): Promise<void>;
  downloadApk(options: { url: string; versionCode: number }): Promise<{ success: boolean; filePath: string; fileSize: number }>;
  installApk(options: { versionCode: number }): Promise<{ success: boolean; needsPermission?: boolean }>;
  addListener(
    eventName: "downloadProgress",
    listenerFunc: (progress: DownloadProgress) => void
  ): Promise<PluginListenerHandle>;
}

export const AppUpdateNative = registerPlugin<AppUpdateNativePlugin>("AppUpdate");

export interface UpdateCheckResult {
  hasUpdate: boolean;
  isForced: boolean;
  installedVersionCode: number;
  installedVersionName: string;
  metadata?: AppUpdateMetadata;
}

export async function fetchUpdateMetadata(): Promise<AppUpdateMetadata | null> {
  try {
    const metaUrl = `${env.apiBaseUrl}/download/metadata?t=${Date.now()}`;
    const res = await fetch(metaUrl);
    if (!res.ok) {
      console.warn("[updater] Metadata endpoint returned status:", res.status);
      return null;
    }
    const data = await res.json();
    if (!data || typeof data.latestVersionCode !== "number") {
      console.warn("[updater] Invalid metadata response structure:", data);
      return null;
    }
    return {
      latestVersionCode: data.latestVersionCode,
      latestVersionName: data.latestVersionName || "1.0.0",
      downloadUrl: data.downloadUrl,
      releaseNotes: data.releaseNotes || data.whatsNew || "",
      minimumVersionCode: data.minimumVersionCode ?? 0,
      forceUpdate: Boolean(data.forceUpdate),
    };
  } catch (err) {
    console.warn("[updater] Failed to fetch update metadata:", err);
    return null;
  }
}

export async function checkForUpdate(): Promise<UpdateCheckResult> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    return {
      hasUpdate: false,
      isForced: false,
      installedVersionCode: 0,
      installedVersionName: "",
    };
  }

  try {
    const appInfo = await AppUpdateNative.getAppInfo();
    const metadata = await fetchUpdateMetadata();

    if (!metadata) {
      return {
        hasUpdate: false,
        isForced: false,
        installedVersionCode: appInfo.versionCode,
        installedVersionName: appInfo.versionName,
      };
    }

    const hasUpdate = appInfo.versionCode < metadata.latestVersionCode;
    const isForced = Boolean(
      metadata.forceUpdate ||
      (metadata.minimumVersionCode && appInfo.versionCode < metadata.minimumVersionCode)
    );

    return {
      hasUpdate,
      isForced,
      installedVersionCode: appInfo.versionCode,
      installedVersionName: appInfo.versionName,
      metadata,
    };
  } catch (err) {
    console.error("[updater] Error checking for update:", err);
    return {
      hasUpdate: false,
      isForced: false,
      installedVersionCode: 0,
      installedVersionName: "",
    };
  }
}
