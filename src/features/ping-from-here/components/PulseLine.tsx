"use client";

import { useEffect, useRef, useState } from "react";

interface PulseLineProps {
  latencyMs: number;
  maxLatencyMs: number;
}

// Cap animation duration so even 1000ms+ regions feel purposeful, not slow.
const MAX_ANIM_MS = 1200;
// Minimum fill so even 1ms shows something visible.
const MIN_FILL_PCT = 3;

export function PulseLine({ latencyMs, maxLatencyMs }: PulseLineProps) {
  const [revealed, setRevealed] = useState(false);
  // Double-rAF ensures the initial width:0 paint happens before we set the target,
  // so the CSS transition actually fires rather than snapping to the final value.
  const rafRef = useRef<number>(0);
  useEffect(() => {
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => setRevealed(true));
    });
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const fillPct = Math.max(
    MIN_FILL_PCT,
    Math.min(100, (latencyMs / Math.max(maxLatencyMs, 1)) * 100)
  );
  const animMs = Math.min(latencyMs, MAX_ANIM_MS);
  const transitionStyle = `${animMs}ms ease-out`;

  return (
    <div className="flex items-center gap-2 min-w-0 flex-1" aria-hidden>
      <div className="w-1.5 h-1.5 rounded-full bg-signal shrink-0" />

      <div className="relative h-px flex-1 min-w-15 max-w-30 sm:max-w-50 bg-white/5">
        <div
          className="pulse-line absolute inset-y-0 left-0 bg-signal/60"
          style={{
            width: revealed ? `${fillPct}%` : "0%",
            transition: `width ${transitionStyle}`,
          }}
        />
        {/* hidden by CSS when prefers-reduced-motion is set */}
        <div
          className="pulse-tip absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-signal"
          style={{
            left: revealed ? `calc(${fillPct}% - 4px)` : "-4px",
            transition: `left ${transitionStyle}`,
          }}
        />
      </div>
    </div>
  );
}
