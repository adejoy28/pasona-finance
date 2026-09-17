import { useEffect, useState } from "react";

interface SplashScreenProps {
  /** Minimum time to display the splash in ms (default: 1500) */
  duration?: number;
  onFinished?: () => void;
}

export function SplashScreen({ duration = 1500, onFinished }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadingOut(true);
      const exitTimer = setTimeout(() => {
        setVisible(false);
        onFinished?.();
      }, 350); // fade duration
      return () => clearTimeout(exitTimer);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinished]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex h-[100dvh] w-full flex-col items-center justify-between px-6 py-12 select-none transition-opacity duration-350 ease-out ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(circle at 50% 35%, #182459 0%, transparent 65%), #0A1230",
      }}
      aria-hidden={fadingOut ? "true" : undefined}
    >
      {/* Top spacer to balance optical centering */}
      <div className="h-9 w-9" aria-hidden="true" />

      {/* Centered Brand Mark & Wordmark */}
      <div className="flex flex-col items-center">
        <img
          src="/img/brand-name-logo-dark.png"
          alt="Pasona"
          className="h-8 w-auto object-contain"
        />
      </div>

      {/* Tapering Circular Dot Spinner at Bottom */}
      <div className="pb-4 sm:pb-6">
        <TaperingDotSpinner className="text-[#3b82f6]" />
      </div>
    </div>
  );
}

export function TaperingDotSpinner({ className }: { className?: string }) {
  const dots = [
    { cx: 20, cy: 7, r: 3.5, opacity: 1 },
    { cx: 29.2, cy: 10.8, r: 3.1, opacity: 0.85 },
    { cx: 33, cy: 20, r: 2.7, opacity: 0.7 },
    { cx: 29.2, cy: 29.2, r: 2.3, opacity: 0.55 },
    { cx: 20, cy: 33, r: 2.0, opacity: 0.4 },
    { cx: 10.8, cy: 29.2, r: 1.7, opacity: 0.28 },
    { cx: 7, cy: 20, r: 1.4, opacity: 0.18 },
    { cx: 10.8, cy: 10.8, r: 1.2, opacity: 0.1 },
  ];

  return (
    <svg
      className={`h-9 w-9 animate-spin ${className ?? ""}`}
      viewBox="0 0 40 40"
      fill="currentColor"
      role="status"
      aria-label="Loading"
    >
      {dots.map((dot, idx) => (
        <circle
          key={idx}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.r}
          opacity={dot.opacity}
        />
      ))}
    </svg>
  );
}
