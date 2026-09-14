'use client';

import { useEffect, useState } from 'react';
import { collection, count, getAggregateFromServer, query, sum, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useHouses } from '../../hooks/useHouses';
import { firestoreErrorMessage } from '../../hooks/usePoints';
import { useStudents } from '../../hooks/useStudents';
import { CATEGORIES, CATEGORY_KEYS, HOUSES, HOUSE_IDS, type CategoryKey, type HouseId } from '../../lib/constants';
import { countMembers } from '../../lib/sorting';
import type { Season } from '../../lib/types';
import { formatPoints, lighten, rgba } from '../../lib/utils';
import { CategoryIcon } from '../shared/CategoryIcon';
import { Panther } from '../shared/Panther';
import { Notice, SkeletonRows, Spinner } from '../shared/States';
import { AdminSection } from './AdminSection';

type Breakdown = Record<HouseId, Record<CategoryKey, { total: number; awards: number }>>;

/** Sums every house × category with server-side aggregation (20 cheap queries, no document downloads). */
async function loadBreakdown(seasonId: string): Promise<Breakdown> {
  const pairs = HOUSE_IDS.flatMap((h) => CATEGORY_KEYS.map((c) => [h, c] as const));
  const results = await Promise.all(
    pairs.map(([houseId, category]) =>
      getAggregateFromServer(
        query(collection(db, 'points'), where('seasonId', '==', seasonId), where('houseId', '==', houseId), where('category', '==', category)),
        { total: sum('amount'), awards: count() },
      ),
    ),
  );
  const out = {} as Breakdown;
  pairs.forEach(([houseId, category], i) => {
    out[houseId] ??= {} as Breakdown[HouseId];
    const data = results[i].data();
    out[houseId][category] = { total: data.total ?? 0, awards: data.awards };
  });
  return out;
}

export function HouseStats({ activeSeason }: { activeSeason: Season | null }) {
  const { houses } = useHouses();
  const { sorted, unsorted, loading: studentsLoading } = useStudents(activeSeason?.id ?? null);
  const counts = countMembers(sorted);
  const seasonId = activeSeason?.id ?? null;
  // Each fetch is tagged with the request it answers; Refresh just bumps the nonce.
  const [nonce, setNonce] = useState(0);
  const requestKey = `${seasonId}#${nonce}`;
  const [stats, setStats] = useState<{ key: string; seasonId: string; breakdown: Breakdown | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!seasonId) return;
    let cancelled = false;
    const key = `${seasonId}#${nonce}`;
    loadBreakdown(seasonId).then(
      (breakdown) => {
        if (!cancelled) setStats({ key, seasonId, breakdown, error: null });
      },
      (err) => {
        if (!cancelled) {
          setStats((prev) => ({ key, seasonId, breakdown: prev?.seasonId === seasonId ? prev.breakdown : null, error: firestoreErrorMessage(err) }));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [seasonId, nonce]);

  const loading = !!seasonId && stats?.key !== requestKey;
  // Keep showing the last numbers for this season while a refresh is in flight.
  const breakdown = stats?.seasonId === seasonId ? stats.breakdown : null;
  const error = stats?.key === requestKey ? stats.error : null;
  const refresh = () => setNonce((n) => n + 1);

  if (!activeSeason) return <Notice tone="info">House stats appear once a season is active.</Notice>;

  const totalPoints = houses.reduce((s, h) => s + h.totalPoints, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Students', value: sorted.length + unsorted.length },
          { label: 'Sorted', value: sorted.length },
          { label: 'Unsorted', value: unsorted.length },
          { label: 'Points awarded', value: totalPoints },
        ].map((s) => (
          <div key={s.label} className="lq-card px-4 py-3 text-center">
            <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">{s.label}</p>
            <p className="scoreboard mt-1 text-2xl">{studentsLoading ? '—' : formatPoints(s.value)}</p>
          </div>
        ))}
      </div>

      <AdminSection
        title="Houses at a glance"
        description="Members and points by category for the active season."
        actions={
          <button type="button" className="btn btn-ghost btn-sm" onClick={refresh} disabled={loading}>
            {loading && <Spinner size={12} />}
            Refresh
          </button>
        }
      >
        {error && <Notice tone="error" className="mb-3">{error}</Notice>}
        {!breakdown && loading ? (
          <SkeletonRows rows={4} height={120} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {HOUSE_IDS.map((id) => {
              const house = HOUSES[id];
              const standing = houses.find((h) => h.id === id);
              const cats = breakdown?.[id];
              const houseTotal = cats ? CATEGORY_KEYS.reduce((s, k) => s + cats[k].total, 0) : standing?.totalPoints ?? 0;
              const members = counts[id];
              return (
                <article key={id} className="relative overflow-hidden rounded-card border p-4" style={{ borderColor: rgba(house.color, 0.45), background: `linear-gradient(160deg, ${rgba(house.color, 0.14)}, rgba(12,29,62,0.9) 55%)` }}>
                  <div className="flex items-center gap-3">
                    <Panther house={id} glow className="w-24 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl font-bold" style={{ color: lighten(house.color, 0.2) }}>
                        {house.name}
                      </h3>
                      <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-white/50">{house.motto}</p>
                    </div>
                    <div className="text-right">
                      <p className="scoreboard text-2xl leading-none">{formatPoints(standing?.totalPoints ?? 0)}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/45">points</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                    <span>
                      <span className="scoreboard text-sm text-white">{members}</span> members
                    </span>
                    <span>
                      <span className="scoreboard text-sm text-white">{members ? formatPoints((standing?.totalPoints ?? 0) / members) : 0}</span> avg per member
                    </span>
                  </div>

                  {/* Stacked category bar */}
                  <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-white/[0.07]" role="img" aria-label={`${house.name} points by category`}>
                    {cats &&
                      houseTotal > 0 &&
                      CATEGORY_KEYS.map((k) =>
                        cats[k].total > 0 ? <span key={k} style={{ width: `${(cats[k].total / houseTotal) * 100}%`, background: CATEGORIES[k].color }} title={`${CATEGORIES[k].label}: ${cats[k].total}`} /> : null,
                      )}
                  </div>

                  <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3">
                    {CATEGORY_KEYS.map((k) => {
                      const cat = CATEGORIES[k];
                      const v = cats?.[k];
                      return (
                        <li key={k} className="flex items-center gap-1.5 text-xs">
                          <span style={{ color: lighten(cat.color, 0.25) }}>
                            <CategoryIcon category={k} size={13} />
                          </span>
                          <span className="truncate text-white/55">{cat.shortLabel}</span>
                          <span className="scoreboard ml-auto text-white">{v ? formatPoints(v.total) : '—'}</span>
                        </li>
                      );
                    })}
                  </ul>
                  {cats && houseTotal !== (standing?.totalPoints ?? 0) && (
                    <p className="mt-2 text-[11px] text-gold/80">Award log totals {formatPoints(houseTotal)} — use “Recalculate totals” on the Seasons tab if this persists.</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </AdminSection>
    </div>
  );
}
