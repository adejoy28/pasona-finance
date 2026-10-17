import { useState, useEffect, useRef } from "react";

interface CountUpOptions {
  duration?: number;
  enabled?: boolean;
}

/**
 * Animates a numeric value from 0 to target using cubic easeOut: e = 1 - (1-p)³.
 * Honors prefers-reduced-motion and enabled flags.
 */
export function useCountUp(
  target: number,
  optionsOrDuration: CountUpOptions | number = 650,
  enabledFlag?: boolean
): number {
  const duration =
    typeof optionsOrDuration === "number" ? optionsOrDuration : optionsOrDuration.duration ?? 650;
  const enabled =
    typeof optionsOrDuration === "number"
      ? (enabledFlag ?? true)
      : optionsOrDuration.enabled ?? true;

  const [display, setDisplay] = useState<number>(() => {
    if (typeof window === "undefined") return target;
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReducedMotion || !enabled || target <= 0) {
      return target;
    }
    return 0;
  });

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (prefersReducedMotion || !enabled || target <= 0) {
      setDisplay(target);
      return;
    }

    const startTime = performance.now();
    const startVal = 0;
    const diff = target - startVal;

    const step = (now: number) => {
      const p = Math.min(1, (now - startTime) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(startVal + diff * e);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(target);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target, duration, enabled]);

  return display;
}
