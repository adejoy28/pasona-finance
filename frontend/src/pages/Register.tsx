import { Link, useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Lock, LogIn, Mail, User } from "lucide-react";
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
    <AuthShell title="Create your account" subtitle="Get started">
      <div className="space-y-5">
        <GoogleButton />

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-slate-700/60" />
          <span className="flex-shrink mx-3 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
            or sign up with email
          </span>
          <div className="flex-grow border-t border-slate-700/60" />
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs"
          >
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
            <input
              type="text"
              id="reg-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=" "
              className={authInputClass}
              autoComplete="name"
            />
            <label htmlFor="reg-name" className={authLabelClass}>
              Full Name
            </label>
          </div>

          <div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <input
                type="email"
                id="reg-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className={authInputClass}
                autoComplete="email"
              />
              <label htmlFor="reg-email" className={authLabelClass}>
                Email Address
              </label>
            </div>
            {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && emailExists && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                <span className="text-amber-200">Already registered.</span>
                <button
                  type="button"
                  onClick={goToLogin}
                  className="font-bold text-amber-300 hover:underline flex items-center gap-1 shrink-0 ml-2"
                >
                  <LogIn size={13} /> Sign in instead
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <input
                type="password"
                id="reg-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className={authInputClass}
                autoComplete="new-password"
              />
              <label htmlFor="reg-password" className={authLabelClass}>
                Password
              </label>
            </div>
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
                      score >= 3 ? "text-emerald-300" : score === 2 ? "text-lime-300" : "text-amber-300"
                    }`}
                  >
                    {STRENGTH_LABEL[score]}
                  </span>
                  <span className="mx-1.5">·</span>
                  8+ chars, mix letters, numbers, symbols
                </p>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <li
                    className={`flex items-center gap-1.5 ${
                      checks.length ? "text-emerald-300" : "text-slate-500"
                    }`}
                  >
                    <Check size={11} /> 8+ characters
                  </li>
                  <li
                    className={`flex items-center gap-1.5 ${
                      checks.upper ? "text-emerald-300" : "text-slate-500"
                    }`}
                  >
                    <Check size={11} /> Uppercase letter
                  </li>
                  <li
                    className={`flex items-center gap-1.5 ${
                      checks.number ? "text-emerald-300" : "text-slate-500"
                    }`}
                  >
                    <Check size={11} /> Number
                  </li>
                  <li
                    className={`flex items-center gap-1.5 ${
                      checks.symbol ? "text-emerald-300" : "text-slate-500"
                    }`}
                  >
                    <Check size={11} /> Symbol
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <input
                type="password"
                id="reg-confirm"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder=" "
                className={authInputClass}
                autoComplete="new-password"
              />
              <label htmlFor="reg-confirm" className={authLabelClass}>
                Confirm Password
              </label>
              {passwordMatches && (
                <Check
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400"
                  aria-hidden
                />
              )}
            </div>
            {confirm.length > 0 && !passwordMatches && (
              <p className="mt-1.5 text-[11px] text-rose-300">Passwords do not match.</p>
            )}
          </div>

          <button type="submit" disabled={!canSubmit} className={authButtonClass}>
            {submitting ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 pt-1">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
