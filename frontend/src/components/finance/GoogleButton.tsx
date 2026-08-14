import { useState } from "react";
import { startGoogleLogin } from "@/lib/auth/google";

export function GoogleButton({
  label = "Google",
  variant = "light",
}: {
  label?: string;
  variant?: "light" | "dark";
}) {
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    if (redirecting) return;
    setError(null);
    setRedirecting(true);
    try {
      await startGoogleLogin();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start Google sign-in. Please try again.",
      );
      setRedirecting(false);
    }
  };

  const buttonClasses =
    variant === "dark"
      ? "w-full h-12 flex items-center justify-center gap-2.5 rounded-xl bg-[#0e172e] border border-white/[0.08] text-white font-semibold text-[14.5px] transition-all hover:bg-[#162244] active:scale-[0.985] disabled:opacity-60"
      : "w-full h-[52px] flex items-center justify-center gap-2.5 rounded-2xl bg-cream-50 border-[1.5px] border-cream-200 text-navy-700 font-bold text-[15px] transition-colors hover:border-navy-600 hover:shadow-[0_6px_16px_-8px_rgba(24,36,89,0.25)] active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="space-y-2">
      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 bg-rose-soft border border-[#e8bcb8] text-rose text-[13px] font-semibold px-3 py-2.5 rounded-xl"
        >
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={redirecting}
        className={buttonClasses}
      >
        <GoogleLogo />
        {redirecting ? "Redirecting…" : label}
      </button>
    </div>
  );
}

function GoogleLogo() {
  // Official 4-color "G" — colors are Google brand spec, not theme tokens.
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
