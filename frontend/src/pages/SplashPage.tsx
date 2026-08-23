import { useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  Check,
  LineChart,
  PiggyBank,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { GoogleButton } from "@/components/finance/GoogleButton";

export function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Pasona — Personal Finance, organised";
  }, []);

  const goRegister = () => navigate("/register");
  const goLogin = () => navigate("/login");

  return (
    <div className="relative h-[100dvh] w-full grid grid-cols-1 md:grid-cols-12 bg-[#030712] font-sans overflow-hidden z-10">
      
      {/* Left Column (Promotional) */}
      <div className="hidden md:flex md:col-span-5 lg:col-span-4 bg-gradient-to-b from-[#0a1b39] to-[#040c1b] p-12 lg:p-16 flex-col justify-between relative overflow-hidden border-r border-white/[0.06] h-full">
        {/* Subtle glow in the promotional area */}
        <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <img src="/img/brand-name-logo-light.png" alt="Pasona" className="h-7 w-auto object-contain" />
        </div>

        <div className="relative z-10 my-auto py-6 space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3b82f6]/20 bg-[#3b82f6]/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#3b82f6]">
            <Sparkles size={11} />
            New in Pasona
          </span>
          <h1 className="font-display font-medium text-[2.5rem] leading-[1.1] text-white tracking-[-0.02em]">
            Money, organised.<br />
            <span className="text-[#3b82f6]">Calm, not cluttered.</span>
          </h1>
          <p className="text-[#8c93b0] text-[13.5px] font-medium leading-relaxed max-w-[320px]">
            Track every account, spend, and budget in one quiet dashboard. Built for the way your money actually moves.
          </p>

          <ul className="space-y-4 pt-2">
            <MarketingPoint
              icon={<LineChart size={14} />}
              title="Live dashboards"
              copy="See net worth, spend, and budgets update as transactions sync."
            />
            <MarketingPoint
              icon={<PiggyBank size={14} />}
              title="Accounts that mean something"
              copy="Cash, cards, savings, loans — grouped the way you think about them."
            />
            <MarketingPoint
              icon={<ShieldCheck size={14} />}
              title="Private by default"
              copy="Your data is yours. End-to-end encrypted sync, no ad tracking, ever."
            />
          </ul>
        </div>

        {/* Carousel indicators */}
        <div className="relative z-10 flex items-center gap-1.5">
          <span className="w-8 h-1 rounded-full bg-[#3b82f6]" />
          <span className="w-2 h-1 rounded-full bg-white/10" />
          <span className="w-2 h-1 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Right Column (Actions) */}
      <div className="col-span-1 md:col-span-7 lg:col-span-8 p-8 sm:p-12 lg:p-20 flex flex-col justify-center bg-[#040914] relative h-full overflow-y-auto">
        <div className="w-full max-w-[360px] mx-auto space-y-6">
          
          {/* Header (visible on mobile only: show small logo) */}
          <div className="md:hidden flex items-center justify-between mb-2">
            <img src="/img/brand-name-logo-light.png" alt="Pasona" className="h-6 w-auto object-contain" />
          </div>

          <div className="space-y-1">
            <h2 className="text-[26px] font-semibold text-white tracking-tight">Get started</h2>
            <p className="text-[13px] text-[#8c93b0] font-medium">Create a free account in under a minute.</p>
          </div>

          <div className="space-y-5">
            <GoogleButton label="Continue with Google" variant="dark" />

            <div className="flex items-center gap-3 py-1">
              <div className="flex-grow h-px bg-white/[0.06]" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#454c70] whitespace-nowrap">
                Or
              </span>
              <div className="flex-grow h-px bg-white/[0.06]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={goRegister}
                className="group h-11 inline-flex items-center justify-center gap-2 rounded-xl font-bold text-white text-sm tracking-wide bg-[#3b82f6] hover:bg-[#2563eb] transition-all"
              >
                Create account
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>
              <button
                type="button"
                onClick={goLogin}
                className="h-11 inline-flex items-center justify-center rounded-xl font-semibold text-sm tracking-wide border border-white/[0.08] bg-[#0b1329]/50 text-white hover:bg-[#0b1329]/80 transition-colors"
              >
                Sign in
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => navigate("/download")}
              className="w-full h-11 inline-flex items-center justify-center rounded-xl font-semibold text-sm tracking-wide border border-[#3b82f6]/30 bg-[#3b82f6]/5 text-[#3b82f6] hover:bg-[#3b82f6]/10 transition-colors mt-1"
            >
              Get Mobile App
            </button>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-[#8c93b0] pt-2 border-t border-white/[0.04]">
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-emerald" /> Free forever
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-emerald" /> No credit card
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-emerald" /> Works offline
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-emerald" /> iOS · Android · Web
              </li>
            </ul>
          </div>

          {/* Footer Links */}
          <div className="text-center pt-2">
            <p className="text-[11px] text-[#454c70] leading-normal">
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline hover:text-[#8c93b0]">Terms of Service</a> and{" "}
              <a href="/privacy" className="underline hover:text-[#8c93b0]">Privacy Policy</a>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

function MarketingPoint({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6]">
        {icon}
      </span>
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-white">{title}</p>
        <p className="text-[11px] text-[#8c93b0] leading-relaxed">{copy}</p>
      </div>
    </li>
  );
}
