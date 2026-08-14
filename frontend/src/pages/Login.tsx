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
    <div className="relative h-[100dvh] w-full grid grid-cols-1 md:grid-cols-12 bg-[#030712] font-sans overflow-hidden z-10">
      
      {/* Left Column (Promotional) */}
      <div className="hidden md:flex md:col-span-5 lg:col-span-4 bg-gradient-to-b from-[#0a1b39] to-[#040c1b] p-12 lg:p-16 flex-col justify-between relative overflow-hidden border-r border-white/[0.06] h-full">
        {/* Subtle glow in the promotional area */}
        <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <img src="/img/brand-name-logo-light.png" alt="Pasona" className="h-7 w-auto object-contain" />
        </div>

        <div className="relative z-10 my-auto py-8">
          <h2 className="font-display font-medium text-[2.75rem] leading-[1.15] text-white tracking-[-0.02em]">
            Precision in <span className="text-[#3b82f6]">every transaction.</span>
          </h2>
          <p className="mt-4 text-[#8c93b0] text-[14.5px] font-medium leading-relaxed max-w-[340px]">
            Track every naira with clarity — accounts, budgets and insights in one calm place.
          </p>
        </div>

        {/* Carousel indicators */}
        <div className="relative z-10 flex items-center gap-1.5">
          <span className="w-8 h-1 rounded-full bg-[#3b82f6]" />
          <span className="w-2 h-1 rounded-full bg-white/10" />
          <span className="w-2 h-1 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Right Column (Form) */}
      <div className="col-span-1 md:col-span-7 lg:col-span-8 p-8 sm:p-12 lg:p-20 flex flex-col justify-center bg-[#040914] relative h-full overflow-y-auto">
        <div className="w-full max-w-[360px] mx-auto space-y-5">
          
          {/* Header (visible on mobile only: show small logo) */}
          <div className="md:hidden flex items-center justify-between mb-2">
            <img src="/img/brand-name-logo-light.png" alt="Pasona" className="h-6 w-auto object-contain" />
          </div>

          <div className="space-y-1">
            <h1 className="text-[26px] font-semibold text-white tracking-tight">Sign In</h1>
            <p className="text-[13px] text-[#8c93b0] font-medium">Secure access to your Pasona account.</p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex gap-2.5 items-start bg-rose-950/40 border border-rose-900/50 rounded-xl px-3.5 py-3 text-rose-200 text-[13px] font-medium leading-snug animate-shake"
            >
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-[10px] font-bold uppercase tracking-wider text-[#8c93b0]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6389] z-10" />
                <input
                  type="email"
                  id="login-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="you@example.com"
                  className="w-full h-11 rounded-xl border border-white/[0.08] bg-[#0b1329]/50 pl-11 pr-10 text-[14px] text-white placeholder-[#454c70] outline-none transition-all focus:border-[#3b82f6] focus:bg-[#0b1329]/80 focus:ring-2 focus:ring-[#3b82f6]/20"
                  autoComplete="email"
                />
                {emailLooksValid && emailExists === true && (
                  <Check
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald"
                    aria-hidden
                  />
                )}
              </div>
              {emailTouched && emailLooksValid && emailExists === false && (
                <div className="flex items-center justify-between gap-2 bg-amber-950/40 border border-amber-900/50 rounded-xl p-3 text-[12px] text-amber-200">
                  <span>No account with this email.</span>
                  <button
                    type="button"
                    onClick={goToRegister}
                    className="inline-flex items-center gap-1.5 bg-[#3b82f6] text-white rounded-lg px-2.5 py-1 text-xs font-semibold shrink-0 hover:bg-blue-600 transition-colors"
                  >
                    <UserPlus size={12} /> Register
                  </button>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-[10px] font-bold uppercase tracking-wider text-[#8c93b0]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[12px] font-medium text-[#3b82f6] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6389] z-10" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 rounded-xl border border-white/[0.08] bg-[#0b1329]/50 pl-11 pr-12 text-[14px] text-white placeholder-[#454c70] outline-none transition-all focus:border-[#3b82f6] focus:bg-[#0b1329]/80 focus:ring-2 focus:ring-[#3b82f6]/20"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5b6389] hover:text-[#8c93b0] z-10"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={submitting || !emailLooksValid || !password}
              className="w-full h-11 mt-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.985] text-white font-semibold text-[14px] transition-all flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#454c70] whitespace-nowrap">
              Or continue with
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Google Sign In */}
          <GoogleButton variant="dark" />

          {/* Biometric login */}
          {biometricAvailable && hasBiometricCreds && (
            <button
              type="button"
              onClick={handleBiometricSignIn}
              disabled={biometricBusy}
              className="w-full h-11 rounded-xl border border-dashed border-white/[0.1] bg-transparent text-[#8c93b0] hover:text-white hover:border-white/[0.2] font-semibold text-[13px] flex items-center justify-center gap-2 transition-all"
            >
              <Fingerprint size={16} />
              {biometricBusy ? "Verifying..." : labelBiometric}
            </button>
          )}

          {/* Footer Links */}
          <div className="text-center space-y-4 pt-1">
            <p className="text-[13px] text-[#8c93b0]">
              New here?{" "}
              <Link
                to="/register"
                className="text-white font-semibold hover:underline"
              >
                Create an account
              </Link>
            </p>
            <p className="text-[11px] text-[#454c70] leading-normal">
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline hover:text-[#8c93b0]">Terms of Service</a> and{" "}
              <a href="/privacy" className="underline hover:text-[#8c93b0]">Privacy Policy</a>.
            </p>
          </div>

        </div>
      </div>

      {/* Biometrics Enable Modal */}
      {showEnableBiometric && (
        <div className="fixed inset-0 z-50 bg-[#030712]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#070e1e] border border-white/[0.08] rounded-[24px] p-6 max-w-sm w-full space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-amber to-amber-deep flex items-center justify-center shadow-[0_8px_20px_rgba(217,142,42,0.35)]">
              <Fingerprint size={24} className="text-navy-950" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display font-medium text-[20px] text-white">
                Enable {labelBiometric}?
              </h3>
              <p className="text-[13.5px] text-[#8c93b0] leading-relaxed">
                Sign in instantly next time using your device's biometric authentication.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={enableBiometrics}
                className="w-full h-11 rounded-xl border-none bg-amber text-navy-950 font-bold text-[14.5px]"
              >
                Enable {labelBiometric}
              </button>
              <button
                type="button"
                onClick={skipBiometrics}
                className="bg-none border-none text-[#9099C2] font-semibold text-[13px] p-1.5"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
