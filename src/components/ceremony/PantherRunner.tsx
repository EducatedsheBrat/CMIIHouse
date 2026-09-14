'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from 'react';
import { HOUSES, type HouseId } from '../../lib/constants';
import { bezierVelocityRatio, WHEEL_STOP_EASING, WHEEL_STOP_MS } from '../../lib/sorting';
import { cn, lighten, rgba } from '../../lib/utils';
import { Panther, RunningPantherSvg } from '../shared/Panther';

export interface PantherRunnerHandle {
  run: () => void;
  /** Slows the run cycle along the wheel's deceleration curve, then freezes. */
  stop: () => void;
  reset: () => void;
}

type Mode = 'idle' | 'running' | 'slowing' | 'stopped';

/**
 * The black panther that runs while the wheel spins. The run cycle is CSS keyframes inside
 * the sprite; its speed is driven through the Web Animations API (playbackRate) so it
 * decelerates in lockstep with the wheel instead of jumping between speeds.
 */
export const PantherRunner = forwardRef<PantherRunnerHandle, { reveal: HouseId | null; className?: string }>(function PantherRunner(
  { reveal, className },
  ref,
) {
  const track = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const [mode, setMode] = useState<Mode>('idle');

  const setRate = (rate: number) => {
    track.current?.getAnimations({ subtree: true }).forEach((a) => {
      a.playbackRate = rate;
    });
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // Class changes mount the dust/ground animations; apply the current rate once they exist.
  useEffect(() => {
    if (mode === 'running') requestAnimationFrame(() => setRate(1));
  }, [mode]);

  useImperativeHandle(ref, () => ({
    run() {
      cancelAnimationFrame(raf.current);
      setMode('running');
    },
    stop() {
      cancelAnimationFrame(raf.current);
      setMode('slowing');
      const [x1, y1, x2, y2] = WHEEL_STOP_EASING;
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / WHEEL_STOP_MS);
        // Below ~2% speed the legs visibly stutter, so settle to a stop.
        const rate = bezierVelocityRatio(t, x1, y1, x2, y2);
        setRate(rate < 0.02 ? 0 : rate);
        if (t < 1 && rate >= 0.02) raf.current = requestAnimationFrame(tick);
        else setMode('stopped');
      };
      raf.current = requestAnimationFrame(tick);
    },
    reset() {
      cancelAnimationFrame(raf.current);
      setMode('idle');
      requestAnimationFrame(() => setRate(1));
    },
  }));

  const house = reveal ? HOUSES[reveal] : null;
  const moving = mode === 'running' || mode === 'slowing';

  return (
    <div
      ref={track}
      className={cn('lq-track', moving && 'is-running', house && 'is-revealed', !moving && 'is-paused', className)}
      style={house ? ({ '--win-color': house.color, '--win-light': lighten(house.color, 0.3), '--win-glow': rgba(house.color, 0.5) } as CSSProperties) : undefined}
      aria-hidden="true"
    >
      <div className="lq-track__ground" />
      {[18, 30, 42].map((left, i) => (
        <span key={left} className="lq-track__dust" style={{ left: `${left}%`, animationDelay: `${i * -0.15}s` }} />
      ))}
      <div className="lq-track__runner">
        <div className="lq-track__runner-drift">
          <RunningPantherSvg />
        </div>
      </div>
      {house && (
        <div className="lq-track__house">
          <Panther house={house.id} glow />
        </div>
      )}
    </div>
  );
});
