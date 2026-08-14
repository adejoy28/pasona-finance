import { Link, useNavigate } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Fingerprint, Lock, Mail, UserPlus, Eye, EyeOff, Check } from "lucide-react";
import {
  AuthShell,
  authButtonClass,
  authInputClass,
  authLabelClass,
} from "@/components/finance/AuthShell";
import { GoogleButton } from "@/components/finance/GoogleButton";
import { ApiError, auth as authApi } from "@/lib/api";
import { completeGoogleCallback } from "@/lib/auth/google";
import { consumePendingEmail, handOffEmail } from "@/lib/auth/email-handoff";
import { useEmailCheck } from "@/hooks/use-email-check";
import {
  checkBiometricAvailability,
  verifyBiometricIdentity,
  getBiometricCredentials,
  saveBiometricCredentials,
  deleteBiometricCredentials,
} from "@/lib/auth/biometric";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => consumePendingEmail() ?? "");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { exists: emailExists } = useEmailCheck(email);
  const [emailTouched, setEmailTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<
    "fingerprint" | "face" | "iris" | "none" | null
  >(null);
  const [hasBiometricCreds, setHasBiometricCreds] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [showEnableBiometric, setShowEnableBiometric] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Sign in — Pasona";
    (async () => {
      const avail = await checkBiometricAvailability();
      setBiometricAvailable(avail.available);
      setBiometricType(avail.biometryType);
      if (avail.available) {
        const has = await getBiometricCredentials().then((c) => c !== null);
        setHasBiometricCreds(has);
      }
    })();
  }, []);

  const goToRegister = useCallback(() => {
    handOffEmail(email);
    void navigate("/register");
  }, [email, navigate]);

  type CallbackState = "none" | { kind: "pending" } | { kind: "error"; message: string };
  const [callback, setCallback] = useState<CallbackState>(() => {
    if (typeof window === "undefined") return "none";
    const search = window.location.search || window.location.hash || "";
    const params = new URLSearchParams(search);
    const token = params.get("token") ?? params.get("access_token");
    const callbackError = params.get("error");
    if (token) return { kind: "pending" };
    if (callbackError) return { kind: "error", message: callbackError };
    return "none";
  });
  const isCallback = callback !== "none";

  useEffect(() => {
    if (!isCallback) return;
    if (callback.kind === "error") {
      setError(callback.message);
      return;
    }
    const search = typeof window !== "undefined" ? window.location.search : "";
    const result = completeGoogleCallback(search);
    if (!result.ok) {
      setError(result.error);
      setCallback({ kind: "error", message: result.error });
      return;
    }
    authApi
      .me()
      .then(() => {
        void navigate("/dashboard", { replace: true });
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Sign-in failed. Please try again.";
        setError(message);
        setCallback({ kind: "error", message });
      });
  }, [isCallback, callback, navigate]);

  const performLogin = async (
    loginEmail: string,
    loginPassword: string,
    fromBiometric: boolean,
  ) => {
    setError(null);
    setSubmitting(true);
    try {
      await authApi.login({ email: loginEmail, password: loginPassword });
      if (!fromBiometric && hasBiometricCreds === false && biometricAvailable) {
        setShowEnableBiometric(true);
      }
      await navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in. Please try again.");
      if (fromBiometric) {
        deleteBiometricCredentials();
        setHasBiometricCreds(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    await performLogin(email, password, false);
  };

  const handleBiometricSignIn = async () => {
    if (biometricBusy) return;
    setBiometricBusy(true);
    try {
      const verified = await verifyBiometricIdentity();
      if (!verified) {
        setBiometricBusy(false);
        return;
      }
      const creds = await getBiometricCredentials();
      if (!creds) {
        setError("Saved biometric credentials expired. Sign in with password once.");
        setHasBiometricCreds(false);
        setBiometricBusy(false);
        return;
      }
      setEmail(creds.email);
      setPassword(creds.password);
      await performLogin(creds.email, creds.password, true);
    } catch (err) {
      setError("Biometric sign-in failed. Try your password.");
    } finally {
      setBiometricBusy(false);
    }
  };

  const enableBiometrics = async () => {
    await saveBiometricCredentials(email, password);
    setHasBiometricCreds(true);
    setShowEnableBiometric(false);
    void navigate("/dashboard");
  };

  const skipBiometrics = () => {
    setShowEnableBiometric(false);
    void navigate("/dashboard");
  };

  const labelBiometric =
    biometricType === "face"
      ? "Face ID"
      : biometricType === "fingerprint"
        ? "Touch ID / Fingerprint"
        : "Biometric Sign In";

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <AuthShell title="Sign in to Pasona" subtitle="Welcome back">
      <div ref={formRef} className="space-y-5">
        <GoogleButton />

        <div className="flex items-center gap-3 my-[22px]">
          <div className="flex-1 h-px bg-cream-200" />
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-faint whitespace-nowrap">
            or continue with email
          </span>
          <div className="flex-1 h-px bg-cream-200" />
        </div>

        {error && (
          <div
            role="alert"
            className="flex gap-2.5 items-start bg-rose-soft border border-[#e8bcb8] rounded-[14px] px-3.5 py-3 mb-[18px] text-[#8f332c] text-[13.5px] font-semibold leading-snug"
          >
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint z-10 peer-focus:text-navy-700 transition-colors" />
              <input
                type="email"
                id="login-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                placeholder=" "
                className={authInputClass}
                autoComplete="email"
              />
              <label htmlFor="login-email" className={authLabelClass}>
                Email Address
              </label>
              {emailLooksValid && emailExists === true && (
                <Check
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald"
                  aria-hidden
                />
              )}
            </div>
            {emailTouched && emailLooksValid && emailExists === false && (
              <div className="flex items-center justify-between gap-2.5 bg-amber-soft border border-[#e6c078] rounded-xl px-3 py-2.5 -mt-1 mb-4 text-[12.5px] font-bold text-amber-deep">
                <span>No account with this email.</span>
                <button
                  type="button"
                  onClick={goToRegister}
                  className="inline-flex items-center gap-1.5 bg-navy-700 text-white rounded-full px-3 py-1.5 text-xs font-bold shrink-0"
                >
                  <UserPlus size={13} /> Create account
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint opacity-0 select-none">
                &nbsp;
              </span>
              <Link
                to="/forgot-password"
                className="text-[13px] font-bold text-navy-700 no-underline border-b-[1.5px] border-amber pb-px"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint z-10 peer-focus:text-navy-700 transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                id="login-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className={authInputClass}
                autoComplete="current-password"
              />
              <label htmlFor="login-password" className={authLabelClass}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-navy-700 z-10"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !emailLooksValid || !password}
            className={authButtonClass}
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {biometricAvailable && hasBiometricCreds && (
          <button
            type="button"
            onClick={handleBiometricSignIn}
            disabled={biometricBusy}
            className="w-full h-12 mt-3 rounded-2xl border-[1.5px] border-dashed border-cream-200 bg-transparent text-ink-soft font-bold text-[13.5px] flex items-center justify-center gap-2 transition-colors hover:border-navy-600 hover:text-navy-700 hover:bg-cream-100"
          >
            <Fingerprint size={18} />
            {biometricBusy ? "Verifying..." : labelBiometric}
          </button>
        )}

        <p className="text-center mt-6 text-[13.5px] font-semibold text-ink-faint">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-navy-700 font-extrabold no-underline border-b-[1.5px] border-amber"
          >
            Create one
          </Link>
        </p>
      </div>

      {showEnableBiometric && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-navy-800 to-navy-900 border border-white/[0.08] rounded-[26px] p-[28px_24px_24px] max-w-sm w-full space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-amber to-amber-deep flex items-center justify-center shadow-[0_8px_20px_rgba(217,142,42,0.35)]">
              <Fingerprint size={24} className="text-navy-950" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display font-medium text-[21px] text-white">
                Enable {labelBiometric}?
              </h3>
              <p className="text-[14px] text-[#B7BEDD] leading-relaxed">
                Sign in instantly next time using your device's biometric authentication.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={enableBiometrics}
                className="w-full h-[50px] rounded-2xl border-none bg-amber text-navy-950 font-extrabold text-[15px]"
              >
                Enable {labelBiometric}
              </button>
              <button
                type="button"
                onClick={skipBiometrics}
                className="bg-none border-none text-[#9099C2] font-bold text-[13.5px] p-1.5"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
