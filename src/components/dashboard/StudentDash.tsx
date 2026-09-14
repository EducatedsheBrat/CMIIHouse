'use client';

import { useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useHouses } from '../../hooks/useHouses';
import { useStudentPoints } from '../../hooks/usePoints';
import { useActiveSeason } from '../../hooks/useSeason';
import { CATEGORIES, CATEGORY_KEYS, HOUSES, isHouseId, type CategoryKey } from '../../lib/constants';
import { darken, formatPoints, lighten, ordinal, rgba } from '../../lib/utils';
import { AnimatedNumber } from '../shared/AnimatedNumber';
import { CategoryIcon } from '../shared/CategoryIcon';
import { Crown } from '../shared/Crown';
import { GoldBorder } from '../shared/GoldBorder';
import { OrnamentalDivider } from '../shared/OrnamentalDivider';
import { Shield } from '../shared/Shield';
import { Panther } from '../shared/Panther';
import { PointHistory } from './PointHistory';
import { StatCard } from './StatCard';

export function StudentDash() {
  const { profile } = useAuth();
  const { season } = useActiveSeason();
  const { houses } = useHouses();
  const { points, loading } = useStudentPoints(profile?.id, season?.id ?? profile?.seasonId);

  const byCategory = useMemo(() => {
    const totals = Object.fromEntries(CATEGORY_KEYS.map((k) => [k, { total: 0, count: 0 }])) as Record<CategoryKey, { total: number; count: number }>;
    for (const p of points) {
      if (!totals[p.category]) continue;
      totals[p.category].total += p.amount;
      totals[p.category].count += 1;
    }
    return totals;
  }, [points]);

  if (!profile) return null;

  if (!profile.sorted || !isHouseId(profile.houseId)) {
    return (
      <GoldBorder className="mx-auto mt-6 max-w-lg overflow-hidden px-6 pb-8 pt-6 text-center animate-fade-up">
        <Panther className="mx-auto w-56 max-w-full" />
        <p className="eyebrow mt-4">Welcome, {profile.displayName.split(' ')[0]}</p>
        <h1 className="mt-1 font-display text-3xl font-black text-gold-gradient">The Sorting awaits</h1>
        <OrnamentalDivider className="my-4" />
        <p className="text-sm leading-relaxed text-white/60">
          You haven’t been sorted into a house yet. At the sorting ceremony, the wheel will choose between Lumina, Doron, Asé and Kaizen, and your panther will
          find you. Check back after the ceremony.
        </p>
      </GoldBorder>
    );
  }

  const meta = HOUSES[profile.houseId];
  const house = houses.find((h) => h.id === profile.houseId);
  const houseTotal = house?.totalPoints ?? 0;
  const share = houseTotal > 0 ? Math.round((profile.totalPoints / houseTotal) * 100) : 0;
  const firstName = profile.displayName.split(' ')[0];

  return (
    <div className="space-y-6">
      <GoldBorder glow={meta.color} className="overflow-hidden animate-fade-up">
        <div className="pointer-events-none absolute inset-0 rounded-card" style={{ background: `radial-gradient(ellipse 80% 90% at 15% 0%, ${rgba(meta.color, 0.3)}, transparent 60%)` }} />
        <Panther house={meta.id} glow className="pointer-events-none absolute bottom-2 right-3 w-32 sm:bottom-auto sm:right-6 sm:top-1/2 sm:w-56 sm:-translate-y-1/2" />
        <div className="relative flex items-center gap-4 p-5 pb-24 sm:gap-6 sm:p-7 sm:pr-64">
          <Shield houseId={meta.id} size={92} glow className="hidden shrink-0 sm:block" />
          <Shield houseId={meta.id} size={60} glow className="shrink-0 sm:hidden" />
          <div className="min-w-0">
            <p className="eyebrow">Welcome back, {firstName}</p>
            <h1 className="mt-1 font-display text-[32px] font-black leading-none sm:text-5xl" style={{ color: lighten(meta.color, 0.1), textShadow: `0 0 28px ${rgba(meta.color, 0.5)}` }}>
              {meta.name}
            </h1>
            <p className="mt-1.5 font-heading text-xs font-semibold uppercase tracking-[0.22em] text-white/65">{meta.motto}</p>
            <p className="mt-2.5 hidden max-w-lg text-sm text-white/55 sm:block">{meta.description}</p>
          </div>
        </div>
      </GoldBorder>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <StatCard label="Your Points" accent={meta.color} sub={share > 0 ? `${share}% of house` : 'this season'}>
          <AnimatedNumber value={profile.totalPoints} from={0} />
        </StatCard>
        <StatCard label="House Rank" sub={house ? `of ${houses.length} houses` : undefined}>
          <span className="inline-flex items-center gap-1.5">
            {house?.rank === 1 && houseTotal > 0 && <Crown size={24} />}
            {house ? ordinal(house.rank) : '—'}
          </span>
        </StatCard>
        <StatCard label="House Total" accent={meta.color} sub="points">
          <AnimatedNumber value={houseTotal} from={0} />
        </StatCard>
      </div>

      <section>
        <OrnamentalDivider label="By category" className="mb-3" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {CATEGORY_KEYS.map((key) => {
            const cat = CATEGORIES[key];
            const { total, count } = byCategory[key];
            return (
              <div
                key={key}
                className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 last:col-span-2 sm:flex-col sm:gap-1.5 sm:py-3 sm:text-center sm:last:col-span-1"
                style={{
                  borderColor: rgba(cat.color, total > 0 ? 0.5 : 0.18),
                  background: total > 0 ? `linear-gradient(180deg, ${rgba(cat.color, 0.16)}, ${darken(cat.color, 0.85)})` : 'rgba(255,255,255,0.02)',
                }}
              >
                <span style={{ color: total > 0 ? lighten(cat.color, 0.3) : 'rgba(255,255,255,0.3)' }}>
                  <CategoryIcon category={key} size={22} />
                </span>
                <div className="min-w-0">
                  <p className="scoreboard text-lg leading-none" style={{ color: total > 0 ? '#fff' : 'rgba(255,255,255,0.35)' }}>
                    {formatPoints(total)}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wider text-white/45">
                    {cat.shortLabel}
                    {count > 0 && <span className="text-white/30"> · {count}</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <OrnamentalDivider label="Your deeds" className="mb-3" />
        <PointHistory points={points} loading={loading} />
      </section>
    </div>
  );
}
