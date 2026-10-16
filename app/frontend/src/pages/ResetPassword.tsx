import { Link, useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { Lock, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { ApiError, auth as authApi } from "@/lib/api";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.title = "Set new password — Pasona";
  }, []);

  const isInvalidLink = !token || !email;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (isInvalidLink) {
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
      }, 2500);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to reset your password. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const passwordMismatch = confirm.length > 0 && password !== confirm;

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

      {/* Right Column (Form / States) */}
      <div className="col-span-1 md:col-span-7 lg:col-span-8 px-6 py-10 sm:p-12 lg:p-20 flex flex-col justify-start md:justify-center bg-[#040914] relative h-full overflow-y-auto">
        <div className="w-full max-w-[360px] mx-auto space-y-5">
          
          {/* Mobile Brand Header */}
          <div className="md:hidden flex items-center justify-between pb-3.5 mb-5 border-b border-white/[0.06]">
            <Link to="/" aria-label="Pasona home" className="inline-block transition-opacity hover:opacity-85">
              <img src="/img/brand-name-logo-dark.png" alt="Pasona" className="h-5.5 w-auto object-contain" />
            </Link>
          </div>

          {/* State 1: Invalid or expired link on initial load */}
          {isInvalidLink ? (
            <div className="space-y-5 text-center py-2">
              <div className="w-12 h-12 rounded-xl mx-auto bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-lg">
                <AlertCircle size={26} />
              </div>
              <div className="space-y-1">
                <h1 className="text-[20px] sm:text-[22px] font-semibold text-white tracking-tight">Invalid or expired link</h1>
                <p className="text-[12.5px] sm:text-[13px] text-[#8c93b0] leading-relaxed">
                  This password reset link is missing required security tokens or has already expired.
                </p>
              </div>
              <Link
                to="/forgot-password"
                className="w-full h-11 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.985] text-white font-semibold text-[13.5px] transition-all flex items-center justify-center"
              >
                Request a new reset link
              </Link>
              <p className="text-[12.5px] text-[#8c93b0] pt-1">
                Or return to{" "}
                <Link to="/login" className="text-white font-semibold hover:underline">
                  sign in
                </Link>
              </p>
            </div>
          ) : done ? (
            /* State 2: Successful reset response state */
            <div className="space-y-5 text-center py-2">
              <div className="w-12 h-12 rounded-xl mx-auto bg-emerald/15 border border-emerald/30 flex items-center justify-center text-emerald shadow-lg">
                <CheckCircle2 size={26} />
              </div>
              <div className="space-y-1">
                <h1 className="text-[20px] sm:text-[22px] font-semibold text-white tracking-tight">Password updated!</h1>
                <p className="text-[12.5px] sm:text-[13px] text-[#8c93b0] leading-relaxed">
                  Your password has been changed successfully. You can now sign in with your new credentials.
                </p>
              </div>
              <Link
                to="/login"
                className="w-full h-11 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.985] text-white font-semibold text-[13.5px] transition-all flex items-center justify-center"
              >
                Proceed to Sign In
              </Link>
              <p className="text-[11px] text-[#8c93b0]">Redirecting automatically in a moment…</p>
            </div>
          ) : (
            /* State 3: Active reset password form */
            <>
              <div className="space-y-1">
                <h1 className="text-[21px] sm:text-[24px] font-semibold text-white tracking-tight">Set new password</h1>
                <p className="text-[12.5px] sm:text-[13px] text-[#8c93b0] font-normal">Choose 8+ characters to secure your account.</p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex gap-2.5 items-start bg-rose-950/40 border border-rose-900/50 rounded-xl px-3.5 py-3 text-rose-200 text-[13px] font-medium leading-snug"
                >
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="reset-password" className="text-[10px] font-bold uppercase tracking-wider text-[#8c93b0]">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6389] z-10" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="reset-password"
                      required
                      placeholder="••••••••"
                      minLength={8}
                      className="w-full h-11 rounded-xl border border-white/[0.08] bg-[#0b1329]/50 pl-11 pr-11 text-[14px] text-white placeholder-[#454c70] outline-none transition-all focus:border-[#3b82f6] focus:bg-[#0b1329]/80 focus:ring-2 focus:ring-[#3b82f6]/20"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[#5b6389] hover:text-[#8c93b0] z-10"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reset-confirm" className="text-[10px] font-bold uppercase tracking-wider text-[#8c93b0]">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6389] z-10" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="reset-confirm"
                      required
                      placeholder="••••••••"
                      minLength={8}
                      className={`w-full h-11 rounded-xl border ${
                        passwordMismatch ? "border-rose-500/50" : "border-white/[0.08]"
                      } bg-[#0b1329]/50 pl-11 pr-11 text-[14px] text-white placeholder-[#454c70] outline-none transition-all focus:border-[#3b82f6] focus:bg-[#0b1329]/80 focus:ring-2 focus:ring-[#3b82f6]/20`}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[#5b6389] hover:text-[#8c93b0] z-10"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordMismatch && (
                    <p className="text-[11px] text-rose-300 pt-0.5">Passwords do not match.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || password.length < 8 || password !== confirm}
                  className="w-full h-11 mt-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.985] text-white font-semibold text-[14px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    "Save password"
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
