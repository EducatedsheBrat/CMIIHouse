'use client';

import { useEffect } from 'react';
import { CATEGORIES, HOUSES, type CategoryKey, type HouseId } from '../../lib/constants';
import { lighten, rgba } from '../../lib/utils';
import { AnimatedNumber } from '../shared/AnimatedNumber';
import { CategoryIcon } from '../shared/CategoryIcon';
import { Shield } from '../shared/Shield';

export interface AwardCelebration {
  studentName: string;
  houseId: HouseId;
  category: CategoryKey;
  amount: number;
  houseTotal: number;
}

const DURATION_MS = 2600;

/**
 * Point award celebration: the award appears large in the category color, scales 0.5 → 1
 * while floating up 30px over 1.5s and fading out in the final 0.5s, over a radial glow
 * pulse in the house color. The house total counts up beneath it.
 */
export function AwardConfirm({ award, onDone }: { award: AwardCelebration; onDone: () => void }) {
  const house = HOUSES[award.houseId];
  const cat = CATEGORIES[award.category];

  useEffect(() => {
    navigator.vibrate?.([30, 40, 60]);
    const t = setTimeout(onDone, DURATION_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-royal-night/85 backdrop-blur-sm animate-fade-in"
      onClick={onDone}
      role="status"
      aria-live="assertive"
      aria-label={`+${award.amount} ${cat.label} for ${award.studentName}`}
    >
      <style>{`
        @keyframes lq-award-number {
          0% { opacity: 1; transform: translateY(0) scale(.5); }
          66.67% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-30px) scale(1); }
        }
        @keyframes lq-award-glow {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(.5); }
          35% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.25); }
        }
        .lq-award-number { animation: lq-award-number 1.5s cubic-bezier(.2,.8,.3,1) both; }
        .lq-award-glow { animation: lq-award-glow 1.5s ease-out both; }
      `}</style>

      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="relative flex h-40 w-full items-center justify-center sm:h-48">
          <span
            className="lq-award-glow pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 rounded-full"
            style={{ background: `radial-gradient(circle, ${rgba(house.color, 0.75)} 0%, ${rgba(house.color, 0.25)} 40%, transparent 70%)` }}
          />
          <div
            className="lq-award-number relative"
            style={{ color: lighten(cat.color, 0.15), textShadow: `0 0 26px ${rgba(cat.color, 0.8)}, 0 0 60px ${rgba(house.color, 0.5)}` }}
          >
            <AnimatedNumber value={award.amount} from={0} duration={600} prefix="+" className="scoreboard block font-display text-8xl font-black leading-none sm:text-9xl" />
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.35s' }}>
          <p className="inline-flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-[0.22em]" style={{ color: lighten(cat.color, 0.3) }}>
            <CategoryIcon category={award.category} size={18} />
            {cat.label}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Shield houseId={award.houseId} size={40} glow />
            <div className="text-left">
              <p className="text-xl font-semibold">{award.studentName}</p>
              <p className="text-sm text-white/60">
                House {house.name} ·{' '}
                <AnimatedNumber value={award.houseTotal} from={award.houseTotal - award.amount} duration={500} className="scoreboard text-gold-light" /> pts
              </p>
            </div>
          </div>
        </div>
        <p className="mt-8 font-heading text-[10px] uppercase tracking-[0.3em] text-white/35">Tap to continue</p>
      </div>
    </div>
  );
}
