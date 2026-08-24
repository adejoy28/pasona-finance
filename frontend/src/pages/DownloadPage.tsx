import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Share, PlusSquare, Download, ShieldCheck, DownloadCloud } from "lucide-react";

export function DownloadPage() {
  const navigate = useNavigate();

  const [metadata, setMetadata] = useState<{
    version?: string;
    size?: string;
    whatsNew?: string;
  } | null>(null);

  useEffect(() => {
    const metaUrl = import.meta.env.VITE_ANDROID_APK_METADATA_URL;
    if (metaUrl) {
      console.log("[download] Firing metadata fetch via proxy for:", metaUrl);
      const proxyUrl = `${import.meta.env.VITE_API_BASE_URL}/download/metadata?url=${encodeURIComponent(metaUrl)}&t=${Date.now()}`;
      fetch(proxyUrl)
        .then((res) => {
          if (!res.ok) throw new Error("Metadata fetch failed with status " + res.status);
          return res.json();
        })
        .then((data) => {
          console.log("[download] Metadata successfully fetched:", data);
          setMetadata(data);
        })
        .catch((err) => console.error("[download] Failed to fetch metadata", err));
    } else {
      console.log("[download] No VITE_ANDROID_APK_METADATA_URL defined in environment.");
    }
  }, []);

  // Basic OS detection
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
  const isAndroid = /android/i.test(ua);
  const isDesktop = !isIOS && !isAndroid;

  return (
    <div className="min-h-[100dvh] bg-[#030712] font-sans text-white p-6 sm:p-12 overflow-y-auto pb-20">
      <div className="max-w-3xl mx-auto space-y-12">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[#8c93b0] hover:text-white transition-colors text-sm font-semibold"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-display font-medium text-white tracking-[-0.02em]">
            Get the Pasona app
          </h1>
          <p className="text-[#8c93b0] text-sm leading-relaxed max-w-xl">
            Pasona is distributed directly to ensure maximum privacy and instant updates.
            Install the app natively on your device outside the App Store or Play Store.
          </p>
        </div>

        <div className={`grid grid-cols-1 ${isDesktop ? 'md:grid-cols-2' : ''} gap-8`}>
          {/* iOS / PWA Instructions */}
          {(isIOS || isDesktop) && (
          <div className="bg-[#0a1b39]/40 border border-[#3b82f6]/10 rounded-2xl p-6 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Share size={120} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">iPhone & iPad</h2>
              <p className="text-xs text-[#8c93b0]">Install directly from Safari</p>
            </div>
            
            <ul className="space-y-6 relative z-10">
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div className="space-y-1 mt-1">
                  <p className="text-sm font-medium">Tap the Share button</p>
                  <p className="text-xs text-[#8c93b0]">At the bottom of Safari, tap the share icon <Share size={12} className="inline mx-1" />.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div className="space-y-1 mt-1">
                  <p className="text-sm font-medium">Add to Home Screen</p>
                  <p className="text-xs text-[#8c93b0]">Scroll down the list and tap "Add to Home Screen" <PlusSquare size={12} className="inline mx-1" />.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="space-y-1 mt-1">
                  <p className="text-sm font-medium">Launch Pasona</p>
                  <p className="text-xs text-[#8c93b0]">Open the app from your home screen for the full, offline experience.</p>
                </div>
              </li>
            </ul>
          </div>
          )}

          {/* Android / APK Instructions */}
          {(isAndroid || isDesktop) && (
          <div className="bg-[#0a1b39]/40 border border-[#3b82f6]/10 rounded-2xl p-6 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <DownloadCloud size={120} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">Android</h2>
              <p className="text-xs text-[#8c93b0]">Download the official APK</p>
            </div>

            <div className="relative z-10">
              {import.meta.env.VITE_ANDROID_APK_URL ? (
                <>
                  <a 
                    href={import.meta.env.VITE_ANDROID_APK_URL} 
                    className="inline-flex items-center justify-center w-full gap-2 py-3 rounded-xl font-bold text-white text-sm bg-[#3b82f6] hover:bg-[#2563eb] transition-colors"
                  >
                    <Download size={18} />
                    Download .apk
                  </a>
                  <p className="text-[10px] text-center text-[#8c93b0] mt-2">
                    {(metadata?.version || import.meta.env.VITE_ANDROID_APK_VERSION) ? `v${metadata?.version || import.meta.env.VITE_ANDROID_APK_VERSION} • ` : ''}
                    {(metadata?.size || import.meta.env.VITE_ANDROID_APK_SIZE) ? `~${metadata?.size || import.meta.env.VITE_ANDROID_APK_SIZE} • ` : ''}
                    Verified Safe
                  </p>
                  
                  {metadata?.whatsNew && (
                    <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-xs font-semibold text-white mb-1">What's new</p>
                      <p className="text-[11px] text-[#8c93b0] leading-relaxed whitespace-pre-wrap">
                        {metadata.whatsNew}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <a 
                    href="#" 
                    className="inline-flex items-center justify-center w-full gap-2 py-3 rounded-xl font-bold text-white text-sm bg-[#3b82f6] hover:bg-[#2563eb] transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Download link is currently a placeholder.");
                    }}
                  >
                    <Download size={18} />
                    Download .apk
                  </a>
                  <p className="text-[10px] text-center text-[#8c93b0] mt-2">v1.0.0 • ~12MB • Verified Safe</p>
                </>
              )}
            </div>

            <ul className="space-y-6 relative z-10 pt-2">
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 text-white/60 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div className="space-y-1 mt-1">
                  <p className="text-sm font-medium">Download the file</p>
                  <p className="text-xs text-[#8c93b0]">Tap the download button above. If Chrome warns you about the file type, choose "Download anyway".</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 text-white/60 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div className="space-y-1 mt-1">
                  <p className="text-sm font-medium">Allow Installation</p>
                  <p className="text-xs text-[#8c93b0]">Open the downloaded file. If prompted, toggle "Allow from this source" in your settings.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 text-white/60 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="space-y-1 mt-1">
                  <p className="text-sm font-medium">Install & Open</p>
                  <p className="text-xs text-[#8c93b0]">Tap install to finish. You can now use biometric sign-in and offline tracking.</p>
                </div>
              </li>
            </ul>
          </div>
          )}
        </div>

        <div className="bg-[#0b1329]/50 border border-white/[0.04] rounded-xl p-4 flex items-start gap-4">
          <ShieldCheck size={24} className="text-emerald-500 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-white">Why manual install?</h4>
            <p className="text-xs text-[#8c93b0] mt-1 leading-relaxed">
              Direct distribution means no tracking from third-party app stores, faster updates, 
              and complete data privacy. Our Android APK is digitally signed and verified safe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
