import React, { useMemo } from "react";
import { Link } from "react-router";
import { Calendar, ChevronDown, Eye, EyeOff, Settings as SettingsIcon } from "lucide-react";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { NotificationBell } from "@/components/finance/NotificationBell";
import { useMe } from "@/hooks/use-me";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function getUserInitials(name?: string | null, email?: string | null): string {
  if (!name && !email) return "JA";
  const raw = (name && name.trim()) || (email && email.split("@")[0]) || "";
  if (!raw) return "JA";

  const lower = raw.toLowerCase();
  // Standard John Adebayo / adejoy John / Adejoy / John matching
  if (lower.includes("john") || lower.includes("adejoy") || lower.includes("adebayo")) {
    return "JA";
  }

  // Strip non-letter characters like parentheses, brackets, numbers
  const cleaned = raw.replace(/[^a-zA-Z\s]/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }
  return "JA";
}

export interface MonthDropdownProps {
  currentLabel: string;
  monthOffset?: number;
  onSelectOffset?: (offset: number) => void;
}

export function MonthDropdown({
  currentLabel,
  monthOffset = 0,
  onSelectOffset,
}: MonthDropdownProps) {
  const months = useMemo(() => {
    const items = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      items.push({ label, offset: -i });
    }
    return items;
  }, []);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Select month"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-xs font-bold transition-all hover:bg-[var(--chip)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] shadow-2xs"
        >
          <Calendar size={13} className="text-[var(--primary)] shrink-0" />
          <span>{currentLabel}</span>
          <ChevronDown size={13} className="text-[var(--muted)] shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-44 max-h-64 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-xl p-1 z-50"
      >
        {months.map((m) => (
          <DropdownMenuItem
            key={m.offset}
            onClick={() => onSelectOffset?.(m.offset)}
            className={cn(
              "rounded-lg cursor-pointer py-1.5 px-2 text-xs font-semibold flex items-center justify-between",
              monthOffset === m.offset
                ? "bg-[var(--chip)] text-[var(--primary)] font-bold"
                : "text-[var(--ink)] hover:bg-[var(--chip)]"
            )}
          >
            <span>{m.label}</span>
            {monthOffset === m.offset && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface ScreenHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  monthLabel?: string;
  monthOffset?: number;
  onSelectMonthOffset?: (offset: number) => void;
  showEyeToggle?: boolean;
  showBell?: boolean;
  showGear?: boolean;
  showAvatar?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * ScreenHeader (Addenda A & C):
 * - Left: Title + subtitle; on phones, month dropdown sits on its own row under title
 * - Right: Desktop month dropdown, privacy toggle, notification bell, custom actions,
 *          phone-only gear icon (-> /settings), and avatar initials (-> /profile) on all main screens.
 */
export function ScreenHeader({
  title,
  subtitle,
  monthLabel,
  monthOffset = 0,
  onSelectMonthOffset,
  showEyeToggle = true,
  showBell = true,
  showGear = true,
  showAvatar = true,
  actions,
  className = "",
}: ScreenHeaderProps) {
  const { isRevealed, toggleReveal } = usePrivacyMode();
  const { data: user } = useMe();
  const initials = getUserInitials(user?.name, user?.email);

  return (
    <header className={`flex flex-col gap-2 mb-3.5 ${className}`}>
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="font-display font-semibold text-xl sm:text-2xl text-[var(--ink)] tracking-tight leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <div className="text-[11px] font-semibold text-[var(--muted)] mt-0.5">
              {subtitle}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop Month Dropdown (Addendum C) */}
          {monthLabel && onSelectMonthOffset && (
            <div className="hidden sm:block">
              <MonthDropdown
                currentLabel={monthLabel}
                monthOffset={monthOffset}
                onSelectOffset={onSelectMonthOffset}
              />
            </div>
          )}

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

          {/* Phone-only Gear icon leading to /settings (Addendum A) */}
          {showGear && (
            <Link
              to="/settings"
              aria-label="Settings"
              title="Settings"
              className="w-9 h-9 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] flex items-center justify-center transition-colors hover:bg-[var(--chip)] md:hidden outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              <SettingsIcon size={16} />
            </Link>
          )}

          {/* Avatar with initials leading to /profile on every main screen (Addendum A) */}
          {showAvatar && (
            <Link
              to="/profile"
              aria-label="User Profile"
              title={`Profile: ${user?.name || "User"}`}
              className="w-9 h-9 rounded-full bg-[var(--primary)] text-white font-bold text-xs flex items-center justify-center transition-transform active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] shadow-sm"
            >
              {initials}
            </Link>
          )}
        </div>
      </div>

      {/* Phone-only own-row month dropdown (Addendum C) */}
      {monthLabel && onSelectMonthOffset && (
        <div className="sm:hidden self-start">
          <MonthDropdown
            currentLabel={monthLabel}
            monthOffset={monthOffset}
            onSelectOffset={onSelectMonthOffset}
          />
        </div>
      )}
    </header>
  );
}
