'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useHouses } from '../../hooks/useHouses';
import { useSeasonById } from '../../hooks/useSeason';
import { HOUSES } from '../../lib/constants';
import { cn, formatPoints, rgba } from '../../lib/utils';
import { Crest } from '../shared/Crest';
import { HouseIconSvg } from '../shared/HouseIcon';
import { Trophy } from '../shared/Trophy';
import { BannerHall, LiveIndicator } from './Leaderboard';

const RELOAD_EVERY_MS = 30 * 60 * 1000;
const SPOTLIGHT_EVERY_MS = 10 * 1000;

function subscribeClock(onTick: () => void) {
  const t = setInterval(onTick, 1000 * 15);
  return () => clearInterval(t);
}

/** The current minute. Null during prerender so the server HTML and first client render agree. */
function useClock() {
  const minute = useSyncExternalStore(subscribeClock, () => Math.floor(Date.now() / 60000) * 60000, () => null);
  return minute === null ? null : new Date(minute);
}

/** Keeps the hallway TV awake and fresh. */
function useKioskHousekeeping() {
  useEffect(() => {
    // Full page refresh every 30 minutes (when online) picks up new deploys and heals stale sockets.
    const reload = setInterval(() => {
      if (navigator.onLine) window.location.reload();
    }, RELOAD_EVERY_MS);

    let lock: { release: () => Promise<void> } | null = null;
    const requestLock = async () => {
      try {
        const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock;
        if (wl && document.visibilityState === 'visible') lock = await wl.request('screen');
      } catch {
        /* wake lock unsupported or denied */
      }
    };
    requestLock();
    document.addEventListener('visibilitychange', requestLock);

    return () => {
      clearInterval(reload);
      document.removeEventListener('visibilitychange', requestLock);
      lock?.release().catch(() => undefined);
    };
  }, []);
}

function useIdleCursor(ms = 3000) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let t = setTimeout(() => setIdle(true), ms);
    const wake = () => {
      setIdle(false);
      clearTimeout(t);
      t = setTimeout(() => setIdle(true), ms);
    };
    window.addEventListener('mousemove', wake);
    return () => {
      clearTimeout(t);
      window.removeEventListener('mousemove', wake);
    };
  }, [ms]);
  return idle;
}

