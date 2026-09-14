'use client';

import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { OrnamentalDivider } from './OrnamentalDivider';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6 animate-fade-up', className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h1 className="font-display text-[28px] font-bold leading-tight text-gold-gradient sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-white/55">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <OrnamentalDivider className="mt-4" />
    </header>
  );
}
