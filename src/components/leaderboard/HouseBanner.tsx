'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { HOUSES } from '../../lib/constants';
import type { RankedHouse } from '../../lib/types';
import { cn, darken, lighten, rgba, roman } from '../../lib/utils';
import { AnimatedNumber } from '../shared/AnimatedNumber';
import { Crown } from '../shared/Crown';
import { Shield } from '../shared/Shield';

const SWALLOWTAIL = 'polygon(0 0, 100% 0, 100% 100%, 50% 90%, 0 100%)';

interface Burst {
  id: number;
  amount: number;
}

/** Emits a "+N" burst whenever a live total increases (ignores cache → server catch-up). */
export function usePointBursts(total: number, live: boolean) {
  const prev = useRef<{ value: number; live: boolean } | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(() => {
    const before = prev.current;
    prev.current = { value: total, live };
    if (!before || !before.live || !live || total <= before.value) return;
    const burst = { id: Date.now() + Math.random(), amount: total - before.value };
    setBursts((b) => [...b, burst]);
    const t = setTimeout(() => setBursts((b) => b.filter((x) => x.id !== burst.id)), 1900);
    return () => clearTimeout(t);
  }, [total, live]);

  return bursts;
}

interface HouseBannerProps {
  house: RankedHouse;
  /** Share of the leading total, 0–1 — sets how far the banner hangs. */
  ratio: number;
  isLeader: boolean;
  live: boolean;
  variant?: 'hall' | 'kiosk';
}

/** A vertical house pennant hanging from the rod, its length set by the house's points. */
export function HouseBanner({ house, ratio, isLeader, live, variant = 'hall' }: HouseBannerProps) {
  const meta = HOUSES[house.id];
  const color = meta.color;
  const bursts = usePointBursts(house.totalPoints, live);
  const pulsing = bursts.length > 0;
  const kiosk = variant === 'kiosk';

  const heightStyle: CSSProperties = kiosk
    ? { height: `calc(35vh + ${ratio.toFixed(3)} * 13vh)` }
    : { height: `calc(var(--banner-min) + (var(--banner-max) - var(--banner-min)) * ${ratio.toFixed(3)})` };

  return (
    <div className="flex flex-col items-center">
      {/* Crown slot keeps every banner's rings aligned on the rod. */}
      <div className={cn('flex items-end justify-center', kiosk ? 'h-[7vh]' : 'h-8 sm:h-11')}>
        {isLeader && (
          <Crown
            size={kiosk ? 0 : 34}
            className={cn('animate-pop-in drop-shadow-[0_0_12px_rgba(212,168,67,0.8)]', kiosk ? 'h-[6vh] w-[8vh]' : 'sm:h-[36px] sm:w-[48px]')}
          />
        )}
      </div>

      <div className={cn('relative z-10 flex w-[62%] justify-between', kiosk ? '-mb-[1vh]' : '-mb-1.5')}>
        {[0, 1].map((i) => (
          <span
            key={i}
            className={cn('rounded-full border-gold bg-royal-night', kiosk ? 'h-[2.2vh] w-[2.2vh] border-[0.35vh]' : 'h-3 w-3 border-2 sm:h-4 sm:w-4')}
          />
        ))}
      </div>

      <div className="relative w-full origin-top animate-sway" style={{ animationDelay: `${house.rank * -1.3}s` }}>
        {/* Glow follows the clipped pennant shape. */}
        <div
          className="transition-[filter] duration-700"
          style={{
            filter: `drop-shadow(0 0 ${pulsing ? 28 : isLeader ? 16 : 6}px ${rgba(color, pulsing ? 0.85 : isLeader ? 0.5 : 0.25)})`,
          }}
        >
          <div
            className="relative transition-[height] duration-1000 ease-out"
            style={{ ...heightStyle, clipPath: SWALLOWTAIL, background: `linear-gradient(180deg, #F7E2A6, #D4A843 40%, #8A6A22)` }}
          >
            <div
              className="absolute inset-x-[3px] bottom-[3px] top-0 flex flex-col items-center overflow-hidden text-center"
              style={{
                clipPath: SWALLOWTAIL,
                background: `
                  repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 7px),
                  linear-gradient(180deg, ${darken(color, 0.12)} 0%, ${darken(color, 0.45)} 45%, ${darken(color, 0.72)} 100%)`,
              }}
            >
              {/* The fold over the rod */}
              <div className="w-full shrink-0" style={{ height: kiosk ? '2.2vh' : 14, background: `linear-gradient(180deg, ${lighten(color, 0.15)}, ${color})` }} />
              <div className="h-[2px] w-full shrink-0 bg-gold/80" />
              <div className="absolute inset-y-0 left-[6%] w-px bg-gold/25" />
              <div className="absolute inset-y-0 right-[6%] w-px bg-gold/25" />

              <p
                className={cn('font-display font-black text-gold-light', kiosk ? 'mt-[1.4vh] text-[3.2vh]' : 'mt-2 text-sm sm:mt-3 sm:text-xl')}
                aria-label={`Rank ${house.rank}`}
              >
                {roman(house.rank)}
              </p>

              <Shield
                houseId={house.id}
                size={kiosk ? 0 : 64}
                glow={isLeader}
                className={cn('shrink-0', kiosk ? 'mt-[0.8vh] h-[9vh] w-[7.5vh]' : 'mt-1 h-[48px] w-[40px] sm:mt-2 sm:h-[86px] sm:w-[72px]')}
              />

              <h2
                className={cn('font-display font-bold leading-tight text-white', kiosk ? 'mt-[1.4vh] text-[3.6vh]' : 'mt-1.5 px-1 text-[12px] sm:mt-3 sm:text-xl')}
                style={{ textShadow: `0 0 18px ${rgba(color, 0.6)}` }}
              >
                {meta.name}
              </h2>
              <p className={cn('font-heading uppercase text-white/60', kiosk ? 'mt-[0.6vh] px-[1vw] text-[1.6vh] tracking-[0.2em]' : 'mt-1 hidden px-3 text-[10px] tracking-[0.18em] sm:block')}>
                {meta.motto}
              </p>

              <div className="flex-1" />

              <div className={cn('relative w-full', kiosk ? 'pb-[4.6vh]' : 'pb-[26%] sm:pb-[22%]')}>
                {bursts.map((b) => (
                  <span
                    key={b.id}
                    className={cn('scoreboard pointer-events-none absolute inset-x-0 -top-2 animate-rise-fade text-center', kiosk ? 'text-[5vh]' : 'text-lg sm:text-2xl')}
                    style={{ color: lighten(color, 0.4), textShadow: `0 0 16px ${color}` }}
                  >
                    +{b.amount}
                  </span>
                ))}
                <AnimatedNumber
                  value={house.totalPoints}
                  duration={500}
                  className={cn('scoreboard block text-white', kiosk ? 'text-[6.2vh] leading-none' : 'text-[17px] sm:text-[30px]')}
                />
                <span className={cn('font-heading font-semibold uppercase text-gold/80', kiosk ? 'text-[1.6vh] tracking-[0.3em]' : 'text-[9px] tracking-[0.22em] sm:text-[11px]')}>
                  points
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
