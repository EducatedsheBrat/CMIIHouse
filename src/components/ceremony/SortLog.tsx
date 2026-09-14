'use client';

import type { SortLogEntry } from '../../hooks/useSorting';
import { HOUSES, HOUSE_IDS } from '../../lib/constants';
import type { HouseCounts } from '../../lib/sorting';
import { lighten, rgba } from '../../lib/utils';
import { Avatar } from '../shared/Avatar';
import { HouseBadge } from '../shared/HouseBadge';
import { Panther } from '../shared/Panther';

interface SortLogProps {
  log: SortLogEntry[];
  counts: HouseCounts;
  canUndo: boolean;
  onUndo: () => void;
}

/** House balance plus everyone sorted this session, newest first. */
export function SortLog({ log, counts, canUndo, onUndo }: SortLogProps) {
  const max = Math.max(1, ...HOUSE_IDS.map((id) => counts[id]));

  return (
    <section className="lq-card flex min-h-0 flex-col p-3 lg:max-h-[calc(100vh-12rem)]" aria-label="Sorting results">
      <h2 className="mb-2 px-1 font-heading text-xs font-bold uppercase tracking-[0.18em] text-gold-light">House balance</h2>
      <div className="grid grid-cols-4 gap-1.5">
        {HOUSE_IDS.map((id) => {
          const house = HOUSES[id];
          return (
            <div key={id} className="flex flex-col items-center rounded-lg border px-1 pb-2 pt-1.5" style={{ borderColor: rgba(house.color, 0.35), background: rgba(house.color, 0.08) }}>
              <Panther house={id} className="w-full max-w-[64px]" />
              <span className="scoreboard mt-1 text-lg leading-none">{counts[id]}</span>
              <span className="mt-0.5 font-heading text-[9px] font-bold uppercase tracking-wider" style={{ color: lighten(house.color, 0.35) }}>
                {house.name}
              </span>
              <span className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${(counts[id] / max) * 100}%`, background: house.color }} />
              </span>
            </div>
          );
        })}
      </div>

      <div className="mb-2 mt-4 flex items-center justify-between gap-2 px-1">
        <h2 className="whitespace-nowrap font-heading text-xs font-bold uppercase tracking-[0.14em] text-gold-light">Sorted this session</h2>
        {log.length > 0 && (
          <button type="button" onClick={onUndo} disabled={!canUndo} className="btn-text shrink-0 whitespace-nowrap text-[10px] disabled:opacity-30" title="Return the most recent student to the queue">
            ↶ Undo
          </button>
        )}
      </div>
      {log.length === 0 ? (
        <p className="px-1 py-2 text-sm text-white/45">Results appear here as students are sorted.</p>
      ) : (
        <ol className="space-y-1.5 overflow-y-auto pr-1 scroll-thin">
          {log.map((entry, i) => (
            <li
              key={`${entry.student.id}-${entry.at.getTime()}`}
              className="flex items-center gap-2.5 rounded-lg border px-2.5 py-2 animate-fade-up"
              style={{ borderColor: rgba(HOUSES[entry.houseId].color, i === 0 ? 0.6 : 0.2), background: i === 0 ? rgba(HOUSES[entry.houseId].color, 0.1) : undefined }}
            >
              <Avatar name={entry.student.displayName} houseId={entry.houseId} size={30} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{entry.student.displayName}</p>
                <HouseBadge houseId={entry.houseId} size="xs" className="mt-0.5" />
              </div>
              <time className="text-[10px] text-white/35">{entry.at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
