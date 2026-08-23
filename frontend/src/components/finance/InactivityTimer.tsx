import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { auth as authApi } from "@/lib/api";
import { clearAuthToken } from "@/lib/auth/token";
import { LogOut, AlertTriangle, Fingerprint, Lock } from "lucide-react";
import { hasBiometricCredentials, verifyBiometricIdentity, checkBiometricAvailability } from "@/lib/auth/biometric";

const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
const COUNTDOWN_SECONDS = 15;

export function InactivityTimer() {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [isCheckingBiometrics, setIsCheckingBiometrics] = useState(true);
  
  const lastActivityRef = useRef<number>(Date.now());
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const avail = await checkBiometricAvailability();
        if (avail.available) {
          const has = await hasBiometricCredentials();
          setHasBiometrics(has);
        }
      } finally {
        setIsCheckingBiometrics(false);
      }
    })();
  }, []);

  const performLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors on logout
      clearAuthToken();
    }
    navigate("/login");
  }, [navigate]);

  const lockApp = useCallback(() => {
    setShowWarning(false);
    setIsLocked(true);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const handleInactivityTimeout = useCallback(() => {
    if (hasBiometrics) {
      lockApp();
    } else {
      void performLogout();
    }
  }, [hasBiometrics, lockApp, performLogout]);

  const resetTimer = useCallback(() => {
    if (showWarning || isLocked) return;

    lastActivityRef.current = Date.now();
    localStorage.setItem("last_activity", lastActivityRef.current.toString());

    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    warningTimerRef.current = setTimeout(() => {
      if (hasBiometrics) {
        lockApp();
      } else {
        setShowWarning(true);
        setCountdown(COUNTDOWN_SECONDS);
      }
    }, INACTIVITY_LIMIT_MS);
  }, [showWarning, isLocked, hasBiometrics, lockApp]);

  useEffect(() => {
    if (isCheckingBiometrics) return; // Wait until biometrics check is complete

    const storedActivity = localStorage.getItem("last_activity");
    if (storedActivity) {
      const timeSinceLast = Date.now() - parseInt(storedActivity, 10);
      if (timeSinceLast >= INACTIVITY_LIMIT_MS) {
        if (hasBiometrics) {
          setIsLocked(true);
        } else {
          void performLogout();
          return;
        }
      }
    }

    resetTimer();

    const events = ["mousemove", "keydown", "scroll", "touchstart", "click"];
    const handleActivity = () => resetTimer();

    events.forEach((e) => window.addEventListener(e, handleActivity));

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [resetTimer, performLogout, hasBiometrics, isCheckingBiometrics]);

  useEffect(() => {
    if (showWarning && !isLocked) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            handleInactivityTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarning, isLocked, handleInactivityTimeout]);

  const handleStaySignedIn = () => {
    setShowWarning(false);
    resetTimer();
  };

  const unlockApp = async () => {
    const success = await verifyBiometricIdentity();
    if (success) {
      setIsLocked(false);
      resetTimer();
    }
  };

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">App Locked</h2>
          <p className="text-sm font-medium text-slate-500">
            Pasona was locked due to inactivity to protect your data.
          </p>
          <div className="pt-4">
            <button
              onClick={unlockApp}
              className="w-full py-4 px-4 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-3 text-lg shadow-lg shadow-indigo-600/20"
            >
              <Fingerprint size={24} /> Unlock
            </button>
          </div>
          <button
            onClick={performLogout}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest pt-4"
          >
            Sign out instead
          </button>
        </div>
      </div>
    );
  }

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-2">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-xl font-black text-slate-900">Are you still there?</h2>
        <p className="text-sm font-medium text-slate-500">
          For your security, you will be automatically logged out due to inactivity in{" "}
          <span className="font-bold text-rose-600">{countdown} seconds</span>.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleStaySignedIn}
            className="w-full py-3 px-4 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Keep me signed in
          </button>
          <button
            onClick={performLogout}
            className="w-full py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={16} /> Sign out now
          </button>
        </div>
      </div>
    </div>
  );
}
