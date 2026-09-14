'use client';

import type { ReactNode } from 'react';
import { cn, rgba } from '../../lib/utils';

export function StatCard({ label, children, sub, accent = '#D4A843', className }: { label: string; children: ReactNode; sub?: ReactNode; accent?: string; className?: string }) {
  return (
    <div className={cn('lq-card flex flex-col items-center px-2 py-4 text-center', className)} style={{ borderColor: rgba(accent, 0.4), boxShadow: `inset 0 1px 0 ${rgba(accent, 0.25)}` }}>
      <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50 sm:text-[11px]">{label}</p>
      <div className="scoreboard mt-1.5 text-[26px] leading-none sm:text-4xl">{children}</div>
      {sub && <div className="mt-1.5 text-[11px] text-white/45">{sub}</div>}
    </div>
  );
}
