'use client';

import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Crest } from './Crest';

export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('inline-block animate-spin rounded-full border-2 border-gold/25 border-t-gold', className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullScreenLoader({ label = 'Summoning the houses…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5">
      <Crest size={72} className="animate-pulse" />
      <p className="font-heading text-xs uppercase tracking-[0.3em] text-gold/70">{label}</p>
    </div>
  );
}

export function EmptyState({ title, children, icon, className }: { title: string; children?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn('lq-card-flat flex flex-col items-center px-6 py-10 text-center', className)}>
      {icon && <div className="mb-3 text-gold/70">{icon}</div>}
      <p className="font-heading text-base font-semibold text-gold-light">{title}</p>
      {children && <div className="mt-1.5 max-w-sm text-sm text-white/50">{children}</div>}
    </div>
  );
}

export function Notice({ tone = 'info', children, className }: { tone?: 'info' | 'error' | 'success'; children: ReactNode; className?: string }) {
  const tones = {
    info: 'border-gold/35 bg-gold/10 text-gold-light',
    error: 'border-red-400/40 bg-red-500/10 text-red-200',
    success: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
  };
  return <div className={cn('rounded-lg border px-3.5 py-2.5 text-sm', tones[tone], className)}>{children}</div>;
}

export function SkeletonRows({ rows = 5, height = 56 }: { rows?: number; height?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}
