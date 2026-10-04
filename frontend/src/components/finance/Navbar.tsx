import { Link, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Plus,
  ReceiptText,
  CreditCard,
  Target,
  Settings as SettingsIcon,
  ChevronsUpDown,
  LogOut,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMe, invalidateMe } from "@/hooks/use-me";
import { auth as authApi } from "@/lib/api";
import { notify } from "@/hooks/use-toast";

import { getUserInitials } from "@/components/finance/ScreenHeader";

const navItems = [
  { label: "Home", short: "Home", href: "/dashboard", icon: LayoutDashboard, tour: undefined },
  { label: "History", short: "History", href: "/transactions", icon: ReceiptText, tour: "history-nav" },
  { label: "Budgets", short: "Budgets", href: "/categories", icon: Target, tour: "categories-nav" },
  { label: "Accounts", short: "Accounts", href: "/accounts", icon: CreditCard, tour: "accounts-nav" },
  { label: "Settings", short: "Settings", href: "/settings", icon: SettingsIcon, tour: "settings-nav" },
] as const;

export function FinanceNavbar() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const { data: user } = useMe();

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const handleSignOut = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      invalidateMe();
      void navigate("/login");
    }
  };

  // Tag body while app nav is mounted so desktop layout offsets for the sidebar
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("has-app-nav");
    return () => document.body.classList.remove("has-app-nav");
  }, []);

  const initial = getUserInitials(user?.name, user?.email);

  return (
    <>
      {/* ===== Desktop sidebar (≥ 720px) ===== */}
      <aside
        aria-label="Primary"
        className="pf-side-nav hidden fixed inset-y-0 left-0 w-[clamp(188px,17cqw,252px)] flex-col z-40 bg-[var(--nav-bg,#0B1434)] text-white p-4"
      >
        {/* Brand logo */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 px-2 py-1 mb-5 group outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-lg"
        >
          <img src="/img/brand-logo.png" alt="Pasona" className="h-7 w-7 rounded-lg shadow-sm" />
          <span className="font-display text-xl font-bold tracking-tight text-white">
            pasona
          </span>
        </Link>

        {/* 5 Main navigation items */}
        <nav className="flex flex-col gap-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                data-tour-target={item.tour}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                  active
                    ? "bg-[var(--nav-active,rgba(255,255,255,0.12))] text-white"
                    : "text-white/70 hover:text-white hover:bg-white/[0.07]"
                )}
              >
                <Icon
                  size={17}
                  strokeWidth={active ? 2.3 : 1.9}
                  className={active ? "text-white" : "text-white/70 group-hover:text-white"}
                />
                <span className="tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Add transaction button */}
        <Link
          to="/transactions/add"
          data-tour-target="add-transaction"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[var(--add,#E8A317)] text-[var(--add-ink,#2B1D00)] py-2.5 px-3 text-xs font-extrabold tracking-tight transition-all duration-150 hover:brightness-105 active:scale-[0.98] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Plus size={15} strokeWidth={2.8} />
          <span>Add transaction</span>
        </Link>

        {/* Ask Mary button (Addendum A & F) */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("pasona:open-mary"));
          }}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-white py-2 px-3 text-xs font-bold tracking-tight transition-all duration-150 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-white/60 cursor-pointer"
        >
          <Sparkles size={14} className="text-amber-400" />
          <span>Ask Mary</span>
        </button>

        {/* Sidebar user block: name on 1 line, email on 1 line with ellipsis and tooltip */}
        <div className="mt-auto pt-4 border-t border-white/10">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center gap-2.5 p-1.5 rounded-xl text-left transition-colors hover:bg-white/[0.08] outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {initial}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <b className="block text-xs font-bold text-white truncate whitespace-nowrap leading-tight">
                    {user?.name || "User"}
                  </b>
                  <span
                    className="block text-[10.5px] text-white/65 truncate whitespace-nowrap leading-tight mt-0.5"
                    title={user?.email || ""}
                  >
                    {user?.email || ""}
                  </span>
                </div>
                <ChevronsUpDown size={14} className="text-white/40 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              sideOffset={8}
              className="w-48 rounded-xl border border-white/10 bg-[var(--surface)] text-[var(--ink)] shadow-xl p-1 z-50"
            >
              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="rounded-lg cursor-pointer py-2 text-xs font-semibold"
              >
                <User size={14} className="mr-2 text-[var(--muted)]" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/settings")}
                className="rounded-lg cursor-pointer py-2 text-xs font-semibold"
              >
                <SettingsIcon size={14} className="mr-2 text-[var(--muted)]" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[var(--line)]" />
              <DropdownMenuItem
                onClick={() => void handleSignOut()}
                className="rounded-lg cursor-pointer py-2 text-xs font-semibold text-rose-500 focus:text-rose-500 focus:bg-rose-50/10"
              >
                <LogOut size={14} className="mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ===== Mobile bottom tab bar (< 720px): 5-column grid (Addendum A) ===== */}
      <nav
        aria-label="Primary"
        className="pf-bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)] border-t border-[var(--line)] pb-[max(0.25rem,env(safe-area-inset-bottom))]"
      >
        <div className="max-w-md mx-auto px-1.5 py-1 grid grid-cols-5 items-center">
          {/* 1. Home */}
          <NavPill item={navItems[0]} active={isActive(navItems[0].href)} />

          {/* 2. History */}
          <NavPill item={navItems[1]} active={isActive(navItems[1].href)} />

          {/* 3. Centered Add Button */}
          <div className="flex justify-center py-0.5">
            <Link
              to="/transactions/add"
              data-tour-target="add-transaction"
              aria-label="Add transaction"
              className="w-10 h-10 rounded-xl bg-[var(--add,#E8A317)] text-[var(--add-ink,#2B1D00)] flex items-center justify-center shadow-md active:scale-95 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              <Plus size={22} strokeWidth={2.6} />
            </Link>
          </div>

          {/* 4. Budgets */}
          <NavPill item={navItems[2]} active={isActive(navItems[2].href)} />

          {/* 5. Accounts */}
          <NavPill item={navItems[3]} active={isActive(navItems[3].href)} />
        </div>
      </nav>
    </>
  );
}

function NavPill({
  item,
  active,
}: {
  item: (typeof navItems)[number];
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      data-tour-target={item.tour}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] min-h-[44px]",
        active
          ? "text-[var(--accent,#1B2D6B)] font-bold"
          : "text-[var(--muted)] hover:text-[var(--ink)]"
      )}
    >
      <Icon size={19} strokeWidth={active ? 2.4 : 1.8} className="shrink-0" />
      <span className="text-[9.5px] tracking-tight mt-0.5 text-center leading-none">
        {item.short}
      </span>
    </Link>
  );
}
