'use client';

import { cn } from '../../lib/utils';

/** Thin gold rule with a diamond at its center. Pass a label to engrave text in the middle. */
export function OrnamentalDivider({ label, className, color = '#D4A843' }: { label?: string; className?: string; color?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)} role="separator" style={{ color }}>
      <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${color}99 60%, ${color})` }} />
      <span className="h-1 w-1 rotate-45" style={{ background: `${color}99` }} />
      {label ? (
        <span className="px-1 font-heading text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color }}>
          {label}
        </span>
      ) : (
        <span className="relative flex h-3 w-3 rotate-45 items-center justify-center border" style={{ borderColor: color }}>
          <span className="h-1 w-1" style={{ background: color }} />
        </span>
      )}
      <span className="h-1 w-1 rotate-45" style={{ background: `${color}99` }} />
      <span className="h-px flex-1" style={{ background: `linear-gradient(270deg, transparent, ${color}99 60%, ${color})` }} />
    </div>
  );
}
