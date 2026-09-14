'use client';

import { forwardRef, useImperativeHandle, useRef, useState, type CSSProperties } from 'react';
import { HOUSES, WHEEL_SECTIONS, type HouseId } from '../../lib/constants';
import { normalizeDeg, targetRotation, WHEEL_STOP_EASING, WHEEL_STOP_MS } from '../../lib/sorting';
import { cn, lighten, rgba } from '../../lib/utils';
import { Crest } from '../shared/Crest';
import { HouseIconSvg } from '../shared/HouseIcon';

export interface SortingWheelHandle {
  spin: () => void;
  /** Decelerates onto the given house; resolves when the wheel comes to rest. */
  stop: (houseId: HouseId) => Promise<void>;
}

/** Current rotation of an element from its computed transform matrix, in degrees. */
function currentAngle(el: HTMLElement): number | null {
  const t = getComputedStyle(el).transform;
  if (!t || t === 'none') return null;
  const m = new DOMMatrixReadOnly(t);
  return normalizeDeg((Math.atan2(m.b, m.a) * 180) / Math.PI);
}

/** The ceremonial sorting wheel — four house quadrants under a fixed gold pointer. CSS transforms only. */
export const SortingWheel = forwardRef<SortingWheelHandle, { landed: HouseId | null; className?: string }>(function SortingWheel(
  { landed, className },
  ref,
) {
  const rotor = useRef<HTMLDivElement>(null);
  const rotation = useRef(0);
  const [spinning, setSpinning] = useState(false);

  useImperativeHandle(ref, () => ({
    spin() {
      const el = rotor.current;
      if (!el) return;
      el.style.transition = 'none';
      el.style.transform = '';
      // Start the infinite spin from wherever the wheel is resting, so it doesn't jump.
      el.style.setProperty('--spin-from', `${normalizeDeg(rotation.current)}deg`);
      el.classList.add('is-spinning');
      setSpinning(true);
    },
    stop(houseId) {
      const el = rotor.current;
      if (!el) return Promise.resolve();
      const from = currentAngle(el) ?? normalizeDeg(rotation.current);

      // Freeze at the live angle, then transition to a target several turns ahead.
      el.classList.remove('is-spinning');
      el.style.transition = 'none';
      el.style.transform = `rotate(${from}deg)`;
      void el.offsetWidth;

      const target = targetRotation(from, houseId);
      rotation.current = target;
      el.style.transition = `transform ${WHEEL_STOP_MS}ms cubic-bezier(${WHEEL_STOP_EASING.join(',')})`;
      el.style.transform = `rotate(${target}deg)`;
      setSpinning(false);

      return new Promise<void>((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          el.removeEventListener('transitionend', done);
          resolve();
        };
        el.addEventListener('transitionend', done);
        window.setTimeout(done, WHEEL_STOP_MS + 200);
      });
    },
  }));

  const win = landed ? HOUSES[landed] : null;
  const winSection = landed ? WHEEL_SECTIONS.find((s) => s.houseId === landed) : null;

  return (
    <div
      className={cn('lq-wheel', spinning && 'is-spinning', landed && 'is-landed', className)}
      style={
        win
          ? ({ '--win-color': win.color, '--win-glow': rgba(win.color, 0.55) } as CSSProperties)
          : undefined
      }
      role="img"
      aria-label={win ? `The wheel landed on ${win.name}` : 'Sorting wheel'}
    >
      <div ref={rotor} className="lq-wheel__rotor">
        {WHEEL_SECTIONS.map((s) => (
          <span key={`d-${s.start}`} className="lq-wheel__divider" style={{ transform: `rotate(${s.start}deg)` }} />
        ))}
        {WHEEL_SECTIONS.map((s) => {
          const mid = (s.start + s.end) / 2;
          const flip = mid > 90 && mid < 270;
          const house = HOUSES[s.houseId];
          return (
            <div key={s.houseId} className="lq-wheel__label" style={{ transform: `rotate(${mid}deg)` }}>
              <span style={{ transform: `translateX(-50%)${flip ? ' rotate(180deg)' : ''}`, flexDirection: flip ? 'column-reverse' : 'column' }}>
                <HouseIconSvg kind={house.icon} size={0} color={lighten(house.color, 0.75)} className="h-[1.6em] w-[1.6em]" />
                {house.name}
              </span>
            </div>
          );
        })}
        {winSection && <div className="lq-wheel__highlight" style={{ '--hl-start': `${winSection.start}deg` } as CSSProperties} />}
      </div>

      <div className="lq-wheel__frame" />
      {Array.from({ length: 24 }, (_, i) => (
        <span key={i} className="lq-wheel__notch" style={{ transform: `rotate(${i * 15 + 7.5}deg)` }} />
      ))}

      <div className="lq-wheel__hub">
        <Crest size={0} className="h-auto w-[56%]" />
      </div>

      <svg className="lq-wheel__pointer" width="40" height="46" viewBox="0 0 40 46" aria-hidden="true">
        <defs>
          <linearGradient id="lq-pointer-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F7E2A6" />
            <stop offset=".55" stopColor="#D4A843" />
            <stop offset="1" stopColor="#8A6A22" />
          </linearGradient>
        </defs>
        <path d="M20 44 L4 12 A16 16 0 0 1 36 12 Z" fill="url(#lq-pointer-gold)" stroke="#FBE9B4" strokeWidth="1.2" />
        <circle cx="20" cy="14" r="6" fill="#0A1628" stroke="#FBE9B4" strokeWidth="1.2" />
        <path d="M20 9.5 L23.5 14 L20 18.5 L16.5 14 Z" fill={win?.color ?? '#D4A843'} />
      </svg>
    </div>
  );
});
