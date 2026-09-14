'use client';

import { useId } from 'react';
import { HOUSES, isHouseId, type HouseId } from '../../lib/constants';
import { darken, lighten, rgba } from '../../lib/utils';
import { HouseIconGlyph } from './HouseIcon';

export const SHIELD_PATH = 'M50 4 L92 15 V55 C92 85 73 105 50 116 C27 105 8 85 8 55 V15 Z';

interface ShieldProps {
  houseId: HouseId | string | null | undefined;
  size?: number;
  glow?: boolean;
  className?: string;
  title?: string;
}

/** A house crest: gradient shield, double gold trim, and the house sigil. */
export function Shield({ houseId, size = 48, glow = false, className, title }: ShieldProps) {
  const uid = useId().replace(/:/g, '');
  if (!isHouseId(houseId)) return <UnsortedShield size={size} className={className} />;
  const house = HOUSES[houseId];
  const detailed = size >= 28;

  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 100 120"
      className={className}
      role="img"
      aria-label={title ?? `${house.name} shield`}
      style={glow ? { filter: `drop-shadow(0 0 ${Math.max(6, size / 6)}px ${rgba(house.color, 0.55)})` } : undefined}
    >
      <defs>
        <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor={lighten(house.color, 0.18)} />
          <stop offset="55%" stopColor={house.color} />
          <stop offset="100%" stopColor={darken(house.color, 0.55)} />
        </linearGradient>
        <linearGradient id={`trim-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7E2A6" />
          <stop offset="50%" stopColor="#D4A843" />
          <stop offset="100%" stopColor="#8A6A22" />
        </linearGradient>
        <linearGradient id={`shine-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <path d={SHIELD_PATH} fill={`url(#fill-${uid})`} stroke={`url(#trim-${uid})`} strokeWidth={detailed ? 5 : 7} strokeLinejoin="round" />
      {detailed && (
        <path
          d={SHIELD_PATH}
          fill="none"
          stroke="rgba(255,245,215,0.45)"
          strokeWidth="1.5"
          transform="translate(50 60) scale(0.84) translate(-50 -60)"
        />
      )}
      <path d={SHIELD_PATH} fill={`url(#shine-${uid})`} transform="translate(50 60) scale(0.9) translate(-50 -60)" />
      <g transform={detailed ? 'translate(24 30) scale(1.08)' : 'translate(19 26) scale(1.3)'}>
        <HouseIconGlyph kind={house.icon} color="#FFF8E7" accent={darken(house.color, 0.6)} />
      </g>
    </svg>
  );
}

function UnsortedShield({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" className={className} role="img" aria-label="Unsorted">
      <path d={SHIELD_PATH} fill="#1A2940" stroke="#D4A843" strokeWidth="5" strokeDasharray="8 6" />
      <text x="50" y="72" textAnchor="middle" style={{ fontFamily: 'var(--font-cinzel), Georgia, serif' }} fontSize="40" fill="#D4A843">?</text>
    </svg>
  );
}
