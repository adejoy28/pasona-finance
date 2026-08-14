import { Link, useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { AuthShell, authButtonClass, authInputClass } from "@/components/finance/AuthShell";
import { ApiError, auth as authApi } from "@/lib/api";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.title = "Set new password — Pasona";
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!token || !email) {
      setError("This reset link is invalid or has expired.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await authApi.resetPassword({
        email,
        token,
        password,
        password_confirmation: confirm,
      });
      setDone(true);
      setTimeout(() => {
        void navigate("/login");
      }, 1500);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to reset your password. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Set new password"
      subtitle="Pick something memorable"
      footer={
        <p className="text-slate-400">
          Back to{" "}
          <Link to="/login" className="text-indigo-400 font-semibold">
            sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-wider text-slate-400">
            New password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="password"
              required
              placeholder="••••••••"
              minLength={8}
              className={authInputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-wider text-slate-400">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="password"
              required
              placeholder="••••••••"
              minLength={8}
              className={authInputClass}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
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
        {done && (
          <p className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            Password updated. Redirecting to sign in…
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || done}
          className={authButtonClass + " disabled:opacity-60 disabled:cursor-not-allowed"}
        >
          {submitting ? "Saving…" : "Save password"}
        </button>
      </form>
    </AuthShell>
  );
}
