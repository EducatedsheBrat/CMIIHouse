'use client';

import { useId } from 'react';
import { HOUSES } from '../../lib/constants';
import { HouseIconGlyph } from './HouseIcon';
import { SHIELD_PATH } from './Shield';

/** The CMII House Points crest: a shield quartered in the four house colors. */
export function Crest({ size = 40, className }: { size?: number; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const detailed = size >= 56;
  const quarters = [
    { house: HOUSES.lumina, x: 0, y: 0 },
    { house: HOUSES.doron, x: 50, y: 0 },
    { house: HOUSES.ase, x: 0, y: 60 },
    { house: HOUSES.kaizen, x: 50, y: 60 },
  ];
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" className={className} role="img" aria-label="CMII House Points crest">
      <defs>
        <clipPath id={`clip-${uid}`}>
          <path d={SHIELD_PATH} />
        </clipPath>
        <linearGradient id={`trim-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7E2A6" />
          <stop offset="50%" stopColor="#D4A843" />
          <stop offset="100%" stopColor="#8A6A22" />
        </linearGradient>
        <radialGradient id={`vignette-${uid}`} cx="0.5" cy="0.45" r="0.65">
          <stop offset="55%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#clip-${uid})`}>
        {quarters.map(({ house, x, y }) => (
          <rect key={house.id} x={x} y={y} width="50" height="60" fill={house.color} />
        ))}
        <rect x="0" y="0" width="100" height="120" fill={`url(#vignette-${uid})`} />
        {detailed &&
          quarters.map(({ house, x, y }) => (
            <g key={house.id} transform={`translate(${x + 13} ${y + (y === 0 ? 20 : 8)}) scale(0.5)`} opacity="0.9">
              <HouseIconGlyph kind={house.icon} color="#FFF8E7" />
            </g>
          ))}
        <rect x="46" y="0" width="8" height="120" fill={`url(#trim-${uid})`} />
        <rect x="0" y="56" width="100" height="8" fill={`url(#trim-${uid})`} />
      </g>
      <path d={SHIELD_PATH} fill="none" stroke={`url(#trim-${uid})`} strokeWidth={detailed ? 4 : 6} strokeLinejoin="round" />
      <circle cx="50" cy="60" r={detailed ? 13 : 17} fill="#0F1B2D" stroke={`url(#trim-${uid})`} strokeWidth="3" />
      <text
        x="50"
        y="60"
        dy="0.36em"
        textAnchor="middle"
        style={{ fontFamily: 'var(--font-cinzel-decorative), Georgia, serif' }}
        fontWeight="900"
        fontSize={detailed ? 18 : 24}
        fill="#D4A843"
      >
        C
      </text>
    </svg>
  );
}
