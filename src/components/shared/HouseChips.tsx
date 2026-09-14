'use client';

import { HOUSES, HOUSE_IDS, type HouseId } from '../../lib/constants';
import { cn, rgba } from '../../lib/utils';
import { HouseIconSvg } from './HouseIcon';

/** "All houses" + one chip per house; clicking the active chip clears the filter. */
export function HouseChips({ value, onChange, className }: { value: HouseId | null; onChange: (id: HouseId | null) => void; className?: string }) {
  return (
    <div className={cn('flex gap-1.5 overflow-x-auto pb-1 scroll-thin', className)}>
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn('chip shrink-0 font-heading uppercase tracking-wider', value === null ? 'border-gold bg-gold/15 text-gold-light' : 'border-white/15 text-white/50 hover:text-white')}
      >
        All houses
      </button>
      {HOUSE_IDS.map((id) => {
        const meta = HOUSES[id];
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(active ? null : id)}
            className="chip shrink-0 font-heading uppercase tracking-wider"
            style={{
              borderColor: active ? meta.color : 'rgba(255,255,255,0.15)',
              background: active ? rgba(meta.color, 0.18) : undefined,
              color: active ? meta.color : 'rgba(255,255,255,0.55)',
            }}
          >
            <HouseIconSvg kind={meta.icon} size={13} />
            {meta.name}
          </button>
        );
      })}
    </div>
  );
}
