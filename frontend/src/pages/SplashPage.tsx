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
    <div className="relative min-h-[100dvh] bg-[var(--navy-900)] text-white overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(60%_50%_at_18%_12%,oklch(0.42_0.12_250/0.35),transparent_60%),radial-gradient(50%_50%_at_85%_90%,oklch(0.55_0.13_248/0.18),transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <div className="relative z-10 flex min-h-[100dvh] flex-col lg:flex-row">
        <aside className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16">
          <Brand />

          <div className="space-y-7 max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-indigo-300">
              <Sparkles size={12} />
              New in Pasona
            </span>
            <h1 className="font-display text-5xl xl:text-6xl font-semibold tracking-tight leading-[1.02]">
              Money, organised.
              <br />
              <span className="bg-gradient-to-r from-indigo-300 to-sky-300 bg-clip-text text-transparent">
                Calm, not cluttered.
              </span>
            </h1>
            <p className="text-base text-slate-300/90 leading-relaxed max-w-sm">
              Track every account, every transaction, every category — in one
              quiet dashboard. Built for the way your money actually moves.
            </p>

            <ul className="space-y-3 pt-2">
              <MarketingPoint
                icon={<LineChart size={16} />}
                title="Live dashboards"
                copy="See net worth, spend, and budgets update as transactions sync."
              />
              <MarketingPoint
                icon={<PiggyBank size={16} />}
                title="Accounts that mean something"
                copy="Cash, cards, savings, loans — grouped the way you think about them."
              />
              <MarketingPoint
                icon={<ShieldCheck size={16} />}
                title="Private by default"
                copy="Your data is yours. End-to-end encrypted sync, no ad tracking, ever."
              />
            </ul>
          </div>

          <p className="text-[11px] text-slate-500">
            Trusted by people who'd rather not think about their bank account.
          </p>
        </aside>

        <main className="flex-1 flex items-center justify-center px-6 py-12 lg:py-16">
          <div className="w-full max-w-[24rem] space-y-7">
            <div className="lg:hidden flex justify-center">
              <Brand />
            </div>

            <div className="space-y-3 text-center lg:text-left">
              <h2 className="font-display text-3xl sm:text-[2rem] font-semibold tracking-tight leading-tight">
                Get started
              </h2>
              <p className="text-sm text-slate-400">
                Create a free account in under a minute.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm px-6 py-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] relative overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[1.5rem] bg-gradient-to-b from-white/[0.05] to-transparent"
              />
              <div className="relative space-y-5">
                <GoogleButton label="Continue with Google" />

                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-slate-700/60" />
                  <span className="flex-shrink mx-3 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
                    or
                  </span>
                  <div className="flex-grow border-t border-slate-700/60" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={goRegister}
                    className="group h-12 inline-flex items-center justify-center gap-2 rounded-xl font-bold text-white text-sm tracking-wide bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-[0_18px_40px_-18px_rgba(99,102,241,0.9)] hover:opacity-95 transition-all"
                  >
                    Create account
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={goLogin}
                    className="h-12 inline-flex items-center justify-center rounded-xl font-bold text-sm tracking-wide border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] transition-colors"
                  >
                    Sign in
                  </button>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-slate-400 pt-1">
                  <li className="flex items-center gap-1.5">
                    <Check size={12} className="text-emerald-400" /> Free forever
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check size={12} className="text-emerald-400" /> No credit card
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check size={12} className="text-emerald-400" /> Works offline
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check size={12} className="text-emerald-400" /> iOS · Android · Web
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              By continuing you agree to our{" "}
              <a
                href="/privacy"
                className="text-slate-400 hover:text-white underline-offset-2 hover:underline"
              >
                Terms
              </a>
              <span className="mx-1.5">·</span>
              <a
                href="/privacy"
                className="text-slate-400 hover:text-white underline-offset-2 hover:underline"
              >
                Privacy
              </a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber to-amber-deep shadow-[0_8px_20px_rgba(217,142,42,0.4)] flex items-center justify-center">
        <img src="/img/brand-logo.png" alt="Pasona" className="w-5 h-5" />
      </div>
      <span className="text-lg font-display font-bold tracking-tight text-white">
        Pasona<span className="text-indigo-400">.</span>
      </span>
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
      <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-300">
        {icon}
      </span>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-400 leading-relaxed">{copy}</p>
      </div>
    </li>
  );
}
