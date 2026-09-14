'use client';

import Link from 'next/link';
import { useHouses } from '../../hooks/useHouses';
import { useFlip } from '../../hooks/useFlip';
import { useSeasonById } from '../../hooks/useSeason';
import { HOUSES } from '../../lib/constants';
import type { RankedHouse } from '../../lib/types';
import { cn, darken, formatPoints, lighten, rgba, roman, seasonLabel } from '../../lib/utils';
import { AnimatedNumber } from '../shared/AnimatedNumber';
import { OrnamentalDivider } from '../shared/OrnamentalDivider';
import { Panther } from '../shared/Panther';
import { Shield } from '../shared/Shield';
import { EmptyState, Notice } from '../shared/States';
import { Trophy } from '../shared/Trophy';
import { NavIcon } from '../layout/NavIcons';
import { HouseBanner } from './HouseBanner';

export function LiveIndicator({ live, className }: { live: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-heading text-[10px] font-bold uppercase tracking-[0.25em]', live ? 'text-emerald-300' : 'text-white/45', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', live ? 'animate-live-dot bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]' : 'bg-white/40')} />
      {live ? 'Live' : 'Offline'}
    </span>
  );
}

/** The four banners hanging from a gilded rod. */
export function BannerHall({ houses, live, variant = 'hall' }: { houses: RankedHouse[]; live: boolean; variant?: 'hall' | 'kiosk' }) {
  const register = useFlip<HTMLDivElement>(houses.map((h) => h.id).join('|'));
  const max = Math.max(0, ...houses.map((h) => h.totalPoints));
  const kiosk = variant === 'kiosk';

  return (
    <div className={cn('banner-hall relative mx-auto w-full', kiosk ? 'px-[3vw]' : 'max-w-4xl px-1 sm:px-4')}>
      <div className="relative">
        {/* The rod */}
        <div className={cn('absolute inset-x-0 z-0', kiosk ? 'top-[7.5vh]' : 'top-[34px] sm:top-[47px]')}>
          <div className={cn('relative mx-auto rounded-full', kiosk ? 'h-[1.2vh]' : 'h-2 sm:h-2.5')} style={{ background: 'linear-gradient(180deg, #F7E2A6 0%, #D4A843 45%, #7A5C1C 100%)' }}>
            <span className={cn('absolute -left-1 top-1/2 -translate-y-1/2 rotate-45 border border-gold-light bg-gold', kiosk ? 'h-[2.4vh] w-[2.4vh]' : 'h-3.5 w-3.5 sm:h-4 sm:w-4')} />
            <span className={cn('absolute -right-1 top-1/2 -translate-y-1/2 rotate-45 border border-gold-light bg-gold', kiosk ? 'h-[2.4vh] w-[2.4vh]' : 'h-3.5 w-3.5 sm:h-4 sm:w-4')} />
          </div>
        </div>

        <div className={cn('relative flex items-stretch', kiosk ? 'gap-[2.2vw] px-[2vw]' : 'gap-2 px-3 sm:gap-6 sm:px-8')}>
          {houses.map((house) => {
            const isLeader = house.rank === 1 && house.totalPoints > 0;
            const ratio = max > 0 ? house.totalPoints / max : 0.5;
            return (
              <div key={house.id} ref={register(house.id)} className={cn('flex min-w-0 flex-col', isLeader ? 'flex-[1.14]' : 'flex-1')}>
                <HouseBanner house={house} ratio={ratio} isLeader={isLeader} live={live} variant={variant} />
                {/* Each house panther stands on the ledge beneath its banner. */}
                <div className={cn('mt-auto flex justify-center', kiosk ? 'pt-[1.5vh]' : 'pt-3 sm:pt-4')}>
                  <Panther house={house.id} glow={isLeader} className={cn(kiosk ? 'w-[min(12vw,15vh)]' : 'w-full max-w-[92px] sm:max-w-[170px]', isLeader && 'scale-110')} />
                </div>
              </div>
            );
          })}
        </div>
        {/* The ledge */}
        <div
          className={cn('mx-auto rounded-full', kiosk ? 'mt-[0.4vh] h-[0.6vh] w-[92%]' : 'mt-1 h-1 w-[94%]')}
          style={{ background: 'linear-gradient(90deg, transparent, #9A7628 12%, #EBCB7A 50%, #9A7628 88%, transparent)' }}
        />
      </div>
    </div>
  );
}

