import { useEffect, useState } from "react";
import { auth as authApi } from "@/lib/api";

const DEBOUNCE_MS = 500;

/**
 * Debounced email-availability check for the auth screens.
 *
 * Returns one of:
 *   - `{ checking: true }` while the request is in flight
 *   - `{ exists: true }`   when the email is already registered
 *   - `{ exists: false }`  when the email is free
 *   - `{ exists: null }`   when we have no signal yet (no input, or the
 *     request failed and we'd rather stay silent than mislead)
 *
 * The hook is intentionally tolerant: any network/parse failure (or a
 * 404 from a not-yet-deployed `/auth/check-email` endpoint) returns
 * `exists: null` so we don't paint a misleading "email is taken" hint
 * over the form.
 */
export function useEmailCheck(email: string): {
  exists: boolean | null;
  checking: boolean;
} {
  const [exists, setExists] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const trimmed = email.trim();
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!looksLikeEmail) {
      setExists(null);
      setChecking(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      // Only set checking=true once the debounce actually fires — avoids
      // cascading re-renders on every single keystroke (keyboard-paint freeze).
      setChecking(true);
      try {
        const result = await authApi.checkEmail(trimmed);
        if (controller.signal.aborted) return;
        setExists(result.exists);
      } catch {
        if (controller.signal.aborted) return;
        setExists(null);
      } finally {
        if (!controller.signal.aborted) {
          setChecking(false);
        }
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [email]);

  return { exists, checking };
}
