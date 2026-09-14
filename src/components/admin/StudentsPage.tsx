'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useActiveSeason } from '../../hooks/useSeason';
import { useStudents } from '../../hooks/useStudents';
import { removeUser } from '../../lib/adminActions';
import { HOUSES, HOUSE_IDS, type HouseId } from '../../lib/constants';
import { countMembers } from '../../lib/sorting';
import type { AppUser } from '../../lib/types';
import { cn, formatPoints, rgba, seasonLabel } from '../../lib/utils';
import { NavIcon } from '../layout/NavIcons';
import { AssignHouseDialog } from '../shared/AssignHouseDialog';
import { Avatar } from '../shared/Avatar';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { HouseBadge } from '../shared/HouseBadge';
import { PageHeader } from '../shared/PageHeader';
import { EmptyState, Notice, SkeletonRows } from '../shared/States';
import { useToast } from '../shared/Toast';
import { AdminSection } from './AdminSection';
import { StudentAddForm } from './StudentAddForm';
import { StudentImport } from './StudentImport';

type Filter = 'all' | 'unsorted' | HouseId;

export function StudentsPage() {
  const toast = useToast();
  const { season } = useActiveSeason();
  const { users: students, sorted, unsorted, loading } = useStudents();
  const existingIds = useMemo(() => new Set(students.map((s) => s.id)), [students]);
  const counts = useMemo(() => countMembers(sorted), [sorted]);

  const [filter, setFilter] = useState<Filter>('all');
  const [term, setTerm] = useState('');
  const [assigning, setAssigning] = useState<AppUser | null>(null);
  const [removing, setRemoving] = useState<AppUser | null>(null);

  const visible = useMemo(() => {
    const q = term.trim().toLowerCase();
    return students
      .filter((s) => (filter === 'all' ? true : filter === 'unsorted' ? !s.sorted : s.sorted && s.houseId === filter))
      .filter((s) => !q || s.displayName.toLowerCase().includes(q) || s.email.includes(q))
      .slice(0, 300);
  }, [students, filter, term]);

  const filters: Array<{ key: Filter; label: string; count: number; color?: string }> = [
    { key: 'all', label: 'All', count: students.length },
    { key: 'unsorted', label: 'Unsorted', count: unsorted.length },
    ...HOUSE_IDS.map((id) => ({ key: id as Filter, label: HOUSES[id].name, count: counts[id], color: HOUSES[id].color })),
  ];

  return (
    <div>
      <Link href="/admin" className="btn-text mb-3">
        ← Council Chamber
      </Link>
      <PageHeader
        eyebrow={season ? seasonLabel(season) : 'Administration'}
        title="Students"
        subtitle="Add students to the rolls. They stay unsorted until the sorting ceremony."
        actions={
          <Link href="/ceremony" className="btn btn-gold btn-sm">
            <NavIcon name="ceremony" size={16} /> Sorting ceremony
          </Link>
        }
      />

      {!season && !loading && <Notice tone="error" className="mb-5">Activate a season before adding students — new students are enrolled in the active season.</Notice>}

      {unsorted.length > 0 && (
        <Notice tone="info" className="mb-5">
          {unsorted.length} student{unsorted.length === 1 ? ' is' : 's are'} waiting to be sorted.{' '}
          <Link href="/ceremony" className="font-semibold underline underline-offset-2">
            Open the sorting ceremony
          </Link>
        </Notice>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <StudentImport activeSeason={season} existingIds={existingIds} />
        <StudentAddForm activeSeason={season} />
      </div>

      <div className="mt-5">
        <AdminSection
          title={`Students on the rolls (${students.length})`}
          actions={<input type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search…" className="input max-w-[220px] py-1.5 text-sm" aria-label="Search students" />}
        >
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 scroll-thin">
            {filters.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn('chip shrink-0 font-heading uppercase tracking-wider', !f.color && (active ? 'border-gold bg-gold/15 text-gold-light' : 'border-white/15 text-white/50 hover:text-white'))}
                  style={f.color ? { borderColor: active ? f.color : 'rgba(255,255,255,0.15)', background: active ? rgba(f.color, 0.18) : undefined, color: active ? f.color : 'rgba(255,255,255,0.55)' } : undefined}
                >
                  {f.label} <span className="scoreboard opacity-70">{f.count}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <SkeletonRows rows={5} />
          ) : visible.length === 0 ? (
            <EmptyState title={students.length ? 'No students match' : 'No students yet'}>{students.length ? undefined : 'Import a CSV or add students above.'}</EmptyState>
          ) : (
            <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-lg border border-white/10">
              {visible.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 sm:flex-nowrap">
                  <Avatar name={s.displayName} houseId={s.houseId} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.displayName}</p>
                    <p className="truncate text-xs text-white/40">
                      {s.email}
                      {season && s.seasonId !== season.id && <span className="text-gold/70"> · {s.seasonId || 'no season'}</span>}
                    </p>
                  </div>
                  {s.sorted ? <HouseBadge houseId={s.houseId} size="xs" /> : <span className="chip border-gold/40 text-[10px] font-heading uppercase tracking-wider text-gold/80">Unsorted</span>}
                  <span className="scoreboard w-12 text-right text-sm">{formatPoints(s.totalPoints)}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setAssigning(s)} className="btn btn-ghost btn-sm" title="Assign a house directly">
                      {s.sorted ? 'Move' : 'Assign'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoving(s)}
                      disabled={s.totalPoints > 0}
                      title={s.totalPoints > 0 ? 'Revoke their awards in the audit log before removing' : 'Remove student'}
                      className="rounded p-1.5 text-white/35 transition hover:text-red-300 disabled:opacity-30 disabled:hover:text-white/35"
                      aria-label={`Remove ${s.displayName}`}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminSection>
      </div>

      <AssignHouseDialog student={assigning} counts={counts} onClose={() => setAssigning(null)} />

      <ConfirmDialog
        open={!!removing}
        title="Remove this student?"
        tone="danger"
        confirmLabel="Remove"
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (!removing) return;
          await removeUser(removing);
          toast(`${removing.displayName} was removed.`, 'success');
        }}
      >
        {removing?.displayName} ({removing?.email}) will be taken off the house rolls and won’t be able to sign in.
      </ConfirmDialog>
    </div>
  );
}
