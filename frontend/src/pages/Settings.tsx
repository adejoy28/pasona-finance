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

  const toggleReminder = async (next: boolean) => {
    const prev = reminderEnabled;
    setReminderEnabled(next);
    try {
      if (!next) {
        if (isNative) {
          await cancelAlarm(REMINDER_NOTIFICATION_ID);
        }
        await authApi.updateProfile({ reminder_time: null, timezone: browserTz });
        invalidateMe();
        popup.success("Daily reminder disabled");
        return;
      }

      if (isNative) {
        if (permission?.display !== "granted") {
          const status = await requestPermission();
          if (status.display !== "granted") {
            setReminderEnabled(false);
            popup.error("Notification permission denied. Enable it in system settings.");
            return;
          }
        }
        const at = nextOccurrenceOfTime(reminderTime);
        await scheduleAlarm({
          id: REMINDER_NOTIFICATION_ID,
          title: "Time to log your expenses",
          body: `Daily reminder for ${reminderTime}. Tap to record today's spending.`,
          at,
          repeats: true,
        });
      }
      await authApi.updateProfile({ reminder_time: reminderTime, timezone: browserTz });
      invalidateMe();
      popup.success(isNative ? `Reminder set for ${reminderTime}` : "Daily reminder enabled");
    } catch {
      setReminderEnabled(prev);
      popup.error("Could not toggle reminder");
    }
  };

  const handleTimeChange = async (next: string) => {
    const prev = reminderTime;
    setReminderTime(next);
    if (seededFromServer.current) {
      try {
        await authApi.updateProfile({ reminder_time: next, timezone: browserTz });
        invalidateMe();
      } catch {
        setReminderTime(prev);
        popup.error("Could not save reminder time");
        return;
      }
    }
    if (!reminderEnabled || !isNative) return;
    try {
      const at = nextOccurrenceOfTime(next);
      await scheduleAlarm({
        id: REMINDER_NOTIFICATION_ID,
        title: "Time to log your expenses",
        body: `Daily reminder for ${next}. Tap to record today's spending.`,
        at,
        repeats: true,
      });
      popup.success(`Reminder rescheduled to ${next}`);
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
          const email = user?.email;
          if (!email) {
            popup.error("No account on this device. Sign in again.");
          } else {
            try {
              const biometricToken = await authApi.createBiometricToken();
              const saved = await saveBiometricCredentials(email, biometricToken);
              if (saved) {
                setBiometricEnabled(true);
                popup.success("Biometric sign-in enabled");
              } else {
                popup.error("Could not save biometric credentials");
              }
            } catch {
              popup.error("Could not issue biometric credentials. Try again.");
            }
          }
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

        {/* Notifications */}
        <section className="bg-white rounded-2xl card-shadow border border-slate-50 overflow-hidden divide-y divide-slate-50">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Bell size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Daily Reminder</p>
                <p className="text-[10px] text-slate-400 uppercase">
                  {reminderEnabled ? `Active at ${reminderTime}` : "Off"}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reminderEnabled}
              onClick={() => void toggleReminder(!reminderEnabled)}
              className={
                "w-12 h-6 rounded-full p-1 transition-colors relative " +
                (reminderEnabled ? "bg-blue-600" : "bg-slate-200")
              }
            >
              <div
                className={
                  "w-4 h-4 rounded-full bg-white transition-transform " +
                  (reminderEnabled ? "translate-x-6" : "translate-x-0")
                }
              />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Reminder time
            </span>
            <input
              type="time"
              disabled={!reminderEnabled}
              value={reminderTime}
              onChange={(e) => void handleTimeChange(e.target.value)}
              className="bg-slate-50 p-2.5 rounded-xl font-black text-blue-600 outline-none text-sm disabled:opacity-50"
            />
          </div>

          {!isNative && (
            <div className="p-4 space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {reminderEnabled
                  ? `Email reminder active at ${reminderTime}.`
                  : "Email reminder is off."}
              </p>

              {push.isSupported && (
                <div className="flex items-center justify-between gap-4 pt-2">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Push Notifications</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      {!push.isConfigured
                        ? "Not configured on server"
                        : push.isSubscribed
                          ? "Enabled — you'll receive push alerts"
                          : "Send reminders as push notifications"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {push.isConfigured && push.isSubscribed && (
                      <button
                        type="button"
                        disabled={push.subscribing}
                        onClick={() => void push.sendTestPush()}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider disabled:opacity-50"
                      >
                        Send test
                      </button>
                    )}
                    {push.isConfigured && (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={push.isSubscribed}
                        disabled={push.subscribing}
                        onClick={() => {
                          if (push.isSubscribed) {
                            push.unsubscribe();
                          } else {
                            push.subscribe();
                          }
                        }}
                        className={
                          "w-12 h-6 rounded-full p-1 transition-colors relative shrink-0 disabled:opacity-50 " +
                          (push.isSubscribed ? "bg-blue-600" : "bg-slate-200")
                        }
                      >
                        <div
                          className={
                            "w-4 h-4 rounded-full bg-white transition-transform " +
                            (push.isSubscribed ? "translate-x-6" : "translate-x-0")
                          }
                        />
                      </button>
                    )}
                  </div>
                </div>
              )}
              {push.error && <p className="text-xs font-semibold text-red-600">{push.error}</p>}
            </div>
          )}
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
