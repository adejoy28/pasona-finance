"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type CoachmarkPlacement = "top" | "bottom" | "left" | "right" | "center";

type CoachmarkProps = {
  open: boolean;
  /** CSS selector for the element to spotlight. Must be in the DOM. */
  target: string;
  title: string;
  body: ReactNode;
  /** Zero-indexed current step. */
  step: number;
  /** Total number of steps in the tour. */
  totalSteps: number;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  onDismiss: () => void;
  /** Default placement; auto-flips if there's no room. */
  placement?: CoachmarkPlacement;
};

const VIEWPORT_PADDING = 16;
const POPOVER_GAP = 16;
const POPOVER_MAX_WIDTH = 384;

type Rect = { top: number; left: number; width: number; height: number };

function getRect(target: string): Rect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(target);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function choosePlacement(
  target: Rect,
  preferred: CoachmarkPlacement,
  popover: { width: number; height: number },
): CoachmarkPlacement {
  if (preferred === "center") return "center";
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceBelow = vh - (target.top + target.height);
  const spaceAbove = target.top;
  const spaceRight = vw - (target.left + target.width);
  const spaceLeft = target.left;
  if (preferred === "top" && spaceAbove >= popover.height + POPOVER_GAP * 2) return "top";
  if (preferred === "bottom" && spaceBelow >= popover.height + POPOVER_GAP * 2) return "bottom";
  if (preferred === "left" && spaceLeft >= popover.width + POPOVER_GAP * 2) return "left";
  if (preferred === "right" && spaceRight >= popover.width + POPOVER_GAP * 2) return "right";
  const rooms: [CoachmarkPlacement, number][] = [
    ["bottom", spaceBelow],
    ["top", spaceAbove],
    ["right", spaceRight],
    ["left", spaceLeft],
  ];
  rooms.sort((a, b) => b[1] - a[1]);
  return rooms[0][0];
}

function positionPopover(
  target: Rect,
  popover: { width: number; height: number },
  placement: CoachmarkPlacement,
) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const centerX = target.left + target.width / 2;
  const centerY = target.top + target.height / 2;

  if (placement === "center") {
    return {
      top: vh / 2 - popover.height / 2,
      left: vw / 2 - popover.width / 2,
    };
  }

  if (placement === "top" || placement === "bottom") {
    const idealLeft = centerX - popover.width / 2;
    const maxLeft = vw - popover.width - VIEWPORT_PADDING;
    const left = Math.max(VIEWPORT_PADDING, Math.min(idealLeft, maxLeft));
    const top =
      placement === "top"
        ? target.top - popover.height - POPOVER_GAP
        : target.top + target.height + POPOVER_GAP;
    return { top, left };
  }

  const idealTop = centerY - popover.height / 2;
  const maxTop = vh - popover.height - VIEWPORT_PADDING;
  const top = Math.max(VIEWPORT_PADDING, Math.min(idealTop, maxTop));
  const left =
    placement === "left"
      ? target.left - popover.width - POPOVER_GAP
      : target.left + target.width + POPOVER_GAP;
  return { top, left };
}

function arrowStyle(
  placement: CoachmarkPlacement,
  target: Rect,
  popover: { left: number; top: number; width: number; height: number },
) {
  const centerX = target.left + target.width / 2 - popover.left;
  const centerY = target.top + target.height / 2 - popover.top;
  if (placement === "top") {
    return {
      bottom: -5,
      left: Math.max(20, Math.min(centerX, popover.width - 20)),
      transform: "rotate(45deg)",
    };
  }
  if (placement === "bottom") {
    return {
      top: -5,
      left: Math.max(20, Math.min(centerX, popover.width - 20)),
      transform: "rotate(45deg)",
    };
  }
  if (placement === "left") {
    return {
      right: -5,
      top: Math.max(20, Math.min(centerY, popover.height - 20)),
      transform: "rotate(45deg)",
    };
  }
  if (placement === "right") {
    return {
      left: -5,
      top: Math.max(20, Math.min(centerY, popover.height - 20)),
      transform: "rotate(45deg)",
    };
  }
  return { display: "none" };
}

