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
import { setAuthToken } from "./token";

type GoogleStartResponse = { url: string };

/**
 * Start the Google OAuth flow.
 *
 * Throws an `Error` with a user-facing message on any failure (network,
 * non-2xx, or a response that doesn't carry a `url` string) so the
 * caller can surface it in the UI.
 */
export async function startGoogleLogin(): Promise<void> {
  let response: GoogleStartResponse;
  try {
    response = await api.get<GoogleStartResponse>("/auth/google", { anonymous: true });
  } catch (err) {
    // `ApiError.message` is already user-facing (the API client
    // sanitizes the backend's message). Anything else is a network /
    // parse failure — fall back to a generic message.
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
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState(null, "", cleanUrl);
  }

  return { ok: true };
}

function humanizeError(code: string): string {
  // Backend-supplied error codes from Socialite are usually
  // `access_denied`, `invalid_request`, etc. Surface the raw value but
  // with a friendlier prefix so the UI doesn't look bare.
  switch (code) {
    case "access_denied":
      return "Google sign-in was cancelled.";
    case "invalid_request":
      return "Google sign-in was rejected. Please try again.";
    default:
      return `Google sign-in failed (${code}). Please try again.`;
  }
}
