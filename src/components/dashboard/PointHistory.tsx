'use client';

import { CATEGORIES } from '../../lib/constants';
import type { PointAward } from '../../lib/types';
import { formatDate, lighten, rgba } from '../../lib/utils';
import { CategoryIcon } from '../shared/CategoryIcon';
import { EmptyState, SkeletonRows } from '../shared/States';

export function PointHistory({ points, loading }: { points: PointAward[]; loading: boolean }) {
  if (loading) return <SkeletonRows rows={4} height={72} />;
  if (points.length === 0) {
    return (
      <EmptyState title="Your legend begins soon">
        Show up, lead, create, and serve — every point you earn is added to your house’s tally.
      </EmptyState>
    );
  }

  return (
    <ul className="lq-card divide-y divide-white/[0.06] overflow-hidden">
      {points.map((p) => {
        const cat = CATEGORIES[p.category];
        return (
          <li key={p.id} className="flex gap-3 px-4 py-3.5">
            <span
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
              style={{ borderColor: rgba(cat.color, 0.6), background: rgba(cat.color, 0.14), color: lighten(cat.color, 0.3) }}
            >
              <CategoryIcon category={p.category} size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-medium">{cat.label}</p>
                <p className="scoreboard text-lg" style={{ color: lighten(cat.color, 0.3) }}>
                  +{p.amount}
                </p>
              </div>
              {p.note && <p className="mt-0.5 text-sm text-white/65">{p.note}</p>}
              <p className="mt-1 text-[11px] text-white/40">
                {formatDate(p.awardedAt)} · by {p.awardedByName ?? p.awardedBy}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
