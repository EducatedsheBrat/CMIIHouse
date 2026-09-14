'use client';

import { houseColor, cn, darken, initials, lighten } from '../../lib/utils';

interface AvatarProps {
  name: string;
  houseId?: string | null;
  size?: number;
  ring?: boolean;
  className?: string;
}

/** Initials medallion in the student's house color. */
export function Avatar({ name, houseId, size = 40, ring = false, className }: AvatarProps) {
  const color = houseColor(houseId);
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center rounded-full font-heading font-bold text-white', className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.36),
        background: `radial-gradient(circle at 30% 25%, ${lighten(color, 0.25)} 0%, ${color} 45%, ${darken(color, 0.5)} 100%)`,
        boxShadow: ring
          ? `0 0 0 2px #0F1B2D, 0 0 0 3.5px #D4A843, 0 0 18px ${color}`
          : `inset 0 0 0 1.5px rgba(255, 240, 200, 0.35), 0 0 0 1px rgba(212, 168, 67, 0.35)`,
        textShadow: '0 1px 2px rgba(0,0,0,0.45)',
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
