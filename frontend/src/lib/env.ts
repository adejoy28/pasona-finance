// Centralized, typed access to VITE_* environment variables.
//
// Vite inlines `import.meta.env.VITE_*` at build time, so the value baked
// into the bundle reflects the mode that was built (dev / production /
// staging). Never read `import.meta.env` directly elsewhere — import from
// here so types stay correct and we have a single place to add validation.

const DEV_PROXY_API_BASE = "/api";
const DEV_PROXY_BACKEND_ORIGIN = "http://localhost:8000";

function normalizeBaseUrl(value: string | undefined): string {
  const raw = (value ?? "").trim() || DEV_PROXY_API_BASE;
  return raw.replace(/\/+$/, "");
}

function normalizeOrigin(value: string | undefined): string {
  const raw = (value ?? "").trim() || DEV_PROXY_BACKEND_ORIGIN;
  return raw.replace(/\/+$/, "");
}

export const isCapacitor =
  typeof navigator !== "undefined" && navigator.userAgent.includes("Capacitor");

export const env = {
  apiBaseUrl: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
  backendOrigin: normalizeOrigin(import.meta.env.VITE_BACKEND_ORIGIN),
  appName: (import.meta.env.VITE_APP_NAME ?? "Pasona").trim() || "Pasona",
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
} as const;

export type Env = typeof env;
