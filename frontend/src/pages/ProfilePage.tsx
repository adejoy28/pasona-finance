import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  ChevronRight,
  Globe,
  Lock,
  LogOut,
  Mail,
  Pencil,
  Settings as SettingsIcon,
  ShieldAlert,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
  User as UserIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMe, invalidateMe } from "@/hooks/use-me";
import { auth as authApi, ApiError } from "@/lib/api";
import { notify } from "@/hooks/use-toast";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";
import { FinanceNavbar } from "@/components/finance/Navbar";
import { getUserInitials } from "@/components/finance/ScreenHeader";
import { countQueuedTransactions } from "@/lib/offline/queue";

const COMMON_TIMEZONES = [
  "Africa/Lagos",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Nairobi",
  "Africa/Accra",
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Tokyo",
];

/**
 * Profile Screen (Addendum A):
 * - Initials avatar, Name, Nickname, Email (read-only), Time zone
 * - "Go to" list: Settings, Categories, Import history, Help and legal
 * - Sign out & Delete account with ConfirmDestructiveDialog
 * - Back link to previous screen
 */
export function ProfilePage() {
  const navigate = useNavigate();
  const { data: user } = useMe();

  const [nickname, setNickname] = useState(
    () => localStorage.getItem("pasona.nickname") || ""
  );
  const [timeZone, setTimeZone] = useState(
    () =>
      user?.timezone ||
      (typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "Africa/Lagos")
  );
  const [editingNickname, setEditingNickname] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    document.title = "Profile — Pasona";
    let active = true;
    async function checkPending() {
      let count = 0;
      try {
        count += await countQueuedTransactions();
      } catch {
        // ignore
      }
      try {
        const q = JSON.parse(localStorage.getItem("pasona.mutation_queue") || "[]");
        if (Array.isArray(q)) count += q.length;
      } catch {
        // ignore
      }
      if (active) setPendingCount(count);
    }
    void checkPending();
    return () => {
      active = false;
    };
  }, []);

  const handleSaveNickname = (val: string) => {
    setNickname(val);
    localStorage.setItem("pasona.nickname", val.trim());
    setEditingNickname(false);
    notify.success("Nickname saved");
  };

  const handleTimeZoneChange = (tz: string) => {
    setTimeZone(tz);
    localStorage.setItem("pasona.timezone", tz);
    notify.success(`Time zone updated to ${tz}`);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      invalidateMe();
      void navigate("/login");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      invalidateMe();
      notify.success("Your account has been deleted.");
      void navigate("/login");
    } catch (err) {
      notify.error(
        err instanceof ApiError
          ? err.message
          : "Unable to delete your account. Please try again."
      );
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const initials = getUserInitials(user?.name);

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-32 text-[var(--ink)]">
      {/* Top Header with Back Button */}
      <header className="sticky top-0 z-40 bg-[var(--nav-bg,#0B1434)] pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 px-6 shadow-sm border-b border-white/5 text-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white transition-colors cursor-pointer py-1 px-2 -ml-2 rounded-lg hover:bg-white/10"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <h1 className="text-base font-bold tracking-tight text-white">Profile</h1>
          <div className="w-12" aria-hidden="true" />
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
        {/* User Card */}
        <section className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-5 shadow-xs flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary,#1F5BFF)] text-white font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-[var(--ink)] truncate">
              {user?.name || "User"}
            </h2>
            {nickname && (
              <p className="text-xs font-semibold text-[var(--primary)] truncate">
                "{nickname}"
              </p>
            )}
            <p className="text-xs text-[var(--muted)] truncate mt-0.5">
              {user?.email || ""}
            </p>
          </div>
        </section>

        {/* Profile Details */}
        <section className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] overflow-hidden divide-y divide-[var(--line)] shadow-xs">
          <div className="p-3.5 bg-[var(--surface-2)]">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Account Details
            </span>
          </div>

          {/* Name */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <UserIcon size={17} className="text-[var(--muted)] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--ink)]">Full Name</p>
                <p className="text-xs text-[var(--muted)] truncate">{user?.name || "Not set"}</p>
              </div>
            </div>
          </div>

          {/* Nickname */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Sparkles size={17} className="text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--ink)]">Nickname</p>
                {editingNickname ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveNickname(nickname);
                    }}
                    className="flex items-center gap-2 mt-1"
                  >
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Enter nickname"
                      className="bg-[var(--bg)] border border-[var(--line)] rounded-lg px-2.5 py-1 text-xs text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingNickname(false)}
                      className="text-xs text-[var(--muted)] hover:underline cursor-pointer"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-[var(--muted)] truncate">
                    {nickname || "None set"}
                  </p>
                )}
              </div>
            </div>
            {!editingNickname && (
              <button
                type="button"
                onClick={() => setEditingNickname(true)}
                className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Pencil size={13} />
                <span>Edit</span>
              </button>
            )}
          </div>

          {/* Email (Read Only) */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Mail size={17} className="text-[var(--muted)] shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-[var(--ink)]">Email Address</p>
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--chip)] px-1.5 py-0.5 text-[9.5px] font-bold text-[var(--muted)]">
                    <Lock size={10} /> Read only
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                  {user?.email || "No email available"}
                </p>
              </div>
            </div>
          </div>

          {/* Time Zone */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Globe size={17} className="text-[var(--muted)] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--ink)]">Time Zone</p>
                <p className="text-xs text-[var(--muted)] truncate">{timeZone}</p>
              </div>
            </div>
            <select
              value={timeZone}
              onChange={(e) => handleTimeZoneChange(e.target.value)}
              className="bg-[var(--chip)] border border-[var(--line)] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[var(--ink)] outline-none cursor-pointer"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* "Go to" Navigation List (Addendum A) */}
        <section className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] overflow-hidden divide-y divide-[var(--line)] shadow-xs">
          <div className="p-3.5 bg-[var(--surface-2)]">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Go To
            </span>
          </div>

          <Link
            to="/settings"
            className="p-4 flex items-center justify-between hover:bg-[var(--chip)] transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                <SettingsIcon size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--ink)]">Settings</p>
                <p className="text-[10.5px] text-[var(--muted)]">
                  Appearance, notifications & preferences
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[var(--muted)] group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/categories"
            className="p-4 flex items-center justify-between hover:bg-[var(--chip)] transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Tag size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--ink)]">Categories</p>
                <p className="text-[10.5px] text-[var(--muted)]">
                  Manage income and expense categories
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[var(--muted)] group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/import"
            className="p-4 flex items-center justify-between hover:bg-[var(--chip)] transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <UploadCloud size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--ink)]">Import History</p>
                <p className="text-[10.5px] text-[var(--muted)]">
                  Review statements and undo past imports
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[var(--muted)] group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/settings#help"
            className="p-4 flex items-center justify-between hover:bg-[var(--chip)] transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                <ShieldAlert size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--ink)]">Help & Legal</p>
                <p className="text-[10.5px] text-[var(--muted)]">
                  Privacy policy, terms & support
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[var(--muted)] group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </section>

        {/* Account Actions */}
        <section className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => setShowSignOutConfirm(true)}
            className="w-full p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[var(--chip)] transition-colors cursor-pointer shadow-xs"
          >
            <LogOut size={16} />
            <span>{signingOut ? "Signing out…" : "Sign Out"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-colors cursor-pointer"
          >
            <Trash2 size={16} />
            <span>Delete Account</span>
          </button>
        </section>
      </main>

      {/* Confirm Sign Out Dialog */}
      <ConfirmDestructiveDialog
        open={showSignOutConfirm}
        onOpenChange={setShowSignOutConfirm}
        title="Sign out?"
        description="Are you sure you want to sign out of your account on this device?"
        confirmLabel="Sign Out"
        pendingWarning={
          pendingCount > 0
            ? `You have ${pendingCount} unsynced change${pendingCount === 1 ? "" : "s"}. Signing out will discard offline changes that have not yet reached the server.`
            : undefined
        }
        onConfirm={handleSignOut}
      />

      {/* Confirm Delete Account Dialog (Type DELETE per Addendum G) */}
      <ConfirmDestructiveDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete account?"
        description="This will permanently delete your account, all connected accounts, transactions, and categories. This action cannot be undone."
        confirmKeyword="DELETE"
        confirmLabel="Delete Account"
        onConfirm={handleDeleteAccount}
      />

      <FinanceNavbar />
    </div>
  );
}
