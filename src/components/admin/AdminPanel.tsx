'use client';

import Link from 'next/link';
import { useSearchParam } from '../../hooks/useSearchParam';
import { useActiveSeason } from '../../hooks/useSeason';
import { useStudents } from '../../hooks/useStudents';
import { HOUSE_IDS } from '../../lib/constants';
import { cn, seasonLabel } from '../../lib/utils';
import { NavIcon } from '../layout/NavIcons';
import { PageHeader } from '../shared/PageHeader';
import { Panther } from '../shared/Panther';
import { AuditLog } from './AuditLog';
import { FacultyManager } from './FacultyManager';
import { HouseStats } from './HouseStats';
import { SeasonManager } from './SeasonManager';

const TABS = [
  { key: 'stats', label: 'House Stats' },
  { key: 'seasons', label: 'Seasons' },
  { key: 'faculty', label: 'Faculty' },
  { key: 'audit', label: 'Audit Log' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

export function AdminPanel() {
  const [tabParam, setTab] = useSearchParam('tab');
  const tab = (TABS.find((t) => t.key === tabParam)?.key ?? 'stats') as TabKey;
  const { season, loading } = useActiveSeason();
  const { users: students, unsorted } = useStudents(loading ? null : season?.id ?? null);

  return (
    <div>
      <PageHeader eyebrow="Administration" title="The Council Chamber" subtitle={loading ? ' ' : season ? `Active season: ${seasonLabel(season)}` : 'No season is active'} />

      {/* Quick links */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link href="/admin/students" className="lq-card group flex items-center gap-4 p-4 transition hover:border-gold/60">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gold/40 bg-royal text-gold-light">
            <NavIcon name="roster" size={24} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-heading text-base font-bold text-gold-light">Students</span>
            <span className="block text-sm text-white/55">
              {students.length} on the rolls · CSV import, manual add, house assignment
            </span>
          </span>
          <span className="text-gold/60 transition group-hover:translate-x-1">→</span>
        </Link>
        <Link href="/ceremony" className="lq-card group relative flex items-center gap-4 overflow-hidden p-4 transition hover:border-gold/60">
          <div className="pointer-events-none absolute -right-6 bottom-0 flex opacity-25 transition group-hover:opacity-40">
            {HOUSE_IDS.map((id) => (
              <Panther key={id} house={id} className="-ml-6 w-24" />
            ))}
          </div>
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gold/40 bg-royal text-gold-light">
            <NavIcon name="ceremony" size={24} />
          </span>
          <span className="relative min-w-0 flex-1">
            <span className="block font-heading text-base font-bold text-gold-light">Sorting Ceremony</span>
            <span className={cn('block text-sm', unsorted.length ? 'text-gold-light' : 'text-white/55')}>
              {unsorted.length ? `${unsorted.length} student${unsorted.length === 1 ? '' : 's'} awaiting sorting` : 'Everyone has a house'}
            </span>
          </span>
          <span className="relative text-gold/60 transition group-hover:translate-x-1">→</span>
        </Link>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gold/20 scroll-thin" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'relative shrink-0 px-4 pb-3 pt-1 font-heading text-xs font-bold uppercase tracking-[0.16em] transition',
              tab === t.key ? 'text-gold-light' : 'text-white/45 hover:text-white/80',
            )}
          >
            {t.label}
            <span className={cn('absolute inset-x-2 -bottom-px h-[3px] rounded-t bg-gold transition', tab === t.key ? 'opacity-100' : 'opacity-0')} />
          </button>
        ))}
      </div>

      <div key={tab} className="animate-fade-in">
        {tab === 'stats' && <HouseStats activeSeason={season} />}
        {tab === 'seasons' && <SeasonManager activeSeason={season} />}
        {tab === 'faculty' && <FacultyManager activeSeason={season} />}
        {tab === 'audit' && <AuditLog activeSeason={season} />}
      </div>
    </div>
  );
}
