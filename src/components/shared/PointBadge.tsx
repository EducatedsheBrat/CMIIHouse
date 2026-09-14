'use client';

import { CATEGORIES, type CategoryKey } from '../../lib/constants';
import { cn, formatPoints, lighten, rgba } from '../../lib/utils';
import { CategoryIcon } from './CategoryIcon';

interface PointBadgeProps {
  category: CategoryKey;
  amount?: number;
  showLabel?: boolean;
  className?: string;
}

/** Category-colored point indicator, e.g. [book +75] or [book Academic]. */
export function PointBadge({ category, amount, showLabel = false, className }: PointBadgeProps) {
  const cat = CATEGORIES[category];
  if (!cat) return null;
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-[5px] border px-2 py-0.5 text-xs font-semibold', className)}
      style={{ color: lighten(cat.color, 0.3), borderColor: rgba(cat.color, 0.5), background: rgba(cat.color, 0.12) }}
      title={cat.label}
    >
      <CategoryIcon category={category} size={13} />
      {showLabel && <span>{cat.shortLabel}</span>}
      {amount !== undefined && <span className="scoreboard">+{formatPoints(amount)}</span>}
    </span>
  );
}
