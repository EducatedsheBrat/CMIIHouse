'use client';

import Link from 'next/link';
import type { AppUser } from '../../lib/types';
import { cn, formatPoints } from '../../lib/utils';
import { Avatar } from '../shared/Avatar';
import { NavIcon } from '../layout/NavIcons';

const MEDAL = ['#E9C46A', '#C7CED9', '#C98A55'];

export function StudentRow({ student, rank, onAssign }: { student: AppUser; rank: number; onAssign?: (student: AppUser) => void }) {
  const medal = rank <= 3 && student.totalPoints > 0 ? MEDAL[rank - 1] : null;
  return (
    <li className="flex items-center gap-3 border-b border-white/[0.06] px-3 py-2.5 last:border-b-0 sm:px-4">
      <span
        className={cn('flex h-8 w-8 shrink-0 items-center justify-center font-display text-sm font-bold', medal ? 'rotate-45 rounded-[5px] border' : 'text-white/40')}
        style={medal ? { borderColor: medal, background: `${medal}22`, color: medal } : undefined}
      >
        <span className={cn(medal && '-rotate-45')}>{rank}</span>
      </span>
      <Avatar name={student.displayName} houseId={student.houseId} size={38} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{student.displayName}</p>
        <p className="truncate text-xs text-white/40">{student.email}</p>
      </div>
      <div className="text-right">
        <p className="scoreboard text-lg leading-none">{formatPoints(student.totalPoints)}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/40">pts</p>
      </div>
      <Link
        href={`/award?student=${encodeURIComponent(student.id)}`}
        className="ml-1 rounded-md border border-gold/25 p-1.5 text-gold/70 transition hover:border-gold hover:text-gold-light"
        title={`Award points to ${student.displayName}`}
        aria-label={`Award points to ${student.displayName}`}
      >
        <NavIcon name="award" size={18} />
      </Link>
      {onAssign && (
        <button
          type="button"
          onClick={() => onAssign(student)}
          className="rounded-md border border-white/15 p-1.5 text-white/50 transition hover:border-gold hover:text-gold-light"
          title={`Move ${student.displayName} to another house`}
          aria-label={`Move ${student.displayName} to another house`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 8 H18 M14 4 L18 8 L14 12" />
            <path d="M20 16 H6 M10 12 L6 16 L10 20" />
          </svg>
        </button>
      )}
    </li>
  );
}