function StandingsTable({ houses, live }: { houses: RankedHouse[]; live: boolean }) {
  const register = useFlip<HTMLLIElement>(houses.map((h) => h.id).join('|'));
  const leader = houses[0]?.totalPoints ?? 0;

  return (
    <ol className="space-y-2.5">
      {houses.map((house) => {
        const meta = HOUSES[house.id];
        const gap = leader - house.totalPoints;
        const pct = leader > 0 ? (house.totalPoints / leader) * 100 : 0;
        return (
          <li
            key={house.id}
            ref={register(house.id)}
            className="lq-card flex items-center gap-3 overflow-hidden px-3 py-3 sm:gap-4 sm:px-4"
            style={{ borderColor: rgba(meta.color, 0.45), boxShadow: `0 0 22px -10px ${rgba(meta.color, 0.7)}` }}
          >
            <span
              className="flex h-12 w-9 shrink-0 items-start justify-center pt-2 font-display text-sm font-black text-white"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)', background: `linear-gradient(180deg, ${lighten(meta.color, 0.1)}, ${darken(meta.color, 0.45)})` }}
              aria-label={`Rank ${house.rank}`}
            >
              {roman(house.rank)}
            </span>
            <Shield houseId={house.id} size={34} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate font-display text-base font-bold sm:text-lg">{meta.name}</p>
                <AnimatedNumber value={house.totalPoints} duration={500} className="scoreboard text-lg sm:text-xl" />
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px]">
                <p className="truncate font-heading uppercase tracking-[0.14em] text-white/50">{meta.motto}</p>
                <p className="shrink-0 font-semibold text-white/45">
                  {house.rank === 1 ? (leader > 0 ? <span className="text-gold">Leading</span> : '—') : `−${formatPoints(gap)}`}
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full transition-[width] duration-1000 ease-out"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${darken(meta.color, 0.2)}, ${lighten(meta.color, 0.2)})`, boxShadow: live ? `0 0 10px ${meta.color}` : undefined }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function Leaderboard() {
  const { houses, loading, error, fromCache } = useHouses();
  const season = useSeasonById(houses[0]?.seasonId);
  const live = !fromCache && !error;
  const closed = season?.status === 'closed';
  const champion = closed && houses[0]?.totalPoints > 0 ? houses[0] : null;

  return (
    <div className="animate-fade-in">
      <section className="relative text-center">
        <p className="eyebrow text-white/50">Georgia State University · Creative Media Industries Institute</p>
        <div className="mt-3 flex items-center justify-center gap-3 sm:gap-5">
          <Trophy size={44} className="hidden drop-shadow-[0_0_14px_rgba(212,168,67,0.5)] sm:block" />
          <h1 className="font-display text-[34px] font-black leading-none text-gold-gradient sm:text-6xl">CMII Media Cup</h1>
          <Trophy size={44} className="hidden drop-shadow-[0_0_14px_rgba(212,168,67,0.5)] sm:block" />
        </div>
        <OrnamentalDivider
          label={season ? seasonLabel(season) : houses[0]?.seasonId ? seasonLabel({ id: houses[0].seasonId }) : 'House Standings'}
          className="mx-auto mt-4 max-w-lg"
        />
        <div className="mt-2.5 flex items-center justify-center gap-4">
          {closed ? (
            <span className="font-heading text-[10px] font-bold uppercase tracking-[0.25em] text-gold">Final standings</span>
          ) : (
            !loading && <LiveIndicator live={live} />
          )}
        </div>
      </section>

      {error && <Notice tone="error" className="mt-6">Couldn’t load the standings: {error}</Notice>}

      {loading ? (
        <div className="mt-10 flex justify-center gap-3 px-6 sm:gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-[260px] flex-1 sm:h-[380px]" />
          ))}
        </div>
      ) : houses.length === 0 ? (
        <EmptyState title="The houses have not yet been founded" className="mt-10">
          An admin can create the four houses from the Admin panel, or run the seed script to load demo data.
        </EmptyState>
      ) : (
        <>
          {champion && (
            <div className="mx-auto mt-6 max-w-md text-center animate-pop-in">
              <p className="font-heading text-xs uppercase tracking-[0.3em] text-white/50">Champions of the Cup</p>
              <p className="font-display text-2xl font-black" style={{ color: champion.color }}>
                House {HOUSES[champion.id].name}
              </p>
            </div>
          )}

          <div className="mt-6 sm:mt-8">
            <BannerHall houses={houses} live={live} />
          </div>

          <section className="mx-auto mt-10 max-w-2xl">
            <OrnamentalDivider label="Standings" className="mb-4" />
            <StandingsTable houses={houses} live={live} />
          </section>
        </>
      )}

      <div className="mt-10 flex justify-center">
        <Link href="/kiosk" className="btn-text">
          <NavIcon name="kiosk" size={16} /> Open kiosk display
        </Link>
      </div>
    </div>
  );
}
