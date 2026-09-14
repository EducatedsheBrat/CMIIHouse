'use client';

import { HOUSES, isHouseId } from '../../lib/constants';
import { cn, lighten, rgba } from '../../lib/utils';
import { HouseIconSvg } from './HouseIcon';

export function HouseBadge({ houseId, size = 'sm', className }: { houseId: string | null | undefined; size?: 'xs' | 'sm' | 'md'; className?: string }) {
  if (!isHouseId(houseId)) {
    return <span className={cn('chip border-white/15 text-white/50', className)}>Unsorted</span>;
  }
  const house = HOUSES[houseId];
  const dims = { xs: { icon: 11, text: 'text-[10px] px-1.5 py-0.5' }, sm: { icon: 13, text: 'text-[11px] px-2 py-0.5' }, md: { icon: 16, text: 'text-xs px-2.5 py-1' } }[size];
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-[5px] border font-heading font-bold uppercase tracking-[0.1em]', dims.text, className)}
      style={{ color: lighten(house.color, 0.35), borderColor: rgba(house.color, 0.55), background: rgba(house.color, 0.14) }}
    >
      <HouseIconSvg kind={house.icon} size={dims.icon} />
      {house.name}
    </span>
  );
}
