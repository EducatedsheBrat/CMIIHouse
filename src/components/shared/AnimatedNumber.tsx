'use client';

import { useEffect, useRef, useState } from 'react';
import { formatPoints, prefersReducedMotion } from '../../lib/utils';

interface AnimatedNumberProps {
  value: number;
  /** Starting value for the first render (e.g. 0 for a count-up). Defaults to `value`. */
  from?: number;
  duration?: number;
  className?: string;
  prefix?: string;
}

/** Scoreboard-style number that counts toward its new value. */
export function AnimatedNumber({ value, from, duration = 900, className, prefix = '' }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(from ?? value);
  const current = useRef(from ?? value);

  useEffect(() => {
    const start = current.current;
    if (start === value) return;
    // Reduced motion jumps straight to the value (on the next frame, like the animated path).
    const span = prefersReducedMotion() ? 0 : duration;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = span === 0 ? 1 : Math.min(1, (now - t0) / span);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = start + (value - start) * eased;
      current.current = next;
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {formatPoints(display)}
    </span>
  );
}
