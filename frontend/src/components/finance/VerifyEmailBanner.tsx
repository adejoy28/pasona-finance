import { useState } from "react";
import { Check, Mail, X } from "lucide-react";
import { usePopup } from "@/components/ui/popup";
import { ApiError, auth as authApi } from "@/lib/api";
import { useMe, invalidateMe } from "@/hooks/use-me";

/**
 * Top-of-page banner shown on the dashboard when the signed-in user
 * hasn't confirmed their email yet. Renders nothing once the user is
 * verified, after a session-local dismiss, or while /me is loading.
 *
 * The "Resend" button hits `POST /email/verification-notification`. On
 * 429 (throttled) we treat it as success so the user isn't bounced
 * around — the original mail is still in flight.
 */
export function VerifyEmailBanner() {
  const meQuery = useMe();
  const popup = usePopup();
  const [hidden, setHidden] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const me = meQuery.data;
  if (hidden) return null;
  if (!me) return null;
  if (me.email_verified_at) return null;

  const handleResend = async () => {
    if (sending) return;
    setSending(true);
    try {
      await authApi.resendVerification();
      setSent(true);
      // The /me payload is what gates this banner, so make sure a
      // subsequent verification (e.g. via the email link) shows up
      // without a hard refresh.
      invalidateMe();
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        // Throttled — pretend success; the original mail is still on
        // its way and the user shouldn't see a confusing error.
        setSent(true);
      } else {
        popup.error("Couldn't resend the confirmation email. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-amber-200 backdrop-blur-md shadow-sm"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
          <Mail size={15} aria-hidden />
        </div>
        <span className="text-xs font-semibold text-amber-100 truncate">
          Confirm your email to unlock CSV imports and batch sync.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleResend}
          disabled={sending || sent}
          className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1 text-[11px] font-bold text-slate-950 transition-all hover:bg-amber-400 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {sent ? (
            <>
              <Check size={12} /> Sent
            </>
          ) : sending ? (
            "Sending…"
          ) : (
            "Resend email"
          )}
        </button>
        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label="Dismiss email verification notice"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-300/80 transition-colors hover:bg-white/10 hover:text-amber-100 cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