export function KioskView() {
  const { houses, loading, fromCache, error } = useHouses();
  const season = useSeasonById(houses[0]?.seasonId);
  const now = useClock();
  const idle = useIdleCursor();
  const [spotlight, setSpotlight] = useState(0);
  const [hint, setHint] = useState(true);
  useKioskHousekeeping();

  useEffect(() => {
    const t = setInterval(() => setSpotlight((i) => (i + 1) % 4), SPOTLIGHT_EVERY_MS);
    const h = setTimeout(() => setHint(false), 6000);
    return () => {
      clearInterval(t);
      clearTimeout(h);
    };
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    else document.documentElement.requestFullscreen?.().catch(() => undefined);
    setHint(false);
  };

  const live = !fromCache && !error;
  const leader = houses[0];
  const runnerUp = houses[1];
  const leadBy = leader && runnerUp ? leader.totalPoints - runnerUp.totalPoints : 0;
  const featured = houses.length ? houses[spotlight % houses.length] : null;
  const featuredMeta = featured ? HOUSES[featured.id] : null;

  return (
    <div
      className={cn('fixed inset-0 flex select-none flex-col overflow-hidden', idle && 'cursor-none')}
      onDoubleClick={toggleFullscreen}
      onClick={() => hint && toggleFullscreen()}
    >
      {/* Stage lighting */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(16,42,92,0.75), transparent 70%)' }} />
      {leader && leader.totalPoints > 0 && (
        <div
          className="pointer-events-none absolute inset-0 transition-[background] duration-1000"
          style={{ background: `radial-gradient(ellipse 40% 35% at 50% 100%, ${rgba(leader.color, 0.18)}, transparent 70%)` }}
        />
      )}

      {/* Header */}
      <header className="relative flex items-center justify-between px-[3vw] pt-[2.5vh]">
        <div className="flex w-[18vw] items-center gap-[1vw]">
          <Crest size={0} className="h-[7vh] w-[5.8vh]" />
          <div>
            <p className="font-display text-[2.4vh] font-bold leading-none text-gold-gradient">CMII Houses</p>
            <LiveIndicator live={live} className="mt-[0.8vh] !text-[1.3vh]" />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-[1.2vw]">
            <Trophy size={0} className="h-[6.5vh] w-[6.5vh] drop-shadow-[0_0_2vh_rgba(212,168,67,0.55)]" />
            <h1 className="whitespace-nowrap font-display text-[min(7vh,4.2vw)] font-black leading-none text-gold-gradient">CMII Media Cup</h1>
            <Trophy size={0} className="h-[6.5vh] w-[6.5vh] drop-shadow-[0_0_2vh_rgba(212,168,67,0.55)]" />
          </div>
          <div className="mt-[1vh] flex items-center gap-[1vw] text-gold">
            <span className="h-px w-[8vw] bg-gradient-to-r from-transparent to-gold" />
            <span className="font-heading text-[2vh] font-semibold uppercase tracking-[0.35em]">
              {season?.status === 'closed' ? 'Final Standings · ' : ''}
              {season?.name ?? houses[0]?.seasonId ?? ''}
            </span>
            <span className="h-px w-[8vw] bg-gradient-to-l from-transparent to-gold" />
          </div>
        </div>

        <div className="w-[18vw] text-right">
          <p className="scoreboard text-[4.2vh] leading-none text-white">{now?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) ?? ' '}</p>
          <p className="mt-[0.6vh] font-heading text-[1.6vh] uppercase tracking-[0.2em] text-white/50">
            {now?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) ?? ' '}
          </p>
        </div>
      </header>

      {/* Banners */}
      <main className="relative flex flex-1 items-start justify-center pt-[1vh]">
        {loading ? (
          <p className="self-center font-heading text-[2.5vh] uppercase tracking-[0.3em] text-gold/70">Summoning the houses…</p>
        ) : houses.length === 0 ? (
          <p className="self-center font-heading text-[2.5vh] uppercase tracking-[0.3em] text-gold/70">The houses await their founding</p>
        ) : (
          <div className="w-full max-w-[150vh]">
            <BannerHall houses={houses} live={live} variant="kiosk" />
          </div>
        )}
      </main>

      {/* Spotlight ticker */}
      <footer className="relative mx-[3vw] mb-[2.5vh] flex items-center gap-[2vw] rounded-card border border-gold/40 bg-royal-panel/70 px-[2vw] py-[1.6vh]">
        <div className="shrink-0 border-r border-gold/30 pr-[2vw]">
          <p className="font-heading text-[1.4vh] uppercase tracking-[0.3em] text-white/50">The race</p>
          <p className="scoreboard text-[2.6vh] text-gold-light">
            {leader && leader.totalPoints > 0
              ? leadBy > 0
                ? `${HOUSES[leader.id].name} leads by ${formatPoints(leadBy)}`
                : 'A dead heat at the top'
              : 'The Cup awaits'}
          </p>
        </div>
        {featured && featuredMeta && (
          <div key={featured.id} className="flex min-w-0 flex-1 items-center gap-[1.2vw] animate-fade-up">
            <span style={{ color: featuredMeta.color }}>
              <HouseIconSvg kind={featuredMeta.icon} size={0} className="h-[4.5vh] w-[4.5vh]" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[2.4vh] font-bold" style={{ color: featuredMeta.color }}>
                {featuredMeta.name} <span className="font-heading text-[1.6vh] font-semibold uppercase tracking-[0.25em] text-white/60">· {featuredMeta.motto}</span>
              </p>
              <p className="truncate text-[1.9vh] text-white/70">{featuredMeta.description}</p>
            </div>
          </div>
        )}
      </footer>

      {hint && (
        <div className="pointer-events-none absolute bottom-[14vh] left-1/2 -translate-x-1/2 rounded-full border border-gold/40 bg-royal/90 px-5 py-2 font-heading text-xs uppercase tracking-[0.2em] text-gold-light animate-fade-in">
          Click for full screen
        </div>
      )}
    </div>
  );
}
