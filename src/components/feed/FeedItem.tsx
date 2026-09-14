'use client';

import { CATEGORIES } from '../../lib/constants';
import type { PointAward } from '../../lib/types';
import { formatDateTime, houseColor, lighten, timeAgo } from '../../lib/utils';
import { Avatar } from '../shared/Avatar';
import { HouseBadge } from '../shared/HouseBadge';
import { PointBadge } from '../shared/PointBadge';

export function FeedItem({ point, highlight = false }: { point: PointAward; highlight?: boolean }) {
  const cat = CATEGORIES[point.category];
  const color = houseColor(point.houseId);
  const name = point.studentName ?? point.studentId;

  return (
    <li className="lq-card relative overflow-hidden py-3.5 pl-4 pr-3.5 sm:pl-5" style={highlight ? { boxShadow: `0 0 0 1px ${color}, 0 0 24px -8px ${color}` } : undefined}>
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: `linear-gradient(180deg, ${lighten(color, 0.2)}, ${color})` }} />
      <div className="flex gap-3">
        <Avatar name={name} houseId={point.houseId} size={42} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[15px] leading-snug">
              <span className="font-semibold">{name}</span> <span className="text-white/60">earned</span>{' '}
              <span className="scoreboard" style={{ color: lighten(cat?.color ?? color, 0.3) }}>
                +{point.amount}
              </span>{' '}
              <span className="text-white/60">for</span> <span className="font-medium">{cat?.label ?? point.category}</span>
            </p>
            <time className="shrink-0 pt-0.5 text-[11px] text-white/40" title={formatDateTime(point.awardedAt)}>
              {timeAgo(point.awardedAt)}
            </time>
          </div>

          {point.note && <p className="mt-1.5 border-l-2 border-gold/30 pl-2.5 text-sm italic text-white/65">“{point.note}”</p>}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <HouseBadge houseId={point.houseId} size="xs" />
            <PointBadge category={point.category} showLabel />
            <span className="text-[11px] text-white/40">by {point.awardedByName ?? point.awardedBy}</span>
          </div>
        </div>
      </div>
    </li>
  );
}
