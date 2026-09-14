'use client';

import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from '../../lib/constants';
import { cn, darken, lighten, rgba } from '../../lib/utils';
import { CategoryIcon } from '../shared/CategoryIcon';

// A 24-point rosette — the seal-like edge of a medallion.
const ROSETTE = (() => {
  const pts: string[] = [];
  const n = 48;
  for (let i = 0; i < n; i++) {
    const r = i % 2 === 0 ? 50 : 45.5;
    const a = (Math.PI * 2 * i) / n;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(2)},${(50 + Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(' ');
})();

function Medallion({ category, selected, size = 64 }: { category: CategoryKey; selected: boolean; size?: number }) {
  const color = CATEGORIES[category].color;
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="absolute inset-0" aria-hidden="true">
        <polygon points={ROSETTE} fill={selected ? '#D4A843' : rgba('#D4A843', 0.45)} />
        <circle cx="50" cy="50" r="40" fill={selected ? color : darken(color, 0.72)} />
        <circle cx="50" cy="50" r="40" fill="url(#medal-shine)" />
        <circle cx="50" cy="50" r="34" fill="none" stroke={selected ? 'rgba(255,248,225,0.7)' : rgba(color, 0.55)} strokeWidth="1.5" strokeDasharray="2 3" />
        <defs>
          <radialGradient id="medal-shine" cx="0.35" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
      </svg>
      <span className="relative" style={{ color: selected ? '#0F1B2D' : lighten(color, 0.25) }}>
        <CategoryIcon category={category} size={size * 0.42} />
      </span>
    </span>
  );
}

export function CategoryPicker({ value, onChange }: { value: CategoryKey | null; onChange: (c: CategoryKey) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Point category">
      {CATEGORY_KEYS.map((key) => {
        const cat = CATEGORIES[key];
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(key)}
            className={cn(
              'group flex flex-col items-center rounded-card border px-1.5 pb-2.5 pt-3 text-center transition active:scale-[0.97]',
              selected ? 'bg-white/[0.06]' : 'border-white/10 bg-white/[0.02] hover:border-white/25',
            )}
            style={selected ? { borderColor: cat.color, boxShadow: `0 0 0 1px ${cat.color}, 0 0 22px -4px ${rgba(cat.color, 0.7)}` } : undefined}
          >
            <span className={cn('transition', selected ? 'scale-105' : 'group-hover:scale-105')}>
              <Medallion category={key} selected={selected} />
            </span>
            <span className={cn('mt-2 font-heading text-[11px] font-bold uppercase leading-tight tracking-[0.06em]', selected ? 'text-white' : 'text-white/70')}>
              {cat.shortLabel}
            </span>
            <span className="scoreboard mt-0.5 text-[11px] font-semibold" style={{ color: selected ? lighten(cat.color, 0.3) : 'rgba(255,255,255,0.4)' }}>
              {cat.min}–{cat.max}
            </span>
          </button>
        );
      })}
    </div>
  );
}
