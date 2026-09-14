'use client';

import { useMemo, useState } from 'react';
import { revokePoint, usePointFeed } from '../../hooks/usePoints';
import { useSeasons } from '../../hooks/useSeason';
import { CATEGORIES, CATEGORY_KEYS, HOUSES, isCategoryKey, type CategoryKey, type HouseId } from '../../lib/constants';
import type { PointAward, Season } from '../../lib/types';
import { downloadCsv, formatDateTime, formatPoints, toDate } from '../../lib/utils';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { HouseBadge } from '../shared/HouseBadge';
import { HouseChips } from '../shared/HouseChips';
import { PointBadge } from '../shared/PointBadge';
import { EmptyState, Notice, SkeletonRows, Spinner } from '../shared/States';
import { useToast } from '../shared/Toast';
import { AdminSection } from './AdminSection';

export function AuditLog({ activeSeason }: { activeSeason: Season | null }) {
  const toast = useToast();
  const { seasons } = useSeasons();
  const [pickedSeasonId, setSeasonId] = useState<string>('');
  const [house, setHouse] = useState<HouseId | null>(null);
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [term, setTerm] = useState('');
  const [revoking, setRevoking] = useState<PointAward | null>(null);

  // Until an admin picks one, show the active season (or the newest).
  const seasonId = pickedSeasonId || activeSeason?.id || seasons[0]?.id || '';

  const { items, loading, loadingMore, hasMore, loadMore, error } = usePointFeed({ seasonId: seasonId || null, houseId: house, category, pageSize: 50 });

  const visible = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) =>
      [p.studentName, p.studentId, p.awardedByName, p.awardedBy, p.note, CATEGORIES[p.category]?.label].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [items, term]);

  const total = visible.reduce((sum, p) => sum + p.amount, 0);

  const exportCsv = () => {
    downloadCsv(`leaderquest-audit-${seasonId}.csv`, [
      ['awarded_at', 'student', 'student_email', 'house', 'category', 'points', 'note', 'awarded_by', 'awarded_by_email', 'point_id'],
      ...visible.map((p) => [
        toDate(p.awardedAt)?.toISOString() ?? '',
        p.studentName ?? '',
        p.studentId,
        HOUSES[p.houseId]?.name ?? p.houseId,
        CATEGORIES[p.category]?.label ?? p.category,
        p.amount,
        p.note,
        p.awardedByName ?? '',
        p.awardedBy,
        p.id,
      ]),
    ]);
  };

  return (
    <div className="space-y-5">
      <AdminSection
        title="Point audit log"
        description="Every award, newest first. Revoking an award subtracts it from the student and house totals."
        actions={
          <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={visible.length === 0}>
            Export CSV
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="audit-season">Season</label>
            <select id="audit-season" className="input" value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.status === 'active' ? ' (active)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="audit-category">Category</label>
            <select id="audit-category" className="input" value={category ?? ''} onChange={(e) => setCategory(isCategoryKey(e.target.value) ? e.target.value : null)}>
              <option value="">All categories</option>
              {CATEGORY_KEYS.map((k) => (
                <option key={k} value={k}>
                  {CATEGORIES[k].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="audit-search">Search</label>
            <input id="audit-search" type="search" className="input" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Student, faculty, or note…" />
          </div>
        </div>
        <HouseChips value={house} onChange={setHouse} className="mt-3" />
      </AdminSection>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex items-center justify-between text-xs text-white/50">
        <span>
          {visible.length} award{visible.length === 1 ? '' : 's'} loaded{term && ' (filtered)'}
        </span>
        <span>
          Total <span className="scoreboard text-sm text-gold-light">{formatPoints(total)}</span> pts
        </span>
      </div>

      {loading ? (
        <SkeletonRows rows={6} />
      ) : visible.length === 0 ? (
        <EmptyState title="No awards found" />
      ) : (
        <div className="lq-card overflow-x-auto scroll-thin">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-gold/25 font-heading text-[10px] uppercase tracking-[0.14em] text-white/50">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Points</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Awarded by</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {visible.map((p) => (
                <tr key={p.id} className="align-top hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-white/55">{formatDateTime(p.awardedAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.studentName ?? p.studentId}</p>
                    <HouseBadge houseId={p.houseId} size="xs" className="mt-1" />
                  </td>
                  <td className="px-4 py-3">
                    <PointBadge category={p.category} showLabel />
                  </td>
                  <td className="scoreboard px-4 py-3 text-right text-base">+{p.amount}</td>
                  <td className="max-w-[240px] px-4 py-3 text-white/65">{p.note || <span className="text-white/25">—</span>}</td>
                  <td className="px-4 py-3 text-xs">
                    <p className="text-white/80">{p.awardedByName ?? '—'}</p>
                    <p className="text-white/40">{p.awardedBy}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => setRevoking(p)} className="font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-red-300/70 hover:text-red-300">
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center">
          <button type="button" onClick={loadMore} disabled={loadingMore} className="btn btn-ghost">
            {loadingMore && <Spinner size={14} />}
            Load more
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!revoking}
        title="Revoke this award?"
        tone="danger"
        confirmLabel="Revoke award"
        onClose={() => setRevoking(null)}
        onConfirm={async () => {
          if (!revoking) return;
          await revokePoint(revoking.id);
          toast(`Revoked +${revoking.amount} from ${revoking.studentName ?? revoking.studentId}.`, 'success');
        }}
      >
        {revoking && (
          <>
            <strong>+{revoking.amount}</strong> for {CATEGORIES[revoking.category]?.label} to <strong>{revoking.studentName ?? revoking.studentId}</strong> will be deleted and subtracted from{' '}
            {HOUSES[revoking.houseId]?.name}’s total. This can’t be undone.
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
