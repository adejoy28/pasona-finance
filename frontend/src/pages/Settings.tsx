import { Link, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  ChevronRight,
  Download,
  Fingerprint,
  Globe,
  LogOut,
  Pencil,
  Shield,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { usePopup } from "@/components/ui/popup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FinanceNavbar } from "@/components/finance/Navbar";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currencies";
import { ApiError, auth as authApi } from "@/lib/api";
import { nextOccurrenceOfTime, useLocalNotifications } from "@/hooks/use-local-notifications";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useMe, invalidateMe } from "@/hooks/use-me";
import {
  checkBiometricAvailability,
  hasBiometricCredentials,
  saveBiometricCredentials,
  deleteBiometricCredentials,
  verifyBiometricIdentity,
} from "@/lib/auth/biometric";

const REMINDER_NOTIFICATION_ID = 1001;
const REMINDER_STORAGE_KEY = "pasona.reminder.time";
const REMINDER_ENABLED_KEY = "pasona.reminder.enabled";

function readStoredTime(): string {
  if (typeof localStorage === "undefined") return "21:00";
  return localStorage.getItem(REMINDER_STORAGE_KEY) ?? "21:00";
}

function readStoredEnabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(REMINDER_ENABLED_KEY) === "1";
}

export function Settings() {
  const navigate = useNavigate();
  const popup = usePopup();
  const [reminderTime, setReminderTime] = useState(readStoredTime);
  const [reminderEnabled, setReminderEnabled] = useState(readStoredEnabled);
  const [signingOut, setSigningOut] = useState(false);

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  useEffect(() => {
    document.title = "Settings — Pasona";
    (async () => {
      const avail = await checkBiometricAvailability();
      setBiometricAvailable(avail.available);
      if (avail.available) {
        const has = await hasBiometricCredentials();
        setBiometricEnabled(has);
      }
    })();
  }, []);

  const userQuery = useMe();
  const user = userQuery.data;
  const [currency, setCurrency] = useState(user?.currency ?? DEFAULT_CURRENCY);
  const browserTz =
    typeof Intl?.DateTimeFormat === "function"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : undefined;

  const seededFromServer = useRef(false);

  const { isNative, permission, requesting, requestPermission, scheduleAlarm, cancelAlarm } =
    useLocalNotifications();
  const push = usePushNotifications();

  useEffect(() => {
    if (seededFromServer.current) return;
    if (!user?.reminder_time) return;
    seededFromServer.current = true;
    setReminderTime(user.reminder_time);
  }, [user?.reminder_time]);

  useEffect(() => {
    if (!user?.currency) return;
    setCurrency(user.currency);
  }, [user?.currency]);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(REMINDER_STORAGE_KEY, reminderTime);
  }, [reminderTime]);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(REMINDER_ENABLED_KEY, reminderEnabled ? "1" : "0");
  }, [reminderEnabled]);

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);
    try {
      await authApi.updateProfile({ currency: newCurrency });
      invalidateMe();
      popup.success("Currency updated");
    } catch {
      popup.error("Failed to save currency preference");
    }
  };

  const handleReminderTimeChange = async (newTime: string) => {
    setReminderTime(newTime);
    try {
      await authApi.updateProfile({ reminder_time: newTime, timezone: browserTz });
      invalidateMe();
    } catch {
      // Best-effort
    }
  };

  const handleBiometricToggle = async () => {
    if (biometricBusy) return;
    setBiometricBusy(true);
    try {
      if (biometricEnabled) {
        await deleteBiometricCredentials();
        setBiometricEnabled(false);
        popup.success("Biometric sign-in disabled");
      } else {
        const verified = await verifyBiometricIdentity();
        if (verified) {
          popup.info("Biometric verified. Sign in once with password to save credentials.");
        }
      }
    } catch {
      popup.error("Biometric operation failed");
    } finally {
      setBiometricBusy(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authApi.logout();
    } finally {
      invalidateMe();
      void navigate("/login");
    }
  };

  const [deletingAccount, setDeletingAccount] = useState(false);
  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await authApi.deleteAccount();
      invalidateMe();
      popup.success("Your account has been deleted.");
      void navigate("/login");
    } catch (err) {
      popup.error(
        err instanceof ApiError
          ? err.message
          : "Unable to delete your account. Please try again.",
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-white border-b border-slate-100 px-6 pt-10 pb-6 sticky top-0 z-30 card-shadow">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-400 font-medium">App preferences and account management</p>
      </header>

      <main className="p-6 space-y-6 max-w-lg mx-auto">
        {/* Profile Card */}
        <section className="bg-white p-5 rounded-2xl card-shadow border border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg shrink-0">
              {user?.name ? user.name[0].toUpperCase() : "P"}
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-900 text-sm truncate">{user?.name ?? "User"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email ?? ""}</p>
            </div>
          </div>
        </section>

        {/* Currency & Preferences */}
        <section className="bg-white rounded-2xl card-shadow border border-slate-50 overflow-hidden divide-y divide-slate-50">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-800">Display Currency</p>
                <p className="text-[10px] text-slate-400">Used for balances and totals</p>
              </div>
            </div>
            <div className="relative">
              <select
                value={currency}
                onChange={(e) => void handleCurrencyChange(e.target.value)}
                className="bg-slate-50 border-0 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 appearance-none pr-8 outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.intlCode} value={c.intlCode}>
                    {c.symbol} {c.intlCode}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <Link to="/categories" className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <Tag size={18} className="text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-800">Categories</p>
                <p className="text-[10px] text-slate-400">Manage expense and income tags</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </Link>

          <Link to="/import" className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <Download size={18} className="text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-800">Import Statements</p>
                <p className="text-[10px] text-slate-400">Batch upload bank CSV / PDF files</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </Link>
        </section>

        {/* Security & Biometrics */}
        <section className="bg-white rounded-2xl card-shadow border border-slate-50 overflow-hidden divide-y divide-slate-50">
          {biometricAvailable && (
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Fingerprint size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Biometric Sign In</p>
                  <p className="text-[10px] text-slate-400">Use Touch ID / Face ID</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleBiometricToggle}
                disabled={biometricBusy}
                className={
                  "w-12 h-6 rounded-full p-1 transition-colors relative " +
                  (biometricEnabled ? "bg-blue-600" : "bg-slate-200")
                }
              >
                <div
                  className={
                    "w-4 h-4 rounded-full bg-white transition-transform " +
                    (biometricEnabled ? "translate-x-6" : "translate-x-0")
                  }
                />
              </button>
            </div>
          )}

          <Link to="/privacy" className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-800">Privacy & Security</p>
                <p className="text-[10px] text-slate-400">How your data is stored and protected</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </Link>
        </section>

        {/* Account Actions */}
        <section className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full p-4 rounded-2xl bg-white border border-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors card-shadow"
          >
            <LogOut size={16} />
            {signingOut ? "Signing out…" : "Sign Out"}
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="w-full p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
              >
                <Trash2 size={16} />
                Delete Account
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base font-black text-rose-600">Delete account?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-slate-500">
                  This will permanently delete your account, all connected bank data, transactions, and categories. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row gap-2 justify-end">
                <AlertDialogCancel className="rounded-xl text-xs font-bold border-slate-200 mt-0">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white border-0"
                >
                  {deletingAccount ? "Deleting…" : "Delete Account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </main>

      <FinanceNavbar />
    </div>
  );
}
