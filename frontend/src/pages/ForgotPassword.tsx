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
            Retrieve your <span className="text-[#3b82f6]">access.</span>
          </h2>
          <p className="mt-4 text-[#8c93b0] text-[14.5px] font-medium leading-relaxed max-w-[340px]">
            We will send you a reset link to get you back on track in no time.
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
            <h1 className="text-[26px] font-semibold text-white tracking-tight">Forgot password</h1>
            <p className="text-[13px] text-[#8c93b0] font-medium">We'll send you a reset link.</p>
          </div>

          {message ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-[#8c93b0] py-4">{message}</p>
              <Link
                to="/login"
                className="inline-block w-full h-11 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.985] text-white font-semibold text-[14px] transition-all flex items-center justify-center"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8c93b0]">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6389] z-10" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full h-11 rounded-xl border border-white/[0.08] bg-[#0b1329]/50 pl-11 pr-4 text-[14px] text-white placeholder-[#454c70] outline-none transition-all focus:border-[#3b82f6] focus:bg-[#0b1329]/80 focus:ring-2 focus:ring-[#3b82f6]/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
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

              <button
                type="submit"
                disabled={submitting || cooldown > 0}
                className="w-full h-11 mt-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.985] text-white font-semibold text-[14px] transition-all flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
              >
                {buttonLabel}
              </button>
            </form>
          )}

          {/* Footer Links */}
          <div className="text-center pt-1">
            <p className="text-[13px] text-[#8c93b0]">
              Remembered it?{" "}
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
