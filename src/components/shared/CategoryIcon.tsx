'use client';

import type { CategoryKey } from '../../lib/constants';

/** Simple geometric category glyphs on a 24×24 grid. */
export function CategoryIcon({ category, size = 20, className }: { category: CategoryKey; size?: number; className?: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      {category === 'academic' && (
        // Open book
        <g {...p}>
          <path d="M12 6.5 C9.5 4.8 6.5 4.5 3 5 V18.5 C6.5 18 9.5 18.3 12 20 C14.5 18.3 17.5 18 21 18.5 V5 C17.5 4.5 14.5 4.8 12 6.5 Z" />
          <path d="M12 6.5 V20" />
        </g>
      )}
      {category === 'participation' && (
        // Pennant on a pole
        <g {...p}>
          <path d="M5 21 V3" />
          <path d="M5 4 H19 L15.5 8.5 L19 13 H5" />
        </g>
      )}
      {category === 'service' && (
        // Heart
        <g {...p}>
          <path d="M12 20 C5 15.5 3 12.2 3 9 C3 6.2 5.2 4 7.8 4 C9.6 4 11.1 5 12 6.5 C12.9 5 14.4 4 16.2 4 C18.8 4 21 6.2 21 9 C21 12.2 19 15.5 12 20 Z" />
        </g>
      )}
      {category === 'challenge' && (
        // Crossed swords
        <g {...p}>
          <path d="M4 4 L14.5 14.5 M4 4 V7.5 M4 4 H7.5" />
          <path d="M20 4 L9.5 14.5 M20 4 V7.5 M20 4 H16.5" />
          <path d="M12.5 16.5 L16.5 12.5 M16 17 L19.5 20.5" />
          <path d="M11.5 16.5 L7.5 12.5 M8 17 L4.5 20.5" />
        </g>
      )}
      {category === 'character' && (
        // Crown
        <g {...p}>
          <path d="M3.5 17.5 L2.5 7.5 L8 11.5 L12 5 L16 11.5 L21.5 7.5 L20.5 17.5 Z" />
          <path d="M4 20.5 H20" />
        </g>
      )}
    </svg>
  );
}
