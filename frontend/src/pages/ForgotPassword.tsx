import { Link } from "react-router";
import { useEffect, useState } from "react";
import { Mail, MailCheck, Loader2 } from "lucide-react";
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
          <Link to="/" aria-label="Pasona home" className="inline-block transition-opacity hover:opacity-85">
            <img src="/img/brand-name-logo-dark.png" alt="Pasona" className="h-7 w-auto object-contain" />
          </Link>
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

      {/* Right Column (Form / Feedback) */}
      <div className="col-span-1 md:col-span-7 lg:col-span-8 px-6 py-10 sm:p-12 lg:p-20 flex flex-col justify-start md:justify-center bg-[#040914] relative h-full overflow-y-auto">
        <div className="w-full max-w-[360px] mx-auto space-y-5">
          
          {/* Mobile Brand Header */}
          <div className="md:hidden flex items-center justify-between pb-3.5 mb-5 border-b border-white/[0.06]">
            <Link to="/" aria-label="Pasona home" className="inline-block transition-opacity hover:opacity-85">
              <img src="/img/brand-name-logo-dark.png" alt="Pasona" className="h-5.5 w-auto object-contain" />
            </Link>
          </div>

          {message ? (
            /* Post-submit feedback state */
            <div className="space-y-5 text-center py-2">
              <div className="w-12 h-12 rounded-xl mx-auto bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[#3b82f6] shadow-lg">
                <MailCheck size={26} />
              </div>
              <div className="space-y-1">
                <h1 className="text-[20px] sm:text-[22px] font-semibold text-white tracking-tight">Check your email</h1>
                <p className="text-[12.5px] sm:text-[13px] text-[#8c93b0] leading-relaxed">
                  We sent a password reset link to{" "}
                  <span className="text-white font-medium">{email}</span>.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Link
                  to="/login"
                  className="w-full h-11 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.985] text-white font-semibold text-[13.5px] transition-all flex items-center justify-center"
                >
                  Return to Sign In
                </Link>

                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={submitting || cooldown > 0}
                  className="w-full py-2 text-[12px] text-[#8c93b0] hover:text-white font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Resending reset link…</span>
                    </>
                  ) : cooldown > 0 ? (
                    <span>
                      Resend link in <span className="font-semibold text-white tabular-nums">{cooldown}s</span>
                    </span>
                  ) : (
                    <span className="text-[#3b82f6] hover:underline font-semibold">Resend reset link</span>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-[#8c93b0] pt-1">
                Didn't receive the email? Check your spam or junk folder.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h1 className="text-[21px] sm:text-[24px] font-semibold text-white tracking-tight">Forgot password</h1>
                <p className="text-[12.5px] sm:text-[13px] text-[#8c93b0] font-normal">We'll send you a reset link.</p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="forgot-email" className="text-[10px] font-bold uppercase tracking-wider text-[#8c93b0]">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6389] z-10" />
                    <input
                      type="email"
                      id="forgot-email"
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
                  className="w-full h-11 mt-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.985] text-white font-semibold text-[14px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending…</span>
                    </>
                  ) : (
                    buttonLabel
                  )}
                </button>
              </form>

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
            </>
          )}

        </div>
      </div>
    </div>
  );
}
