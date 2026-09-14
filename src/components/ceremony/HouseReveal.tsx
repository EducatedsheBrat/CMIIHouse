'use client';

import { useMemo, type CSSProperties } from 'react';
import { HOUSES, type HouseId } from '../../lib/constants';
import { lighten, rgba } from '../../lib/utils';

interface HouseRevealProps {
  houseId: HouseId;
  studentName: string;
  onDismiss: () => void;
}

/** Stable pseudo-random value in [0, 1) for particle `i`, channel `k` — keeps render pure. */
function scatter(i: number, k: number) {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** The house name reveal over the wheel: ceremonial type, a glow, and shimmering particles in the house color. */
export function HouseReveal({ houseId, studentName, onDismiss }: HouseRevealProps) {
  const house = HOUSES[houseId];
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => {
        const angle = scatter(i, 1) * Math.PI * 2;
        const distance = 90 + scatter(i, 2) * 180;
        return {
          '--p-x': `${Math.cos(angle) * distance}px`,
          '--p-y': `${Math.sin(angle) * distance}px`,
          '--p-size': `${3 + scatter(i, 3) * 6}px`,
          '--p-dur': `${1.6 + scatter(i, 4) * 1.6}s`,
          '--p-delay': `${0.2 + scatter(i, 5) * 1.4}s`,
          '--p-color': i % 4 === 0 ? '#F7E2A6' : lighten(house.color, 0.25 + scatter(i, 6) * 0.3),
        } as CSSProperties;
      }),
    [house.color],
  );

  return (
    <div
      className="lq-reveal"
      style={{ '--win-color': house.color, '--win-light': lighten(house.color, 0.3), '--win-glow': rgba(house.color, 0.5) } as CSSProperties}
      onClick={onDismiss}
      role="status"
      aria-live="assertive"
    >
      <div className="lq-reveal__backdrop" />
      {particles.map((style, i) => (
        <span key={i} className="lq-particle" style={style} />
      ))}
      <p className="lq-reveal__sub font-heading text-xs font-bold uppercase tracking-[0.4em] text-white/70">House</p>
      <h2 className="lq-reveal__name">{house.name}</h2>
      <div className="lq-reveal__sub mt-3">
        <p className="font-heading text-sm font-semibold uppercase tracking-[0.25em]" style={{ color: lighten(house.color, 0.45) }}>
          {house.motto}
        </p>
        <p className="mt-2 text-lg font-semibold text-white">Welcome, {studentName}</p>
      </div>
    </div>
  );
}
