import { Link, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Plus,
  ReceiptText,
  CreditCard,
  Tag,
  User,
  LogOut,
  Settings as SettingsIcon,
  ChevronsUpDown,
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

const navItems = [
  { label: "Overview", short: "Home", href: "/dashboard", icon: LayoutDashboard, tour: undefined },
  { label: "History", short: "History", href: "/transactions", icon: ReceiptText, tour: "history-nav" },
  { label: "Accounts", short: "Accounts", href: "/accounts", icon: CreditCard, tour: "accounts-nav" },
  { label: "Categories", short: "Categories", href: "/categories", icon: Tag, tour: "categories-nav" },
] as const;

export function FinanceNavbar() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const { data: user } = useMe();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const handleSignOut = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // ignore
    } finally {
      invalidateMe();
      void navigate("/login");
    }
  };

  // Tag the body while the app nav is mounted so global CSS can offset
  // page content for the desktop sidebar (auth/404 pages stay full-width).
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("has-app-nav");
    return () => document.body.classList.remove("has-app-nav");
  }, []);


  return (
    <>
      {/* ===== Desktop sidebar (md+) ===== */}
      <aside
        aria-label="Primary"
        className="pf-side-nav hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 md:flex-col md:border-r md:border-border/60 md:bg-card/70 md:backdrop-blur-xl md:px-5 md:py-7 z-40"
      >
        <Link to="/dashboard" className="flex items-center gap-3 px-2 mb-10 group">
          <img src="/img/brand-logo.png" alt="Pasona" className="h-9 w-9 rounded-xl shadow-sm" />
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            Pasona
          </span>
        </Link>

        <p className="px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground/70 mb-3">
          Workspace
        </p>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                data-tour-target={item.tour}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-[var(--navy-900)] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-[oklch(0.18_0.04_258_/_4%)]",
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2.2 : 1.8}
                  className={active ? "text-white" : "text-muted-foreground group-hover:text-foreground"}
                />
                <span className="tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          to="/transactions/add"
          data-tour-target="add-transaction"
          className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-semibold text-background tracking-tight transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
        >
          <Plus size={16} strokeWidth={2.5} />
          New transaction
        </Link>

        <div className="mt-auto flex flex-col gap-2 pt-6 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100/50 transition-colors text-left outline-none border border-transparent hover:border-border/50">
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <User size={18} className="text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || ""}</p>
                </div>
                <ChevronsUpDown size={16} className="text-slate-400 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/60 shadow-lg">
              <DropdownMenuItem onClick={() => navigate("/settings")} className="rounded-lg cursor-pointer py-2 text-sm font-medium">
                <SettingsIcon size={16} className="mr-2 text-slate-500" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void handleSignOut()} className="rounded-lg cursor-pointer py-2 text-sm font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                <LogOut size={16} className="mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="px-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/60 text-center">
            v1.0 • Pasona Finance
          </div>
        </div>
      </aside>

      {/* ===== Mobile bottom nav (< md) ===== */}
      <nav
        aria-label="Primary"
        className="pf-bottom-nav fixed bottom-0 left-0 right-0 z-50 md:hidden"
      >
        <div className="mx-auto max-w-md px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <div className="relative flex items-center justify-between gap-0.5 rounded-2xl border border-border/60 bg-card/85 px-2 py-1.5 backdrop-blur-xl card-shadow">
            {navItems.slice(0, 2).map((item) => (
              <NavPill key={item.href} item={item} active={isActive(item.href)} />
            ))}

            <Link
              to="/transactions/add"
              data-tour-target="add-transaction"
              className="relative -top-5 flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-[var(--navy-900)] text-white shadow-lg shadow-[oklch(0.17_0.06_262_/_30%)] transition-all active:scale-95 mx-1"
              aria-label="Add transaction"
            >
              <Plus size={24} strokeWidth={2.4} />
            </Link>

            {navItems.slice(2).map((item) => (
              <NavPill key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </div>
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
      className={cn(
        "relative flex flex-1 min-w-0 h-12 flex-col items-center justify-center rounded-xl transition-colors duration-200 px-1",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon size={19} strokeWidth={active ? 2.3 : 1.8} className="shrink-0" />
      <span
        className={cn(
          "mt-0.5 text-[9px] font-medium uppercase tracking-normal truncate max-w-full text-center leading-none",
          active ? "text-foreground" : "text-muted-foreground/70",
        )}
      >
        {item.short}
      </span>
      {active && (
        <motion.div
          layoutId="active-nav-pill"
          className="absolute -bottom-0.5 left-1/2 h-1 w-1 rounded-full bg-foreground"
          style={{ x: "-50%" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  );
}
