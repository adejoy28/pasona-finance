let _token: string | null = null;

export const HAS_LOGGED_IN_KEY = "pasona.has_previously_logged_in";

export function setAuthToken(token: string): void {
  _token = token;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("auth_token", token);
      window.localStorage.setItem("last_activity", Date.now().toString());
      window.localStorage.setItem(HAS_LOGGED_IN_KEY, "1");
    }
  } catch {
    // localStorage may be unavailable (privacy mode, quota). Best-effort.
  }
}

export function hasPreviouslyLoggedIn(): boolean {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(HAS_LOGGED_IN_KEY) === "1";
  } catch {
    return false;
  }
}

export function getAuthToken(): string | null {
  if (_token) return _token;
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }
  try {
    _token = window.localStorage.getItem("auth_token");
  } catch {
    _token = null;
  }
  return _token;
}

export function clearAuthToken(): void {
  _token = null;
  try {
    window.sessionStorage.removeItem("auth_token");
  } catch {
    // ignore
  }
  try {
    window.localStorage.removeItem("auth_token");
  } catch {
    // ignore
  }
}
