'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useSearchParam } from '../../hooks/useSearchParam';
import { useHouses } from '../../hooks/useHouses';
import { useActiveSeason } from '../../hooks/useSeason';
import { useFaculty, useStudents } from '../../hooks/useStudents';
import { HOUSES, isHouseId, type HouseId } from '../../lib/constants';
import { countMembers } from '../../lib/sorting';
import type { AppUser } from '../../lib/types';
import { formatPoints, rgba } from '../../lib/utils';
import { NavIcon } from '../layout/NavIcons';
import { AnimatedNumber } from '../shared/AnimatedNumber';
import { AssignHouseDialog } from '../shared/AssignHouseDialog';
import { Crown } from '../shared/Crown';
import { GoldBorder } from '../shared/GoldBorder';
import { PageHeader } from '../shared/PageHeader';
import { Panther } from '../shared/Panther';
import { Shield } from '../shared/Shield';
import { EmptyState, Notice, SkeletonRows } from '../shared/States';
import { HouseFilter } from './HouseFilter';
import { StudentRow } from './StudentRow';

export function Roster() {
  const [houseParam, setHouseParam] = useSearchParam('house');
  const houseId: HouseId = isHouseId(houseParam) ? houseParam : 'lumina';
  const meta = HOUSES[houseId];
  const [term, setTerm] = useState('');

  const { role } = useAuth();
  const { season, loading: seasonLoading } = useActiveSeason();
  const { sorted: students, unsorted, loading } = useStudents(seasonLoading ? null : season?.id ?? null);
  const { users: faculty } = useFaculty();
  const { houses } = useHouses();
  const house = houses.find((h) => h.id === houseId);
  const [assigning, setAssigning] = useState<AppUser | null>(null);

  const counts = useMemo(() => countMembers(students), [students]);

  const members = useMemo(
    () => students.filter((s) => s.houseId === houseId).sort((a, b) => b.totalPoints - a.totalPoints || a.displayName.localeCompare(b.displayName)),
    [students, houseId],
  );

  const visible = useMemo(() => {
    const q = term.trim().toLowerCase();
    return q ? members.filter((m) => m.displayName.toLowerCase().includes(q) || m.email.includes(q)) : members;
  }, [members, term]);

  const advisors = faculty.filter((f) => house?.advisors.includes(f.id));

  return (
    <div>
      <PageHeader
        eyebrow={season?.name ?? 'Faculty'}
        title="House Rosters"
        actions={
          <Link href="/ceremony" className="btn btn-ghost btn-sm">
            <NavIcon name="ceremony" size={15} /> Sorting ceremony
          </Link>
        }
      />

      {unsorted.length > 0 && (
        <Notice tone="info" className="mb-4">
          {unsorted.length} student{unsorted.length === 1 ? ' hasn’t' : 's haven’t'} been sorted into a house yet.{' '}
          <Link href="/ceremony" className="font-semibold underline underline-offset-2">
            Run the sorting ceremony
          </Link>
        </Notice>
      )}

      <HouseFilter value={houseId} counts={counts} onChange={(id) => setHouseParam(id)} />

      <GoldBorder glow={meta.color} className="overflow-hidden rounded-t-none border-t-0 p-5 sm:p-6" corners={false}>
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 90% at 85% 100%, ${rgba(meta.color, 0.2)}, transparent 70%)` }} />
        <div key={houseId} className="relative flex flex-col gap-5 animate-fade-in lg:flex-row lg:items-center">
          <div className="flex items-center gap-4 lg:flex-1">
            <Shield houseId={houseId} size={64} glow className="hidden shrink-0 sm:block" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-3xl font-black" style={{ color: meta.color, textShadow: `0 0 24px ${rgba(meta.color, 0.45)}` }}>
                  {meta.name}
                </h2>
                {house?.rank === 1 && house.totalPoints > 0 && <Crown size={30} />}
              </div>
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-white/60">{meta.motto}</p>
              <p className="mt-2 hidden max-w-md text-sm text-white/50 sm:block">{meta.description}</p>
              {advisors.length > 0 && (
                <p className="mt-2 text-xs text-white/45">
                  Advisor{advisors.length > 1 ? 's' : ''}: <span className="text-white/75">{advisors.map((a) => a.displayName).join(', ')}</span>
                </p>
              )}
            </div>
            <Panther house={houseId} glow className="w-28 shrink-0 sm:w-44" />
          </div>

          <div className="grid grid-cols-3 divide-x divide-gold/20 rounded-lg border border-gold/25 bg-royal/50 sm:w-80">
            <div className="px-2 py-3 text-center">
              <p className="scoreboard text-2xl">{members.length}</p>
              <p className="font-heading text-[10px] uppercase tracking-[0.16em] text-white/45">Members</p>
            </div>
            <div className="px-2 py-3 text-center">
              <AnimatedNumber value={house?.totalPoints ?? 0} className="scoreboard block text-2xl" />
              <p className="font-heading text-[10px] uppercase tracking-[0.16em] text-white/45">Points</p>
            </div>
            <div className="px-2 py-3 text-center">
              <p className="scoreboard text-2xl">{house ? `#${house.rank}` : '—'}</p>
              <p className="font-heading text-[10px] uppercase tracking-[0.16em] text-white/45">Rank</p>
            </div>
          </div>
        </div>
      </GoldBorder>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h3 className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-white/80">Members by points</h3>
        {members.length > 8 && (
          <input type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Filter…" className="input max-w-[180px] py-1.5 text-sm" aria-label="Filter members" />
        )}
      </div>

      <div className="mt-3">
        {loading || seasonLoading ? (
          <SkeletonRows rows={5} />
        ) : visible.length === 0 ? (
          <EmptyState title={members.length === 0 ? `No students sorted into ${meta.name} yet` : 'No members match'} />
        ) : (
          <ul className="lq-card overflow-hidden" style={{ borderColor: rgba(meta.color, 0.3) }}>
            {visible.map((s) => (
              <StudentRow key={s.id} student={s} rank={members.indexOf(s) + 1} onAssign={role === 'admin' ? setAssigning : undefined} />
            ))}
          </ul>
        )}
        {members.length > 0 && (
          <p className="mt-3 text-right text-xs text-white/40">
            Average {formatPoints(members.reduce((sum, m) => sum + m.totalPoints, 0) / members.length)} pts per member
          </p>
        )}
      </div>

      <AssignHouseDialog student={assigning} counts={counts} onClose={() => setAssigning(null)} />
    </div>
  );
}
