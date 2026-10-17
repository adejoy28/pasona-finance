// Tiny sessionStorage helper for passing an email between the register
// and login screens. The flow is:
//   1. User types an email on /register, our debounced check finds it
//      already exists, and we show "Sign in instead" — which routes to
//      /login with the email pre-filled.
//   2. User types an email on /login that DOESN'T exist, we show
//      "Register instead" — which routes to /register with the email
//      pre-filled.
// We use `sessionStorage` (not `localStorage`) so the handoff lives
// only for the current tab session and never lingers across restarts.

const PENDING_EMAIL_KEY = "pasona.pending.email";

export function handOffEmail(email: string): void {
  if (typeof sessionStorage === "undefined") return;
  const trimmed = email.trim();
  if (!trimmed) return;
  try {
    sessionStorage.setItem(PENDING_EMAIL_KEY, trimmed);
  } catch {
    // Sessionstorage may be unavailable (privacy mode, quota) — best effort.
  }
}

export function consumePendingEmail(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const value = sessionStorage.getItem(PENDING_EMAIL_KEY);
    if (value) sessionStorage.removeItem(PENDING_EMAIL_KEY);
    return value;
  } catch {
    return null;
  }
}
