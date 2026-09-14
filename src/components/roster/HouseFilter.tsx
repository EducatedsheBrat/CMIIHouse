'use client';

import { HOUSES, HOUSE_IDS, type HouseId } from '../../lib/constants';
import { cn, darken, lighten, rgba } from '../../lib/utils';
import { HouseIconSvg } from '../shared/HouseIcon';

export function HouseFilter({ value, onChange, counts }: { value: HouseId; onChange: (id: HouseId) => void; counts?: Partial<Record<HouseId, number>> }) {
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2" role="tablist" aria-label="Houses">
      {HOUSE_IDS.map((id) => {
        const house = HOUSES[id];
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn('relative flex flex-col items-center gap-1 overflow-hidden rounded-t-lg border-x border-t px-1 pb-2.5 pt-2.5 transition sm:flex-row sm:justify-center sm:gap-2 sm:px-3', !active && 'hover:bg-white/5')}
            style={{
              borderColor: active ? rgba(house.color, 0.8) : 'rgba(255,255,255,0.08)',
              background: active ? `linear-gradient(180deg, ${rgba(house.color, 0.35)}, ${darken(house.color, 0.8)})` : 'rgba(255,255,255,0.02)',
              color: active ? lighten(house.color, 0.45) : 'rgba(255,255,255,0.5)',
              boxShadow: active ? `0 -6px 22px -10px ${house.color}` : undefined,
            }}
          >
            <HouseIconSvg kind={house.icon} size={20} />
            <span className="font-display text-[12px] font-bold sm:text-sm">{house.name}</span>
            {counts?.[id] !== undefined && <span className="hidden text-[11px] text-white/40 sm:inline">({counts[id]})</span>}
            <span className="absolute inset-x-0 bottom-0 h-[3px] transition" style={{ background: active ? house.color : 'transparent' }} />
          </button>
        );
      })}
    </div>
  );
}
