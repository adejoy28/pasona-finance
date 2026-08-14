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
      className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-amber-900"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Mail size={16} className="flex-shrink-0 text-amber-600" aria-hidden />
        <span className="text-xs font-bold truncate">
          Confirm your email to unlock CSV imports and batch sync.
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleResend}
          disabled={sending || sent}
          className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white transition-colors hover:bg-amber-700 disabled:opacity-70 disabled:cursor-not-allowed"
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
          aria-label="Dismiss"
          className="flex h-7 w-7 items-center justify-center rounded-full text-amber-700 transition-colors hover:bg-amber-100"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
