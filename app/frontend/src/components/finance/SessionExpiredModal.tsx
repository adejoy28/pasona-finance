import React, { useState, useEffect } from "react";
import { LogIn, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { auth as authApi } from "@/lib/api";
import { useMe, invalidateMe } from "@/hooks/use-me";
import { toast } from "@/hooks/use-toast";

/**
 * Non-destructive Session Re-Auth Modal (Phase 3):
 * - Renders upon 401 Unauthorized
 * - Allows the user to re-authenticate without losing current form inputs or navigating away
 * - Updates the token, announces auth-restored, and lets the user proceed
 */
export function SessionExpiredModal() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useMe();

  useEffect(() => {
    const handleReauth = () => {
      setOpen(true);
      setError(null);
      setPassword("");
    };

    const handleAuthRestored = () => {
      setOpen(false);
    };

    window.addEventListener("pasona:reauth-required", handleReauth);
    window.addEventListener("pasona:auth-restored", handleAuthRestored);

    return () => {
      window.removeEventListener("pasona:reauth-required", handleReauth);
      window.removeEventListener("pasona:auth-restored", handleAuthRestored);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);

    const email = user?.email;
    if (!email) {
      // If no email in cache, user must visit login
      window.location.href = "/login";
      return;
    }

    try {
      await authApi.login({ email, password });
      invalidateMe();
      toast.success("Session restored! You can now save your changes.");
      window.dispatchEvent(new CustomEvent("pasona:auth-restored"));
      setOpen(false);
    } catch (err: any) {
      setError(err?.message || "Invalid password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[380px] rounded-3xl p-6 bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] shadow-2xl">
        <DialogHeader className="space-y-2 text-center items-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-[var(--accent,#1F5BFF)] flex items-center justify-center shrink-0 mb-1">
            <Lock size={24} />
          </div>

          <DialogTitle className="text-lg font-bold text-[var(--ink)] tracking-tight">
            Session Expired
          </DialogTitle>

          <DialogDescription className="text-xs font-medium text-[var(--muted)] leading-relaxed">
            Please re-enter your password to stay signed in and save your open changes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 pt-2">
          {user?.email && (
            <div className="px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-xs text-[var(--muted)] truncate font-semibold">
              Signed in as: <strong className="text-[var(--ink)]">{user.email}</strong>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="reauth-password"
              className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] block"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="reauth-password"
                type={showPassword ? "text" : "password"}
                autoFocus
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink)] pr-10 focus:outline-none focus:border-[var(--primary)] shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] p-1 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && (
              <p className="text-[11px] font-semibold text-[var(--neg,#B63F2E)] mt-1 animate-slide-up">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                window.location.href = "/login";
              }}
              className="w-1/2 py-2.5 px-3 rounded-xl text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer"
            >
              Go to login
            </button>

            <button
              type="submit"
              disabled={busy || !password}
              className="w-1/2 py-2.5 px-3 rounded-xl text-xs font-bold bg-[var(--primary,#1F5BFF)] text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {busy ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <LogIn size={13} />
                  <span>Resume</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
