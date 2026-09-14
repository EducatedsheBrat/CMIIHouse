'use client';

import { useMemo, useState } from 'react';
import type { AppUser } from '../../lib/types';
import { cn } from '../../lib/utils';
import { Avatar } from '../shared/Avatar';

interface UnsortedQueueProps {
  students: AppUser[];
  currentId: string | null;
  disabled: boolean;
  onSelect: (id: string) => void;
}

/** Students waiting to be sorted. A horizontal strip on phones, a column on desktop. */
export function UnsortedQueue({ students, currentId, disabled, onSelect }: UnsortedQueueProps) {
  const [term, setTerm] = useState('');
  const visible = useMemo(() => {
    const q = term.trim().toLowerCase();
    return q ? students.filter((s) => s.displayName.toLowerCase().includes(q) || s.email.includes(q)) : students;
  }, [students, term]);

  return (
    <section className="lq-card flex min-h-0 flex-col p-3 lg:max-h-[calc(100vh-12rem)]" aria-label="Unsorted students">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-gold-light">Awaiting sorting</h2>
        <span className="scoreboard rounded-md border border-gold/30 px-2 py-0.5 text-xs text-gold-light">{students.length}</span>
      </div>
      {students.length > 8 && (
        <input type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Find a student…" className="input mb-2 py-1.5 text-sm" aria-label="Find a student" />
      )}
      {students.length === 0 ? (
        <p className="px-1 py-3 text-sm text-white/45">Everyone has a house.</p>
      ) : (
        <ul className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scroll-thin lg:flex-col lg:overflow-y-auto lg:overflow-x-visible">
          {visible.map((s) => {
            const active = s.id === currentId;
            return (
              <li key={s.id} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  disabled={disabled && !active}
                  aria-current={active || undefined}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition disabled:opacity-40',
                    active ? 'border-gold bg-gold/15 shadow-[0_0_18px_-6px_rgba(212,168,67,0.8)]' : 'border-white/[0.07] bg-white/[0.03] hover:border-gold/35',
                  )}
                >
                  <Avatar name={s.displayName} size={32} ring={active} />
                  <span className="min-w-0 max-w-[9rem] lg:max-w-none">
                    <span className={cn('block truncate text-sm font-semibold', active ? 'text-gold-light' : 'text-white')}>{s.displayName}</span>
                    <span className="hidden truncate text-[11px] text-white/40 lg:block">{s.email}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
