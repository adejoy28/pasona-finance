import { Link, useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Lock, LogIn, Mail, User, Eye, EyeOff } from "lucide-react";
import {
  AuthShell,
  authButtonClass,
  authInputClass,
  authLabelClass,
} from "@/components/finance/AuthShell";
import { GoogleButton } from "@/components/finance/GoogleButton";
import { ApiError, auth as authApi } from "@/lib/api";
import { handOffEmail } from "@/lib/auth/email-handoff";
import { useEmailCheck } from "@/hooks/use-email-check";

type Strength = 0 | 1 | 2 | 3 | 4;
const STRENGTH_LABEL: Record<Strength, string> = {
  0: "Too weak",
  1: "Weak",
  2: "Fair",
  3: "Good",
  4: "Strong",
};
const STRENGTH_COLOR: Record<Strength, string> = {
  0: "bg-rose-500/60",
  1: "bg-amber-400/70",
  2: "bg-lime-400/80",
  3: "bg-sky-400/80",
  4: "bg-[var(--ocean-500)]",
};

function scorePassword(pw: string): { score: Strength; checks: Record<string, boolean> } {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  let score: Strength = 0;
  if (pw.length === 0) score = 0;
  else if (pw.length < 8) score = 1;
  else {
    score = 1;
    if (checks.upper) score = (score + 1) as Strength;
    if (checks.number) score = (score + 1) as Strength;
    if (checks.symbol) score = (score + 1) as Strength;
    if (pw.length >= 12 && score === 4) score = 4;
    if (score < 2) score = 2;
  }
  return { score, checks };
}

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { exists: emailExists } = useEmailCheck(email);

  useEffect(() => {
    document.title = "Create your account — Pasona";
  }, []);

  const { score, checks } = useMemo(() => scorePassword(password), [password]);
  const passwordMatches = confirm.length > 0 && password === confirm;
  const passwordStrongEnough = password.length >= 8 && score >= 2;
  const canSubmit =
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    passwordStrongEnough &&
    passwordMatches &&
    !submitting;

  const goToLogin = () => {
    handOffEmail(email);
    void navigate("/login");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !canSubmit) return;
    setError(null);
    setSubmitting(true);
    const tz =
      typeof Intl?.DateTimeFormat === "function"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : undefined;
    try {
      await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirm,
        timezone: tz,
      });
      await navigate("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to create your account. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const showMeter = password.length > 0;

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
          <h2 className="font-display font-medium text-[2.5rem] leading-[1.15] text-white tracking-[-0.02em]">
            Start with <span className="text-[#3b82f6]">total clarity.</span>
          </h2>
          <p className="mt-4 text-[#8c93b0] text-[14px] font-medium leading-relaxed max-w-[320px]">
            One account for every balance, budget and insight — set up in under a minute.
          </p>
        </div>

        {/* Carousel indicators: Middle dot active */}
        <div className="relative z-10 flex items-center gap-1.5">
          <span className="w-2 h-1 rounded-full bg-white/10" />
          <span className="w-8 h-1 rounded-full bg-[#3b82f6]" />
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
            <h1 className="text-[26px] font-semibold text-white tracking-tight">Create Account</h1>
            <p className="text-[13px] text-[#8c93b0] font-medium">It only takes a minute to get started.</p>
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
            {/* Full Name */}
            <div className="space-y-1.25">
              <label htmlFor="reg-name" className="text-[10px] font-bold uppercase tracking-wider text-[#8c93b0]">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6389] z-10" />
                <input
                  type="text"
                  id="reg-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Okeke"
                  className="w-full h-11 rounded-xl border border-white/[0.08] bg-[#0b1329]/50 pl-11 pr-4 text-[14px] text-white placeholder-[#454c70] outline-none transition-all focus:border-[#3b82f6] focus:bg-[#0b1329]/80 focus:ring-2 focus:ring-[#3b82f6]/20"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.25">
              <label htmlFor="reg-email" className="text-[10px] font-bold uppercase tracking-wider text-[#8c93b0]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6389] z-10" />
                <input
                  type="email"
                  id="reg-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 rounded-xl border border-white/[0.08] bg-[#0b1329]/50 pl-11 pr-4 text-[14px] text-white placeholder-[#454c70] outline-none transition-all focus:border-[#3b82f6] focus:bg-[#0b1329]/80 focus:ring-2 focus:ring-[#3b82f6]/20"
                  autoComplete="email"
                />
              </div>
              {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && emailExists && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-900/50 flex items-center justify-between text-xs text-amber-200">
                  <span>Already registered.</span>
                  <button
                    type="button"
                    onClick={goToLogin}
                    className="font-semibold text-[#3b82f6] hover:underline flex items-center gap-1 shrink-0 ml-2"
                  >
                    <LogIn size={13} /> Sign in instead
                  </button>
                </div>
              )}
            </div>

            {/* Password and Confirm Side-by-Side */}
            <div className="grid grid-cols-2 gap-3">
              {/* Password */}
              <div className="space-y-1.25">
                <label htmlFor="reg-password" className="text-[10px] font-bold uppercase tracking-wider text-[#8c93b0]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6389] z-10" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="reg-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8+ characters"
                    className="w-full h-11 rounded-xl border border-white/[0.08] bg-[#0b1329]/50 pl-11 pr-10 text-[14px] text-white placeholder-[#454c70] outline-none transition-all focus:border-[#3b82f6] focus:bg-[#0b1329]/80 focus:ring-2 focus:ring-[#3b82f6]/20"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5b6389] hover:text-[#8c93b0] z-10"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <div className="space-y-1.25">
                <label htmlFor="reg-confirm" className="text-[10px] font-bold uppercase tracking-wider text-[#8c93b0]">
                  Confirm
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6389] z-10" />
                  <input
                    type="password"
                    id="reg-confirm"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat"
                    className="w-full h-11 rounded-xl border border-white/[0.08] bg-[#0b1329]/50 pl-11 pr-10 text-[14px] text-white placeholder-[#454c70] outline-none transition-all focus:border-[#3b82f6] focus:bg-[#0b1329]/80 focus:ring-2 focus:ring-[#3b82f6]/20"
                    autoComplete="new-password"
                  />
                  {passwordMatches && (
                    <Check
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald"
                      aria-hidden
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Password strength & match indicators below the inputs */}
            {showMeter && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < score ? STRENGTH_COLOR[score] : "bg-white/[0.06]"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">
                  <span
                    className={`font-semibold ${
                      score >= 3 ? "text-emerald" : score === 2 ? "text-[#a3e635]" : "text-amber-300"
                    }`}
                  >
                    {STRENGTH_LABEL[score]}
                  </span>
                  <span className="mx-1.5">·</span>
                  8+ chars, mix letters, numbers, symbols
                </p>
              </div>
            )}
            
            {confirm.length > 0 && !passwordMatches && (
              <p className="text-[11px] text-rose-300">Passwords do not match.</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-11 mt-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.985] text-white font-semibold text-[14px] transition-all flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#454c70] whitespace-nowrap">
              Or continue with
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Google Sign In */}
          <GoogleButton variant="dark" />

          {/* Footer Links */}
          <div className="text-center pt-1">
            <p className="text-[13px] text-[#8c93b0]">
              Already with us?{" "}
              <Link
                to="/login"
                className="text-white font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
