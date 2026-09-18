// Google OAuth helper.
//
// Flow:
//   1. `startGoogleLogin()` does GET /auth/google via the standard API
//      client. The backend (configured to be JSON-only) responds with
//      `{ url: "https://accounts.google.com/..." }` instead of issuing
//      a 302 redirect. We then navigate the browser to that URL — the
//      user lands on Google's consent screen.
//   2. Google redirects to the backend's /auth/google/callback, which
//      finally redirects to the frontend (e.g. /login?token=...&user=...
//      or ?error=...). `completeGoogleCallback` parses that final hop,
//      stores the token, and strips it from the address bar.

import { ApiError, api } from "../api";

/** Thrown when the user explicitly cancels the Google sign-in popup. */
export class GoogleSignInCancelledError extends Error {
  constructor() {
    super("Google sign-in was cancelled.");
    this.name = "GoogleSignInCancelledError";
  }
}
import { setAuthToken } from "./token";

type GoogleStartResponse = { url: string };

import { Capacitor } from '@capacitor/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';

export async function startGoogleLogin(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await GoogleSignIn.signIn();
      if (!result.idToken) {
        throw new Error("No ID token returned from Google.");
      }
      
      const response = await api.post<{ token: string, user: any }>(
        '/auth/google/mobile',
        { idToken: result.idToken },
        { anonymous: true }
      );

      setAuthToken(response.token);
      return;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      // Capacitor plugin signals cancellation via the SIGN_IN_CANCELED code.
      const code = (err as any)?.code ?? (err as any)?.message ?? "";
      if (String(code).includes("SIGN_IN_CANCELED") || String(code).includes("cancelled") || String(code).includes("canceled")) {
        throw new GoogleSignInCancelledError();
      }
      throw new Error("Unable to sign in with Google on device. Please try again.");
    }
  }

  // Web fallback (existing flow)
  let response: GoogleStartResponse;
  try {
    response = await api.get<GoogleStartResponse>("/auth/google", { anonymous: true });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new Error("Unable to start Google sign-in. Please try again.");
  }
  if (typeof response?.url !== "string" || !response.url) {
    throw new Error("Google sign-in is unavailable right now. Please try again.");
  }
  window.location.assign(response.url);
}

export type GoogleCallbackResult = { ok: true } | { ok: false; error: string };

/**
 * Read the token (or error) the backend appended to the callback URL,
 * store it, and strip it from the address bar. Call this once from the
 * `/auth/callback` route's effect.
 */
export function completeGoogleCallback(
  search: string,
  options: { replaceHistory?: boolean } = {},
): GoogleCallbackResult {
  const params = new URLSearchParams(search);
  const error = params.get("error");
  if (error) {
    return { ok: false, error: humanizeError(error) };
  }

  const token = params.get("token") || params.get("access_token");
  if (!token) {
    return {
      ok: false,
      error: "Google did not return a session token. Please try again.",
    };
  }

  setAuthToken(token);

  if (options.replaceHistory !== false && typeof window !== "undefined") {
    // Drop the token from the address bar so a refresh doesn't replay the
    // callback, and so the token isn't leaked via the browser history /
    // referer headers.
    const cleanUrl = window.location.pathname;
    window.history.replaceState(null, "", cleanUrl);
  }

  return { ok: true };
}

export function humanizeError(code: string): string {
  if (!code || code === "access_denied" || code.toLowerCase().includes("cancel")) {
    return "Google sign-in was cancelled.";
  }
  if (code === "invalid_request") {
    return "Google sign-in was rejected. Please try again.";
  }
  if (code.toLowerCase().includes("fail") || code.toLowerCase().includes("please try again")) {
    return code;
  }
  return `Google sign-in failed (${code}). Please try again.`;
}
