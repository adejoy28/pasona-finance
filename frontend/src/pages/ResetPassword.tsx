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
            Set new <span className="text-[#3b82f6]">password.</span>
          </h2>
          <p className="mt-4 text-[#8c93b0] text-[14.5px] font-medium leading-relaxed max-w-[340px]">
            Choose a strong, memorable password to secure your account details.
          </p>
        </div>

        {/* Carousel indicators (none or inactive) */}
        <div className="relative z-10 flex items-center gap-1.5 opacity-0">
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
            <h1 className="text-[26px] font-semibold text-white tracking-tight">Set new password</h1>
            <p className="text-[13px] text-[#8c93b0] font-medium">Pick something memorable.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8c93b0]">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6389] z-10" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  minLength={8}
                  className="w-full h-11 rounded-xl border border-white/[0.08] bg-[#0b1329]/50 pl-11 pr-4 text-[14px] text-white placeholder-[#454c70] outline-none transition-all focus:border-[#3b82f6] focus:bg-[#0b1329]/80 focus:ring-2 focus:ring-[#3b82f6]/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8c93b0]">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6389] z-10" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  minLength={8}
                  className="w-full h-11 rounded-xl border border-white/[0.08] bg-[#0b1329]/50 pl-11 pr-4 text-[14px] text-white placeholder-[#454c70] outline-none transition-all focus:border-[#3b82f6] focus:bg-[#0b1329]/80 focus:ring-2 focus:ring-[#3b82f6]/20"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex gap-2.5 items-start bg-rose-950/40 border border-rose-900/50 rounded-xl px-3.5 py-3 text-rose-200 text-[13px] font-medium leading-snug"
              >
                {error}
              </div>
            )}

            {done && (
              <div className="flex gap-2.5 items-start bg-emerald-950/40 border border-emerald-900/50 rounded-xl px-3.5 py-3 text-emerald-200 text-[13px] font-medium leading-snug">
                Password updated. Redirecting to sign in…
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || done}
              className="w-full h-11 mt-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.985] text-white font-semibold text-[14px] transition-all flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? "Saving…" : "Save password"}
            </button>
          </form>

          {/* Footer Links */}
          <div className="text-center pt-1">
            <p className="text-[13px] text-[#8c93b0]">
              Back to{" "}
              <Link
                to="/login"
                className="text-white font-semibold hover:underline"
              >
                sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
