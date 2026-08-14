// Thin fetch wrapper around the PHP backend.
//
// Responsibilities:
//   - Build absolute URLs from `env.apiBaseUrl` + a path.
//   - Attach standard JSON headers + Bearer auth from token storage.
//   - Parse JSON responses; throw a typed `ApiError` on non-2xx.
//   - On 401, clear the stored token and invoke `onUnauthorized` so the
//     app can route the user back to /login.

import { env } from "../env";
import { clearAuthToken, getAuthToken } from "../auth/token";

const DEFAULT_TIMEOUT_MS = 20_000;
export const API_ERROR_USER_MESSAGE =
  "Something went wrong talking to the server. Please try again.";

export type ApiErrorKind = "network" | "timeout" | "abort" | "http" | "parse" | "unknown";

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly payload: unknown;
  readonly requiresVerifiedEmail: boolean;
  readonly #url: string;

  constructor(params: {
    message: string;
    status: number;
    kind: ApiErrorKind;
    payload?: unknown;
    url: string;
    requiresVerifiedEmail?: boolean;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.kind = params.kind;
    this.payload = params.payload;
    this.requiresVerifiedEmail = params.requiresVerifiedEmail ?? false;
    this.#url = params.url;
  }

  getDebugUrl(): string {
    return this.#url;
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  anonymous?: boolean;
};

let unauthorizedHandler: (() => void) | null = null;

export function onUnauthorized(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const base = env.apiBaseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  let url = `${base}${normalizedPath}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }
  return url;
}

function buildHeaders(options: RequestOptions, body: unknown): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };
  if (body !== undefined && body !== null && !headers["Content-Type"]) {
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      // Let browser set Content-Type with boundary
    } else {
      headers["Content-Type"] = "application/json";
    }
  }
  if (!options.anonymous) {
    const token = getAuthToken();
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function extractMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
    if (record.errors && typeof record.errors === "object") {
      const first = Object.values(record.errors as Record<string, unknown[]>)[0];
      if (Array.isArray(first) && typeof first[0] === "string") {
        return first[0];
      }
    }
  }
  return fallback;
}

function isRequiresVerifiedEmailPayload(status: number, payload: unknown): boolean {
  if (status !== 403) return false;
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  return record.requires_verified_email === true;
}

function combineSignals(
  external: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onExternal = () => controller.abort();
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener("abort", onExternal, { once: true });
  }
  return {
    signal: controller.signal,
    cancel: () => {
      clearTimeout(timer);
      if (external) external.removeEventListener("abort", onExternal);
    },
  };
}

export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, signal, timeoutMs } = options;
  const url = buildUrl(path, query);
  const hasBody = body !== undefined && body !== null;
  const headers = buildHeaders(options, body);
  const { signal: combinedSignal, cancel } = combineSignals(
    signal,
    timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  let response: Response;
  try {
    let serializedBody: BodyInit | undefined;
    if (hasBody) {
      if (typeof FormData !== "undefined" && body instanceof FormData) {
        serializedBody = body;
      } else {
        serializedBody = JSON.stringify(body);
      }
    }
    response = await fetch(url, {
      method,
      headers,
      body: serializedBody,
      signal: combinedSignal,
      credentials: "omit",
    });
  } catch (cause) {
    cancel();
    const aborted = combinedSignal.aborted;
    const isTimeout = !signal?.aborted && aborted;
    const kind: ApiErrorKind = aborted ? (isTimeout ? "timeout" : "abort") : "network";
    const apiError = new ApiError({
      message: API_ERROR_USER_MESSAGE,
      status: 0,
      kind,
      url,
    });
    if (env.isDevelopment) {
      console.error(`[api] ${method} ${url} failed (${kind})`, cause);
    } else {
      console.error(`[api] request failed (${kind})`, cause);
    }
    throw apiError;
  }
  cancel();

  const payload = await parseBody(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
      try {
        unauthorizedHandler?.();
      } catch (handlerError) {
        console.error("[api] unauthorized handler threw", handlerError);
      }
    }
    const requiresVerifiedEmail = isRequiresVerifiedEmailPayload(response.status, payload);
    const message = extractMessage(payload, API_ERROR_USER_MESSAGE);
    if (env.isDevelopment) {
      console.error(`[api] ${method} ${url} -> ${response.status}`, payload ?? response.statusText);
    } else {
      console.error(`[api] ${method} -> ${response.status}`);
    }
    throw new ApiError({
      message,
      status: response.status,
      kind: "http",
      payload,
      url,
      requiresVerifiedEmail,
    });
  }

  return payload as T;
}

export const api = {
  get: <T = unknown>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => request<T>(path, { ...options, method: "POST", body }),
  put: <T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => request<T>(path, { ...options, method: "PUT", body }),
  patch: <T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => request<T>(path, { ...options, method: "DELETE", body }),
};
