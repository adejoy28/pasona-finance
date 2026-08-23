let _token: string | null = null;

export function setAuthToken(token: string): void {
  _token = token;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("auth_token", token);
      window.localStorage.setItem("last_activity", Date.now().toString());
    }
  } catch {
    // localStorage may be unavailable (privacy mode, quota). Best-effort.
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
