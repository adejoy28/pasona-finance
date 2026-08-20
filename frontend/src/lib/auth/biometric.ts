// Native biometric sign-in backed by Capacitor plugins.
//
// On native platforms this uses:
//   - @aparajita/capacitor-biometric-auth for the biometric prompt + hardware
//     checks (fingerprint / face / iris / device credential).
//   - @aparajita/capacitor-secure-storage (Android Keystore-backed) to hold the
//     saved email + auth token so a biometric prompt can unlock the sign-in.
//     We store the token rather than a password so both email/password and
//     Google OAuth accounts (which have no password) can enable biometrics.
//
// On the web there is no hardware biometry we can rely on, so every function
// reports "unavailable" / returns null. This keeps the PWA behavior unchanged
// while the native app gets real Touch ID / Fingerprint support.

import { Capacitor } from "@capacitor/core";
import {
  BiometricAuth,
  BiometryError,
  BiometryErrorType,
  BiometryType,
} from "@aparajita/capacitor-biometric-auth";
import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import { checkEmail as apiCheckEmail } from "@/lib/api/auth";

export interface BiometricAvailability {
  available: boolean;
  biometryType: "fingerprint" | "face" | "iris" | "none" | null;
}

const isNative = () => Capacitor.isNativePlatform();

// Storage key for the saved credentials. Kept in Android Keystore-backed
// EncryptedSharedPreferences via @aparajita/capacitor-secure-storage.
const CREDENTIALS_KEY = "pasona.biometric.credentials";

function mapBiometryType(type: BiometryType): "fingerprint" | "face" | "iris" | "none" | null {
  switch (type) {
    case BiometryType.touchId:
    case BiometryType.fingerprintAuthentication:
      return "fingerprint";
    case BiometryType.faceId:
    case BiometryType.faceAuthentication:
      return "face";
    case BiometryType.irisAuthentication:
      return "iris";
    case BiometryType.none:
      return "none";
    default:
      return null;
  }
}

export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  if (!isNative()) {
    return { available: false, biometryType: null };
  }
  try {
    const result = await BiometricAuth.checkBiometry();
    return {
      available: result.isAvailable,
      biometryType: mapBiometryType(result.biometryType),
    };
  } catch {
    return { available: false, biometryType: null };
  }
}

export async function verifyBiometricIdentity(): Promise<boolean> {
  if (!isNative()) {
    return false;
  }
  try {
    await BiometricAuth.authenticate({
      reason: "Verify your identity to continue",
      cancelTitle: "Cancel",
      allowDeviceCredential: true,
      androidTitle: "Verify your identity",
      androidSubtitle: "Use your fingerprint, face, or device PIN to continue",
    });
    return true;
  } catch (err) {
    // A user-initiated cancel shouldn't count as a failure.
    if (err instanceof BiometryError && err.code === BiometryErrorType.userCancel) {
      return false;
    }
    return false;
  }
}

export interface BiometricCredentials {
  email: string;
  token: string;
}

export async function saveBiometricCredentials(_email: string, _token: string): Promise<boolean> {
  if (!isNative()) {
    return false;
  }
  try {
    const payload: Record<string, unknown> = { email: _email, token: _token };
    await SecureStorage.set(CREDENTIALS_KEY, payload);
    return true;
  } catch {
    return false;
  }
}

export async function getBiometricCredentials(): Promise<BiometricCredentials | null> {
  if (!isNative()) {
    return null;
  }
  try {
    const stored = await SecureStorage.get(CREDENTIALS_KEY);
    if (!stored || typeof stored !== "object") return null;
    const record = stored as Record<string, unknown>;
    if (typeof record.email !== "string" || typeof record.token !== "string") {
      return null;
    }
    return { email: record.email, token: record.token };
  } catch {
    return null;
  }
}

export async function deleteBiometricCredentials(): Promise<boolean> {
  if (!isNative()) {
    return false;
  }
  try {
    return await SecureStorage.remove(CREDENTIALS_KEY);
  } catch {
    return false;
  }
}

export async function hasBiometricCredentials(): Promise<boolean> {
  if (!isNative()) {
    return false;
  }
  try {
    return (await SecureStorage.get(CREDENTIALS_KEY)) !== null;
  } catch {
    return false;
  }
}

export async function checkEmailActive(email: string): Promise<boolean> {
  try {
    const result = await apiCheckEmail(email);
    return result.exists;
  } catch {
    return true;
  }
}
