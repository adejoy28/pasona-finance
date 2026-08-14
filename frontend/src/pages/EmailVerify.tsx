import { Link, useSearchParams } from "react-router";
import { useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { AuthShell, authButtonClass } from "@/components/finance/AuthShell";

const btn = authButtonClass + " inline-block w-auto px-6";

export function EmailVerify() {
  const [searchParams] = useSearchParams();
  const verify_url = searchParams.get("verify_url") ?? "";
  const error = searchParams.get("error") ?? "";
  const fired = useRef(false);

  useEffect(() => {
    document.title = "Confirm email — Pasona";
  }, []);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (!verify_url || error) return;
    window.location.replace(verify_url);
  }, [verify_url, error]);

  if (error === "expired") {
    return (
      <AuthShell
        title="Link expired"
        subtitle="Your verification link is no longer valid"
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <AlertTriangle size={40} className="text-amber-400" />
          <p className="text-sm text-slate-300 text-center">
            Verification links expire after 60 minutes for security.
            Request a fresh one from your account settings after signing in.
          </p>
          <Link to="/login" className={btn}>
            Sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (error === "invalid_hash") {
    return (
      <AuthShell
        title="Invalid link"
        subtitle="This link doesn't match our records"
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <AlertTriangle size={40} className="text-red-400" />
          <p className="text-sm text-slate-300 text-center">
            The verification link you clicked appears to be invalid.
            Sign in and request a new verification email from your settings.
          </p>
          <Link to="/login" className={btn}>
            Sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (error) {
    return (
      <AuthShell title="Verification failed" subtitle="Something went wrong">
        <div className="flex flex-col items-center gap-4 py-2">
          <AlertTriangle size={40} className="text-red-400" />
          <p className="text-sm text-slate-300 text-center">
            We couldn't verify your email. Try signing in and requesting a new
            verification link.
          </p>
          <Link to="/login" className={btn}>
            Sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (verify_url) {
    return (
      <AuthShell title="Confirming your email" subtitle="Just a moment">
        <div className="flex flex-col items-center gap-4 py-4">
          <Loader2 size={32} className="animate-spin text-indigo-400" />
          <p className="text-sm text-slate-300 text-center">
            Verifying your email address…
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Verify your email" subtitle="Check your inbox">
      <div className="flex flex-col items-center gap-4 py-2">
        <CheckCircle2 size={40} className="text-emerald-400" />
        <p className="text-sm text-slate-300 text-center">
          We sent a verification link to your email. Click it to activate
          your account and unlock all features.
        </p>
        <Link to="/login" className={btn}>
          Go to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
