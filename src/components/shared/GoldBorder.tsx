'use client';

import type { CSSProperties, ReactNode } from 'react';
import { cn, rgba } from '../../lib/utils';

interface GoldBorderProps {
  children: ReactNode;
  className?: string;
  /** Tints the outer glow, e.g. with a house color. */
  glow?: string;
  corners?: boolean;
  style?: CSSProperties;
  as?: 'div' | 'section' | 'article' | 'header';
}

/** Double-line ornamental frame with diamond corner studs, echoing the deck's gilded panels. */
export function GoldBorder({ children, className, glow, corners = true, style, as: Tag = 'div' }: GoldBorderProps) {
  return (
    <Tag
      className={cn('gold-frame', className)}
      style={{ ...(glow ? ({ '--frame-glow': rgba(glow, 0.4) } as CSSProperties) : {}), ...style }}
    >
      {corners && (
        <>
          <span className="corner-ornament -left-[5px] -top-[5px]" />
          <span className="corner-ornament -right-[5px] -top-[5px]" />
          <span className="corner-ornament -bottom-[5px] -left-[5px]" />
          <span className="corner-ornament -bottom-[5px] -right-[5px]" />
        </>
      )}
      {children}
    </Tag>
  );
}
