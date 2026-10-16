/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_BACKEND_ORIGIN: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_ANDROID_APK_URL?: string;
  readonly VITE_ANDROID_APK_VERSION?: string;
  readonly VITE_ANDROID_APK_SIZE?: string;
  readonly VITE_ANDROID_APK_METADATA_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
