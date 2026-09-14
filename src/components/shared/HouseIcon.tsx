'use client';

import type { HouseIconKind } from '../../lib/constants';

/**
 * Geometric house sigils drawn on a 48×48 grid. Rendered as an SVG <g> so they can
 * sit inside a shield, or standalone via <HouseIconSvg>.
 */
export function HouseIconGlyph({ kind, color = 'currentColor', accent }: { kind: HouseIconKind; color?: string; accent?: string }) {
  const stroke = { stroke: color, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  switch (kind) {
    case 'sun': {
      // Lumina — an eye at the heart of a rising sun.
      const rays = [-150, -120, -90, -60, -30].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return { x1: 24 + Math.cos(r) * 15, y1: 26 + Math.sin(r) * 15, x2: 24 + Math.cos(r) * 21, y2: 26 + Math.sin(r) * 21 };
      });
      return (
        <g>
          {rays.map((ray, i) => (
            <line key={i} {...ray} {...stroke} />
          ))}
          <path d="M6 30 Q24 12 42 30 Q24 46 6 30 Z" {...stroke} />
          <circle cx="24" cy="30" r="6" fill={color} />
          <circle cx="24" cy="30" r="2.3" fill={accent ?? 'rgba(0,0,0,0.55)'} />
        </g>
      );
    }
    case 'diamond':
      // Doron — a faceted gem.
      return (
        <g>
          <path d="M14 12 H34 L43 22 L24 43 L5 22 Z" {...stroke} />
          <path d="M5 22 H43" {...stroke} strokeWidth={1.8} />
          <path d="M14 12 L19 22 L24 43 L29 22 L34 12" {...stroke} strokeWidth={1.8} />
          <path d="M19 22 L24 12 L29 22" {...stroke} strokeWidth={1.8} />
          <path d="M16.5 17 L19 22 L10 22 Z" fill={color} opacity={0.35} />
        </g>
      );
    case 'star': {
      // Asé — a radiant eight-point star of creative power.
      const pts: string[] = [];
      for (let i = 0; i < 16; i++) {
        const r = i % 2 === 0 ? 20 : 8;
        const a = (Math.PI / 8) * i - Math.PI / 2;
        pts.push(`${(24 + Math.cos(a) * r).toFixed(2)},${(24 + Math.sin(a) * r).toFixed(2)}`);
      }
      return (
        <g>
          <polygon points={pts.join(' ')} {...stroke} />
          <circle cx="24" cy="24" r="4.2" fill={color} />
        </g>
      );
    }
    case 'triangle':
      // Kaizen — ascending triangles, always one step higher.
      return (
        <g>
          <path d="M24 5 L44 41 H4 Z" {...stroke} />
          <path d="M24 17 L35.5 37 H12.5 Z" fill={color} opacity={0.3} />
          <path d="M24 26 L30 36.5 H18 Z" fill={color} />
        </g>
      );
  }
}

export function HouseIconSvg({ kind, size = 24, color = 'currentColor', className }: { kind: HouseIconKind; size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden="true">
      <HouseIconGlyph kind={kind} color={color} />
    </svg>
  );
}
