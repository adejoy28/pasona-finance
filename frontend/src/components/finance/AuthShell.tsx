import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center px-6 py-16 sm:py-20">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 15% -10%, #2C3E86 0%, transparent 45%), radial-gradient(circle at 100% 10%, #1B2D6B 0%, transparent 40%), #0A1230",
        }}
      />
      <div className="relative w-full max-w-[24rem]">
        <div className="absolute left-0 top-0 inline-flex items-center gap-2.5 rounded-full bg-white/[0.06] border border-white/10 pl-2 pr-4 py-2">
          <img src="/img/brand-logo-dark.png" alt="Pasona" className="w-[26px] h-[26px]" />
          <span className="text-[14.5px] font-bold tracking-tight text-cream-50">
            pasona
          </span>
        </div>
        <div className="mb-4 pt-14 space-y-1.5">
          {subtitle && (
            <p className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-amber-soft">
              {subtitle}
            </p>
          )}
          <h1 className="text-[32px] leading-[1.15] tracking-[-0.01em] text-cream-50 font-display font-medium">
            {title}
          </h1>
        </div>
        <div className="relative rounded-[1.75rem] bg-gradient-to-b from-cream-50 to-cream-100 shadow-[0_30px_60px_-20px_rgba(10,18,48,0.55)] p-[30px_26px_26px] overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-navy-700 via-amber to-amber-soft"
          />
          <div className="space-y-5 text-ink">{children}</div>
        </div>
        {footer && <div className="mt-4 text-center space-y-2 text-xs">{footer}</div>}
      </div>
    </div>
  );
}

export const authInputClass =
  "peer w-full h-14 rounded-2xl border-[1.5px] border-cream-200 bg-cream-50 pl-[46px] pr-12 pt-5 pb-1.5 font-semibold text-[15.5px] text-ink outline-none transition-colors placeholder:text-transparent focus:border-navy-600 focus:shadow-[0_0_0_4px_rgba(44,62,134,0.12)]";

export const authLabelClass =
  "pointer-events-none absolute left-[46px] top-[18px] text-[15.5px] font-semibold text-ink-faint origin-top-left transition-all peer-focus:top-[9px] peer-focus:scale-[0.72] peer-focus:text-navy-700 peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-[9px] peer-[:not(:placeholder-shown)]:scale-[0.72] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:text-navy-700";

export const authButtonClass =
  "w-full h-14 rounded-2xl border-none bg-gradient-to-br from-navy-600 to-navy-800 text-white font-extrabold text-[16px] tracking-tight flex items-center justify-center gap-2 shadow-[0_14px_28px_-12px_rgba(24,36,89,0.55)] transition-all hover:shadow-[0_18px_32px_-12px_rgba(24,36,89,0.65)] active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_14px_28px_-12px_rgba(24,36,89,0.55)]";
