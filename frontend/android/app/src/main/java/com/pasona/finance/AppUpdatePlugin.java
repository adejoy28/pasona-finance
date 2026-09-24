package com.pasona.finance;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import androidx.core.content.pm.PackageInfoCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void getAppInfo(PluginCall call) {
        try {
            Context ctx = getContext();
            PackageInfo pInfo = ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0);
            long versionCode = PackageInfoCompat.getLongVersionCode(pInfo);
            String versionName = pInfo.versionName != null ? pInfo.versionName : "";

            JSObject ret = new JSObject();
            ret.put("versionCode", versionCode);
            ret.put("versionName", versionName);
            ret.put("packageName", ctx.getPackageName());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to retrieve app info: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void canRequestPackageInstalls(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            boolean canInstall = getContext().getPackageManager().canRequestPackageInstalls();
            ret.put("canInstall", canInstall);
        } else {
            ret.put("canInstall", true);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                call.resolve();
            } else {
                call.resolve();
            }
        } catch (Exception e) {
            call.reject("Failed to open unknown app sources settings: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void downloadApk(PluginCall call) {
        String downloadUrl = call.getString("url");
        Long versionCode = call.getLong("versionCode");

        if (downloadUrl == null || downloadUrl.trim().isEmpty()) {
            call.reject("downloadUrl is required");
            return;
        }

        if (!downloadUrl.startsWith("https://")) {
            call.reject("Insecure or invalid URL: downloadUrl must use HTTPS");
            return;
        }

        if (versionCode == null || versionCode <= 0) {
            call.reject("Valid versionCode is required");
            return;
        }

        executor.execute(() -> {
            File updatesDir = new File(getContext().getCacheDir(), "updates");
            if (!updatesDir.exists() && !updatesDir.mkdirs()) {
                call.reject("Failed to create updates directory in cache");
                return;
            }

            File targetApk = new File(updatesDir, "update_" + versionCode + ".apk");
            File tempApk = new File(updatesDir, "update_" + versionCode + ".apk.tmp");

            // Clean up any older temporary downloads
            cleanOldFiles(updatesDir, versionCode);

            HttpURLConnection conn = null;
            InputStream in = null;
            FileOutputStream out = null;

            try {
                URL url = new URL(downloadUrl);
                conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(30000);
                conn.setInstanceFollowRedirects(true);
                conn.connect();

                int responseCode = conn.getResponseCode();
                if (responseCode < 200 || responseCode >= 300) {
                    throw new Exception("HTTP error during download: status " + responseCode);
                }

                long totalBytes = conn.getContentLengthLong();
                in = conn.getInputStream();
                out = new FileOutputStream(tempApk);

                byte[] buffer = new byte[8192];
                long totalRead = 0;
                int read;
                int lastReportedPercent = -1;
                long lastReportTime = 0;

                while ((read = in.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
                    totalRead += read;

                    int percent = totalBytes > 0 ? (int) ((totalRead * 100) / totalBytes) : -1;
                    long now = System.currentTimeMillis();

                    // Throttle notification updates (at most every 150ms or on percent change)
                    if (percent != lastReportedPercent || (now - lastReportTime > 150)) {
                        lastReportedPercent = percent;
                        lastReportTime = now;

                        JSObject progressObj = new JSObject();
                        progressObj.put("percent", percent);
                        progressObj.put("bytesRead", totalRead);
                        progressObj.put("totalBytes", totalBytes);
                        notifyListeners("downloadProgress", progressObj);
                    }
                }

                out.flush();
                out.close();
                out = null;

                if (tempApk.length() == 0) {
                    throw new Exception("Downloaded APK is empty");
                }

                if (targetApk.exists() && !targetApk.delete()) {
                    throw new Exception("Failed to clear previous target APK file");
                }

                if (!tempApk.renameTo(targetApk)) {
                    throw new Exception("Failed to finalize downloaded APK");
                }

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("filePath", targetApk.getAbsolutePath());
                ret.put("fileSize", targetApk.length());
                call.resolve(ret);

            } catch (Exception e) {
                if (tempApk.exists()) {
                    // Clean up partial download
                    //noinspection ResultOfMethodCallIgnored
                    tempApk.delete();
                }
                call.reject("Download failed: " + e.getMessage(), e);
            } finally {
                try {
                    if (in != null) in.close();
                } catch (Exception ignored) {}
                try {
                    if (out != null) out.close();
                } catch (Exception ignored) {}
                if (conn != null) conn.disconnect();
            }
        });
    }

    @PluginMethod
    public void installApk(PluginCall call) {
        Long versionCode = call.getLong("versionCode");
        if (versionCode == null || versionCode <= 0) {
            call.reject("Valid versionCode is required");
            return;
        }

        File updatesDir = new File(getContext().getCacheDir(), "updates");
        File targetApk = new File(updatesDir, "update_" + versionCode + ".apk");

        if (!targetApk.exists() || targetApk.length() == 0) {
            call.reject("APK file does not exist or is empty. Please download again.");
            return;
        }

        try {
            Context ctx = getContext();

            // Check if permission to install unknown apps is granted on Android 8+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!ctx.getPackageManager().canRequestPackageInstalls()) {
                    JSObject ret = new JSObject();
                    ret.put("success", false);
                    ret.put("needsPermission", true);
                    call.resolve(ret);
                    return;
                }
            }

            Uri apkUri = FileProvider.getUriForFile(
                ctx,
                ctx.getPackageName() + ".fileprovider",
                targetApk
            );

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            ctx.startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to trigger installer: " + e.getMessage(), e);
        }
    }

    private void cleanOldFiles(File dir, long currentVersionCode) {
        try {
            File[] files = dir.listFiles();
            if (files == null) return;
            for (File file : files) {
                String name = file.getName();
                if (name.endsWith(".tmp") || (!name.equals("update_" + currentVersionCode + ".apk") && name.endsWith(".apk"))) {
                    //noinspection ResultOfMethodCallIgnored
                    file.delete();
                }
            }
        } catch (Exception ignored) {}
    }
}
