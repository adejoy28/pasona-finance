import { api } from "./client";
import { setAuthToken, clearAuthToken } from "../auth/token";
import type {
  AuthResponse,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
  UserDto,
} from "./types";

export async function login(input: LoginInput): Promise<UserDto> {
  const data = await api.post<AuthResponse>("/login", input, { anonymous: true });
  setAuthToken(data.access_token);
  return data.user;
}

export async function register(input: RegisterInput): Promise<UserDto> {
  const data = await api.post<AuthResponse>("/register", input, { anonymous: true });
  setAuthToken(data.access_token);
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await api.post<{ message: string }>("/logout");
  } finally {
    clearAuthToken();
  }
}

export async function me(): Promise<UserDto> {
  return api.get<UserDto>("/me");
}

export async function requestPasswordReset(
  input: ForgotPasswordInput,
): Promise<{ message: string }> {
  return api.post<{ message: string }>("/forgot-password", input, { anonymous: true });
}

export async function resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
  return api.post<{ message: string }>("/reset-password", input, { anonymous: true });
}

/**
 * Re-send the "confirm your email" mail. Backed by
 * `POST /email/verification-notification` (Laravel's default route
 * from `Auth::routes(['verify' => true])`). Returns `{ status }` on
 * 202; we treat the body as opaque.
 */
export async function resendVerification(): Promise<{ status: string }> {
  return api.post<{ status: string }>("/email/verification-notification");
}

/**
 * PATCH the current user's profile. Used for `name` and `reminder_time`
 * today; extend `UpdateProfileInput` when adding more fields. Returns
 * the updated `UserDto` so callers can seed their React Query cache.
 */
export async function updateProfile(input: UpdateProfileInput): Promise<UserDto> {
  return api.patch<UserDto>("/me", input);
}

/**
 * Soft-delete the authenticated user's account and all associated data.
 * Requires confirmation — no undo. Clears the stored token on success.
 */
export async function deleteAccount(): Promise<void> {
  try {
    await api.delete<{ message: string }>("/me");
  } finally {
    clearAuthToken();
  }
}

/**
 * Check whether an email is already registered.
 *
 * Backed by `GET /auth/check-email?email=...`, which is expected to
 * return `{ available: boolean }` (`available: true` means the email is
 * NOT taken). If the endpoint is unavailable (404, network, 5xx) we
 * fail open and return `exists: false` so we don't block registration
 * with a misleading "email is taken" hint.
 */
export async function checkEmail(email: string): Promise<{ exists: boolean }> {
  try {
    const data = await api.get<{ available?: boolean }>("/auth/check-email", {
      query: { email },
      anonymous: true,
    });
    const available = data?.available ?? true;
    return { exists: !available };
  } catch {
    return { exists: false };
  }
}
