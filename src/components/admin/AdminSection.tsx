'use client';

import type { ReactNode } from 'react';

export function AdminSection({ title, description, children, actions }: { title: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="lq-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-bold text-gold-light">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-white/50">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
