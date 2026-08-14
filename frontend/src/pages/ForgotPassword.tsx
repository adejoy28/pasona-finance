import { Link } from "react-router";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { AuthShell, authButtonClass, authInputClass } from "@/components/finance/AuthShell";
import { ApiError, auth as authApi } from "@/lib/api";

const RESEND_COOLDOWN_SECONDS = 60;

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    document.title = "Reset password — Pasona";
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || cooldown > 0) return;
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await authApi.requestPasswordReset({ email });
      setMessage(res.message);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to send the reset link. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const buttonLabel =
    cooldown > 0 ? `Resend in ${cooldown}s` : submitting ? "Sending…" : "Send reset link";

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll send you a reset link"
      footer={
        <p className="text-slate-400">
          Remembered it?{" "}
          <Link to="/login" className="text-indigo-400 font-semibold">
            Sign in
          </Link>
        </p>
      }
    >
      {message ? (
        <p className="text-sm text-slate-300 text-center py-4">{message}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-slate-400">Email</label>
            <div className="relative">
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="email"
                required
                placeholder="you@example.com"
                className={authInputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>
          {error && (
            <p
              role="alert"
              className="text-xs font-semibold text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || cooldown > 0}
            className={authButtonClass + " disabled:opacity-60 disabled:cursor-not-allowed"}
          >
            {buttonLabel}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