export function Coachmark({
  open,
  target,
  title,
  body,
  step,
  totalSteps,
  primaryLabel = "Next",
  secondaryLabel = "Back",
  onPrimary,
  onSecondary,
  onDismiss,
  placement = "bottom",
}: CoachmarkProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [resolvedPlacement, setResolvedPlacement] = useState<CoachmarkPlacement>(placement);
  const [popoverSize, setPopoverSize] = useState({ width: POPOVER_MAX_WIDTH, height: 240 });
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  const measure = () => {
    const rect = getRect(target);
    if (!rect) return;
    setTargetRect(rect);
    const size = popoverSize;
    const resolved = choosePlacement(rect, placement, size);
    setResolvedPlacement(resolved);
    setPopoverPos(positionPopover(rect, size, resolved));
  };

  // Measure the target and popover, and place the popover.
  useLayoutEffect(() => {
    if (!open) return;
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target, placement, step, popoverSize.width, popoverSize.height]);

  // Re-position on resize / scroll.
  useEffect(() => {
    if (!open) return;
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target, step]);

  // ResizeObserver on the popover so we re-position when the body
  // content changes height (e.g. step body is long).
  useEffect(() => {
    if (!open) return;
    const el = popoverRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setPopoverSize({ width: cr.width, height: cr.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, step]);

  // Scroll the target into view on step change.
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const el = document.querySelector(target);
    if (el && "scrollIntoView" in el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [open, target, step]);

  // Focus the primary button when the popover mounts.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => primaryButtonRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [open, step]);

  // ESC dismisses (skip-equivalent).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  // Body scroll lock while the tour is in flight.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || !targetRect) return null;

  const isCenter = resolvedPlacement === "center";
  const radius = isCenter ? 24 : 16;
  const arrow =
    popoverPos && resolvedPlacement !== "center"
      ? arrowStyle(resolvedPlacement, targetRect, {
          left: popoverPos.left,
          top: popoverPos.top,
          width: popoverSize.width,
          height: popoverSize.height,
        })
      : null;

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coachmark-title"
    >
      {/* Spotlight cutout: a positioned box with a giant box-shadow. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed"
        style={{
          top: targetRect.top - 6,
          left: targetRect.left - 6,
          width: targetRect.width + 12,
          height: targetRect.height + 12,
          borderRadius: radius + 4,
          boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.72)",
        }}
      />
      {/* Inner ring framing the target. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed ring-4 ring-blue-400"
        style={{
          top: targetRect.top - 6,
          left: targetRect.left - 6,
          width: targetRect.width + 12,
          height: targetRect.height + 12,
          borderRadius: radius + 4,
        }}
      />

      {popoverPos && (
        <div
          ref={popoverRef}
          className={cn(
            "absolute w-[calc(100vw-2rem)] max-w-sm bg-white rounded-[2rem] card-shadow border border-slate-100 p-6 space-y-4",
            "animate-in fade-in-0 zoom-in-95 duration-200",
          )}
          style={{ top: popoverPos.top, left: popoverPos.left }}
        >
          {arrow && (
            <span
              aria-hidden="true"
              className="absolute w-2.5 h-2.5 bg-white border border-slate-100"
              style={arrow}
            />
          )}

          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
              {step + 1} of {totalSteps}
            </p>
            <button
              type="button"
              onClick={onDismiss}
              className="w-7 h-7 -mt-1 -mr-1 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              aria-label="Skip tour"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2">
            <h3
              id="coachmark-title"
              className="text-lg font-black text-slate-900 tracking-tight leading-tight"
            >
              {title}
            </h3>
            <div className="text-sm text-slate-500 leading-relaxed">{body}</div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === step ? "w-6 bg-blue-600" : "w-1.5 bg-slate-200",
                  )}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {onSecondary && step > 0 && (
                <button
                  type="button"
                  onClick={onSecondary}
                  className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft size={12} className="inline -ml-1 mr-0.5" strokeWidth={3} />
                  {secondaryLabel}
                </button>
              )}
              <button
                ref={primaryButtonRef}
                type="button"
                onClick={onPrimary}
                className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1"
              >
                {primaryLabel}
                {step < totalSteps - 1 && <ChevronRight size={12} strokeWidth={3} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
