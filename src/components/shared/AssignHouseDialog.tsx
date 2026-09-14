'use client';

import { useState } from 'react';
import { assignHouse } from '../../lib/adminActions';
import { HOUSES, HOUSE_IDS, type HouseId } from '../../lib/constants';
import type { AppUser } from '../../lib/types';
import { cn, darken, formatPoints, rgba } from '../../lib/utils';
import { Panther } from './Panther';
import { Spinner } from './States';
import { useToast } from './Toast';

interface AssignHouseDialogProps {
  student: AppUser | null;
  counts?: Partial<Record<HouseId, number>>;
  onClose: () => void;
}

/** Admin direct assignment — transfers, late adds, corrections. Bypasses the ceremony. */
export function AssignHouseDialog({ student, counts, onClose }: AssignHouseDialogProps) {
  // Keyed by student so switching students starts with a clean choice.
  return student ? <AssignDialog key={student.id} student={student} counts={counts} onClose={onClose} /> : null;
}

function AssignDialog({ student, counts, onClose }: AssignHouseDialogProps & { student: AppUser }) {
  const toast = useToast();
  const [choice, setChoice] = useState<HouseId | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPoints = student.sorted && student.totalPoints > 0;

  const save = async () => {
    if (!choice) return;
    setBusy(true);
    setError(null);
    try {
      const { moved } = await assignHouse(student, choice);
      toast(`${student.displayName} is now in ${HOUSES[choice].name}${moved ? ` — ${formatPoints(moved)} points moved with them` : ''}.`, 'success');
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-royal-night/80 p-4 backdrop-blur-sm animate-fade-in sm:items-center" onClick={() => !busy && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="assign-title" className="parchment w-full max-w-lg p-6 animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <h2 id="assign-title" className="font-display text-xl font-bold">
          Assign a house
        </h2>
        <p className="mt-1 text-sm text-parchment-ink/75">
          <strong>{student.displayName}</strong> · {student.sorted && student.houseId ? `currently ${HOUSES[student.houseId].name}` : 'unsorted'}
        </p>
        <div className="my-3 h-px bg-gradient-to-r from-transparent via-gold-dark/60 to-transparent" />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="House">
          {HOUSE_IDS.map((id) => {
            const house = HOUSES[id];
            const selected = choice === id;
            const isCurrent = student.sorted && student.houseId === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={isCurrent || busy}
                onClick={() => setChoice(id)}
                className={cn('flex flex-col items-center rounded-lg border-2 px-1 pb-2 pt-1 transition disabled:opacity-40', selected ? 'scale-[1.03]' : 'hover:scale-[1.02]')}
                style={{
                  borderColor: selected ? house.color : 'rgba(58,41,19,0.15)',
                  background: selected ? `linear-gradient(180deg, ${rgba(house.color, 0.3)}, ${rgba(house.color, 0.12)})` : 'rgba(255,255,255,0.35)',
                }}
              >
                <Panther house={id} className="w-full max-w-[84px]" />
                <span className="mt-0.5 font-display text-sm font-bold" style={{ color: darken(house.color, 0.35) }}>
                  {house.name}
                </span>
                {counts && <span className="text-[10px] text-parchment-ink/60">{counts[id] ?? 0} members</span>}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs leading-relaxed text-parchment-ink/70">
          This skips the sorting ceremony and marks them sorted.
          {hasPoints && ` Their ${formatPoints(student.totalPoints)} points this season move to the new house.`}
        </p>
        {error && <p className="mt-3 rounded-md bg-red-700/10 px-3 py-2 text-sm text-red-800">{error}</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-parchment-ink/60 hover:text-parchment-ink" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-color" style={{ ['--btn' as string]: '#1A2940', color: '#fff' }} disabled={!choice || busy} onClick={save}>
            {busy && <Spinner size={14} className="border-white/30 border-t-white" />}
            {choice ? `Assign to ${HOUSES[choice].name}` : 'Choose a house'}
          </button>
        </div>
      </div>
    </div>
  );
}
