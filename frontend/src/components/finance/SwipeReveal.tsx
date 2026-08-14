import { useRef, useState, type ReactNode, type TouchEvent, type PointerEvent } from "react";

type SwipeAction = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
};

type SwipeRevealProps = {
  children: ReactNode;
  rightActions?: SwipeAction[];
  leftActions?: SwipeAction[];
  threshold?: number;
  snapRatio?: number;
};

const ACTION_WIDTH = 76;

export function SwipeReveal({
  children,
  rightActions = [],
  leftActions = [],
  threshold = ACTION_WIDTH,
  snapRatio = 0.35,
}: SwipeRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [snapped, setSnapped] = useState<"left" | "right" | null>(null);

  const leftWidth = leftActions.length * threshold;
  const rightWidth = rightActions.length * threshold;
  const maxRight = rightWidth;
  const maxLeft = leftWidth;

  const handleStart = (clientX: number) => {
    setStartX(clientX);
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const delta = clientX - startX;
    let next = snapped === "right" ? delta - maxRight : snapped === "left" ? delta + maxLeft : delta;
    next = Math.min(Math.max(next, -maxRight), maxLeft);
    setTranslateX(next);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (snapped === "right") {
      if (translateX > -maxRight * snapRatio) {
        setTranslateX(0);
        setSnapped(null);
      } else {
        setTranslateX(-maxRight);
      }
      return;
    }
    if (snapped === "left") {
      if (translateX < maxLeft * snapRatio) {
        setTranslateX(0);
        setSnapped(null);
      } else {
        setTranslateX(maxLeft);
      }
      return;
    }
    if (translateX < -maxRight * snapRatio) {
      setTranslateX(-maxRight);
      setSnapped("right");
    } else if (translateX > maxLeft * snapRatio) {
      setTranslateX(maxLeft);
      setSnapped("left");
    } else {
      setTranslateX(0);
      setSnapped(null);
    }
  };

  // Touch handlers
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => handleStart(e.touches[0].clientX);
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => handleMove(e.touches[0].clientX);
  const handleTouchEnd = () => handleEnd();

  // Pointer handlers (mouse / trackpad / stylus)
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return; // Avoid double trigger with touch events
    handleStart(e.clientX);
  };
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    handleMove(e.clientX);
  };
  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    handleEnd();
  };

  const handleAction = (action: SwipeAction) => {
    setTranslateX(0);
    setSnapped(null);
    action.onClick();
  };

  const hasActions = rightActions.length > 0 || leftActions.length > 0;

  // Calculate pull progress (0 to 1) for scaling/opacity micro-interactions
  const pullProgress = Math.min(
    1,
    Math.abs(translateX) / Math.max(1, translateX < 0 ? maxRight : maxLeft),
  );

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl select-none group"
      onTouchStart={hasActions ? handleTouchStart : undefined}
      onTouchMove={hasActions ? handleTouchMove : undefined}
      onTouchEnd={hasActions ? handleTouchEnd : undefined}
      onPointerDown={hasActions ? handlePointerDown : undefined}
      onPointerMove={hasActions ? handlePointerMove : undefined}
      onPointerUp={hasActions ? handlePointerUp : undefined}
    >
      {/* Right actions container (revealed when swiping left) */}
      {rightActions.length > 0 && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-1 z-0"
          style={{ width: `${rightWidth}px` }}
        >
          {rightActions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleAction(action)}
              style={{
                transform: `scale(${0.75 + pullProgress * 0.25})`,
                opacity: 0.4 + pullProgress * 0.6,
              }}
              className={`h-[calc(100%-8px)] my-1 flex-1 flex flex-col items-center justify-center gap-1 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all duration-150 shadow-sm active:scale-95 ${
                action.className ?? "bg-gradient-to-r from-red-600 to-rose-500"
              }`}
            >
              <span className="text-base leading-none">{action.icon}</span>
              <span className="text-[9px] font-black">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Left actions container (revealed when swiping right) */}
      {leftActions.length > 0 && (
        <div
          className="absolute inset-y-0 left-0 flex items-center justify-start pl-1 z-0"
          style={{ width: `${leftWidth}px` }}
        >
          {leftActions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleAction(action)}
              style={{
                transform: `scale(${0.75 + pullProgress * 0.25})`,
                opacity: 0.4 + pullProgress * 0.6,
              }}
              className={`h-[calc(100%-8px)] my-1 flex-1 flex flex-col items-center justify-center gap-1 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all duration-150 shadow-sm active:scale-95 ${
                action.className ?? "bg-gradient-to-r from-blue-600 to-indigo-600"
              }`}
            >
              <span className="text-base leading-none">{action.icon}</span>
              <span className="text-[9px] font-black">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Sliding Content Layer */}
      <div
        className="relative z-10 bg-white"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
