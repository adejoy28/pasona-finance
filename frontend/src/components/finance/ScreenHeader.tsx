import React from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { NotificationBell } from "@/components/finance/NotificationBell";
import { useMe } from "@/hooks/use-me";

export interface ScreenHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  monthLabel?: string;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  canNextMonth?: boolean;
  showEyeToggle?: boolean;
  showBell?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Phase 2 unified screen header (.ph):
 * - Left: Title / greeting + inline or sub-row month switcher (< Month Year >)
 * - Right: Action controls (hide-balances eye button, notification bell with unread dot, mobile settings avatar)
 * - Follows compact rhythm (36px controls, high contrast, focus outline)
 */
export function ScreenHeader({
  title,
  subtitle,
  monthLabel,
  onPrevMonth,
  onNextMonth,
  canNextMonth = true,
  showEyeToggle = true,
  showBell = true,
  actions,
  className = "",
}: ScreenHeaderProps) {
  const { isRevealed, toggleReveal } = usePrivacyMode();
  const { data: user } = useMe();
  const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : "U";

  return (
    <header className={`flex items-center justify-between gap-3 mb-3.5 ${className}`}>
      <div className="min-w-0">
        <h1 className="font-display font-semibold text-xl sm:text-2xl text-[var(--ink)] tracking-tight leading-tight truncate">
          {title}
        </h1>
        {monthLabel ? (
          <div className="flex items-center gap-1.5 mt-0.5 text-[var(--muted)] font-bold text-[11px] uppercase tracking-wider">
            {onPrevMonth && (
              <button
                type="button"
                onClick={onPrevMonth}
                aria-label="Previous month"
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--chip)] transition-colors opacity-70 hover:opacity-100 cursor-pointer"
              >
                <ChevronLeft size={13} />
              </button>
            )}
            <span>{monthLabel}</span>
            {onNextMonth && (
              <button
                type="button"
                onClick={onNextMonth}
                disabled={!canNextMonth}
                aria-label="Next month"
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--chip)] transition-colors opacity-70 hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        ) : subtitle ? (
          <div className="text-[11px] font-semibold text-[var(--muted)] mt-0.5">
            {subtitle}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {showEyeToggle && (
          <button
            type="button"
            onClick={toggleReveal}
            aria-label={isRevealed ? "Hide balances" : "Reveal balances"}
            title={isRevealed ? "Hide balances" : "Reveal balances"}
            className="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] flex items-center justify-center transition-colors hover:bg-[var(--chip)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}

        {showBell && <NotificationBell />}

        {actions}

        {/* Mobile-only avatar leading to /settings */}
        <Link
          to="/settings"
          aria-label="Settings"
          className="w-9 h-9 rounded-full bg-[var(--primary)] text-white font-bold text-xs flex items-center justify-center transition-transform active:scale-95 md:hidden"
        >
          {initial}
        </Link>
      </div>
    </header>
  );
}
