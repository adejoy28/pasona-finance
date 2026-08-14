import { Link, useSearchParams } from "react-router";
import { useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { AuthShell, authButtonClass } from "@/components/finance/AuthShell";

const btn = authButtonClass + " inline-block w-auto px-6";

export function EmailVerify() {
  const [searchParams] = useSearchParams();
  const verify_url = searchParams.get("verify_url") ?? "";
  const error = searchParams.get("error") ?? "";
  const fired = useRef(false);

  useEffect(() => {
    document.title = "Confirm email — Pasona";
  }, []);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (!verify_url || error) return;
    window.location.replace(verify_url);
  }, [verify_url, error]);

  let title = "Verify your email";
  let subtitle = "Check your inbox";
  let content = null;

  if (error === "expired") {
    title = "Link expired";
    subtitle = "Your verification link is no longer valid";
    content = (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <AlertTriangle size={40} className="text-amber-400" />
        <p className="text-sm text-[#8c93b0] leading-relaxed">
          Verification links expire after 60 minutes for security.
          Request a fresh one from your account settings after signing in.
        </p>
        <Link
          to="/login"
          className="w-full h-11 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.985] text-white font-semibold text-[14px] transition-all flex items-center justify-center"
        >
          Sign in
        </Link>
      </div>
    );
  } else if (error === "invalid_hash") {
    title = "Invalid link";
    subtitle = "This link doesn't match our records";
    content = (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <AlertTriangle size={40} className="text-rose-400" />
        <p className="text-sm text-[#8c93b0] leading-relaxed">
          The verification link you clicked appears to be invalid.
          Sign in and request a new verification email from your settings.
        </p>
        <Link
          to="/login"
          className="w-full h-11 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.985] text-white font-semibold text-[14px] transition-all flex items-center justify-center"
        >
          Sign in
        </Link>
      </div>
    );
  } else if (error) {
    title = "Verification failed";
    subtitle = "Something went wrong";
    content = (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <AlertTriangle size={40} className="text-rose-400" />
        <p className="text-sm text-[#8c93b0] leading-relaxed">
          We couldn't verify your email. Try signing in and requesting a new
          verification link.
        </p>
        <Link
          to="/login"
          className="w-full h-11 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.985] text-white font-semibold text-[14px] transition-all flex items-center justify-center"
        >
          Sign in
        </Link>
      </div>
    );
  } else if (verify_url) {
    title = "Confirming your email";
    subtitle = "Just a moment";
    content = (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <Loader2 size={32} className="animate-spin text-[#3b82f6]" />
        <p className="text-sm text-[#8c93b0] leading-relaxed">
          Verifying your email address…
        </p>
      </div>
    );
  } else {
    content = (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <CheckCircle2 size={40} className="text-emerald" />
        <p className="text-sm text-[#8c93b0] leading-relaxed">
          We sent a verification link to your email. Click it to activate
          your account and unlock all features.
        </p>
        <Link
          to="/login"
          className="w-full h-11 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.985] text-white font-semibold text-[14px] transition-all flex items-center justify-center"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

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
            Verify your <span className="text-[#3b82f6]">account.</span>
          </h2>
          <p className="mt-4 text-[#8c93b0] text-[14.5px] font-medium leading-relaxed max-w-[340px]">
            Please confirm your email address to unlock the full power of Pasona.
          </p>
        </div>

        {/* Carousel indicators */}
        <div className="relative z-10 flex items-center gap-1.5 opacity-0">
          <span className="w-2 h-1 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Right Column (Content) */}
      <div className="col-span-1 md:col-span-7 lg:col-span-8 p-8 sm:p-12 lg:p-20 flex flex-col justify-center bg-[#040914] relative h-full overflow-y-auto">
        <div className="w-full max-w-[360px] mx-auto space-y-6">
          
          {/* Header (visible on mobile only: show small logo) */}
          <div className="md:hidden flex items-center justify-between mb-2">
            <img src="/img/brand-name-logo-light.png" alt="Pasona" className="h-6 w-auto object-contain" />
          </div>

          <div className="space-y-1">
            <h1 className="text-[26px] font-semibold text-white tracking-tight">{title}</h1>
            <p className="text-[13px] text-[#8c93b0] font-medium">{subtitle}</p>
          </div>

          {content}

        </div>
      </div>
    </div>
  );
}
