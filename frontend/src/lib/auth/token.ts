let _token: string | null = null;

export function setAuthToken(token: string): void {
  _token = token;
  try {
    window.sessionStorage.setItem("auth_token", token);
  } catch {
    // sessionStorage may be unavailable (privacy mode, quota). Best-effort.
  }
}

export function getAuthToken(): string | null {
  if (_token) return _token;
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
    return null;
  }
  try {
    _token = window.sessionStorage.getItem("auth_token");
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
