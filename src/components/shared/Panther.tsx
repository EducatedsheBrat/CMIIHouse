'use client';

import { useId, useMemo, type CSSProperties } from 'react';
import * as panthers from '../../assets/panthers';
import { HOUSES, isHouseId, type HouseId } from '../../lib/constants';
import { cn, rgba } from '../../lib/utils';

const SVGS: Record<HouseId | 'neutral', string> = {
  neutral: panthers.neutral,
  lumina: panthers.lumina,
  doron: panthers.doron,
  ase: panthers.ase,
  kaizen: panthers.kaizen,
};
const runSpriteSvg = panthers.runSprite;

/** Gives each inlined copy its own gradient ids so several panthers can share a page. */
function scopeIds(svg: string, uid: string) {
  return svg.replace(/lqpid-/g, `lqpid-${uid}-`);
}

interface PantherProps {
  /** A house for its signature pose, or null/undefined for the neutral black panther. */
  house?: HouseId | string | null;
  /** Rendered width in px (height follows the 10:7 artwork). Omit to fill the container. */
  size?: number;
  glow?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Decorative panthers are hidden from screen readers. */
  decorative?: boolean;
}

/** A house panther mascot (48px badges up to 200px+ reveals). */
export function Panther({ house, size, glow = false, className, style, decorative = true }: PantherProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const key = isHouseId(house) ? house : 'neutral';
  const html = useMemo(() => scopeIds(SVGS[key], uid), [key, uid]);
  const color = key === 'neutral' ? '#8E97AA' : HOUSES[key].color;

  return (
    <span
      className={cn('lq-panther-wrap', className)}
      style={{
        width: size,
        filter: glow ? `drop-shadow(0 0 ${size ? Math.max(4, size / 18) : 8}px ${rgba(color, 0.55)})` : undefined,
        ...style,
      }}
      aria-hidden={decorative || undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** The neutral panther with its CSS-driven run cycle (used by the sorting ceremony). */
export function RunningPantherSvg({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const html = useMemo(() => scopeIds(runSpriteSvg, uid), [uid]);
  return <span className={cn('lq-panther-wrap', className)} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}
