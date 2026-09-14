'use client';

import { useMemo, useState } from 'react';
import { usePointFeed } from '../../hooks/usePoints';
import { useActiveSeason } from '../../hooks/useSeason';
import { useAuth } from '../../hooks/useAuth';
import { HOUSES, type HouseId } from '../../lib/constants';
import type { PointAward } from '../../lib/types';
import { dayLabel, toDate } from '../../lib/utils';
import { HouseChips } from '../shared/HouseChips';
import { OrnamentalDivider } from '../shared/OrnamentalDivider';
import { PageHeader } from '../shared/PageHeader';
import { EmptyState, Notice, SkeletonRows, Spinner } from '../shared/States';
import { FeedItem } from './FeedItem';

function groupByDay(items: PointAward[]) {
  const groups: Array<{ label: string; items: PointAward[] }> = [];
  for (const item of items) {
    const label = dayLabel(toDate(item.awardedAt) ?? new Date());
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

export function ActivityFeed() {
  const { profile } = useAuth();
  const { season, loading: seasonLoading } = useActiveSeason();
  const [house, setHouse] = useState<HouseId | null>(null);
  const { items, loading, loadingMore, hasMore, loadMore, error } = usePointFeed({ seasonId: season?.id, houseId: house, pageSize: 20 });
  const groups = useMemo(() => groupByDay(items), [items]);

  return (
    <div>
      <PageHeader eyebrow={season?.name ?? 'Activity'} title="The Chronicle" subtitle="Every point awarded this season, as it happens." />

      <HouseChips value={house} onChange={setHouse} className="mb-5" />

      {error && <Notice tone="error" className="mb-4">{error}</Notice>}

      {loading || seasonLoading ? (
        <SkeletonRows rows={5} height={96} />
      ) : !season ? (
        <EmptyState title="No active season">Awards will appear here once a season is underway.</EmptyState>
      ) : items.length === 0 ? (
        <EmptyState title="The chronicle is empty">No points have been awarded{house ? ` to ${HOUSES[house].name}` : ''} yet this season.</EmptyState>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.label}>
              <OrnamentalDivider label={group.label} className="mb-3" />
              <ul className="space-y-2.5">
                {group.items.map((p) => (
                  <FeedItem key={p.id} point={p} highlight={!!profile && p.studentId === profile.id} />
                ))}
              </ul>
            </section>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button type="button" onClick={loadMore} disabled={loadingMore} className="btn btn-ghost">
                {loadingMore && <Spinner size={14} />}
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
