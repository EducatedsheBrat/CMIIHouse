'use client';

import { useMemo, useState } from 'react';
import type { HouseId } from '../../lib/constants';
import type { AppUser } from '../../lib/types';
import { formatPoints } from '../../lib/utils';
import { Avatar } from '../shared/Avatar';
import { HouseBadge } from '../shared/HouseBadge';
import { HouseChips } from '../shared/HouseChips';
import { EmptyState, SkeletonRows } from '../shared/States';

interface StudentSearchProps {
  students: AppUser[];
  loading: boolean;
  onSelect: (student: AppUser) => void;
}

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function StudentSearch({ students, loading, onSelect }: StudentSearchProps) {
  const [term, setTerm] = useState('');
  const [house, setHouse] = useState<HouseId | null>(null);

  const results = useMemo(() => {
    const q = normalize(term.trim());
    return students.filter((s) => (!house || s.houseId === house) && (!q || normalize(s.displayName).includes(q) || s.email.includes(q)));
  }, [students, term, house]);

  return (
    <div>
      <div className="relative">
        <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gold/60" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5 L20.5 20.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search students by name…"
          className="input pl-11 text-base"
          aria-label="Search students"
          autoComplete="off"
        />
      </div>

      <HouseChips value={house} onChange={setHouse} className="mt-3" />

      <div className="mt-3">
        {loading ? (
          <SkeletonRows rows={6} height={60} />
        ) : results.length === 0 ? (
          <EmptyState title={students.length === 0 ? 'No students on the rolls yet' : 'No students match'}>
            {students.length === 0 ? 'An admin can import students from the Admin panel.' : 'Try a different name or house.'}
          </EmptyState>
        ) : (
          <ul className="max-h-[60vh] space-y-1.5 overflow-y-auto pr-1 scroll-thin md:max-h-[560px]">
            {results.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onSelect(s)}
                  className="group flex w-full items-center gap-3 rounded-lg border border-transparent bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-gold/35 hover:bg-white/[0.06] active:scale-[0.99]"
                >
                  <Avatar name={s.displayName} houseId={s.houseId} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{s.displayName}</p>
                    <HouseBadge houseId={s.houseId} size="xs" className="mt-0.5" />
                  </div>
                  <div className="text-right">
                    <p className="scoreboard text-base">{formatPoints(s.totalPoints)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">pts</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
