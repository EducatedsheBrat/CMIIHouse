'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { Avatar } from '../shared/Avatar';
import { Crest } from '../shared/Crest';
import { HouseBadge } from '../shared/HouseBadge';
import { NavIcon, type NavIconName } from './NavIcons';

interface NavItem {
  href: string;
  label: string;
  /** Used in the mobile tab bar when six tabs share the width. */
  short?: string;
  icon: NavIconName;
}

export function navItemsForRole(role: Role | null): NavItem[] {
  const leaderboard: NavItem = { href: '/leaderboard', label: 'Leaderboard', short: 'Cup', icon: 'leaderboard' };
  const activity: NavItem = { href: '/activity', label: 'Activity', icon: 'activity' };
  switch (role) {
    case 'student':
      return [leaderboard, { href: '/dashboard', label: 'My House', icon: 'house' }, activity];
    case 'faculty':
      return [leaderboard, { href: '/award', label: 'Award', icon: 'award' }, { href: '/roster', label: 'Roster', icon: 'roster' }, activity];
    case 'admin':
      return [
        leaderboard,
        { href: '/award', label: 'Award', icon: 'award' },
        { href: '/roster', label: 'Roster', icon: 'roster' },
        activity,
        { href: '/ceremony', label: 'Ceremony', short: 'Sorting', icon: 'ceremony' },
        { href: '/admin', label: 'Admin', icon: 'admin' },
      ];
    default:
      return [];
  }
}

/** Matches the item and its sub-pages; the leaderboard also owns "/". */
function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`) || (href === '/leaderboard' && pathname === '/');
}

const ROLE_LABEL: Record<Role, string> = { student: 'Student', faculty: 'Faculty', admin: 'Administrator' };

/** Desktop sidebar. */
export function SideNav() {
  const { role, profile, signOut } = useAuth();
  const items = navItemsForRole(role);
  const isActive = useIsActive();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-gold/25 bg-royal-panel/95 md:flex">
      <div className="pointer-events-none absolute inset-y-0 right-[3px] w-px bg-gold/10" />
      <Link href="/leaderboard" className="flex items-center gap-3 px-6 pb-5 pt-7">
        <Crest size={40} />
        <div>
          <p className="font-heading text-[10px] font-semibold uppercase leading-none tracking-[0.3em] text-gold/80">CMII</p>
          <p className="mt-1 font-display text-lg font-bold leading-none text-gold-gradient">House Points</p>
        </div>
      </Link>
      <div className="mx-6 mb-4 h-px bg-gradient-to-r from-gold/60 via-gold/25 to-transparent" />

      <nav className="flex-1 space-y-1 px-3" aria-label="Main">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 font-heading text-sm font-semibold tracking-wide transition',
                active ? 'bg-gradient-to-r from-gold/20 to-transparent text-gold-light' : 'text-white/60 hover:bg-white/5 hover:text-white',
              )}
            >
              <span className={cn('absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-gold transition', active ? 'opacity-100' : 'opacity-0')} />
              <NavIcon name={item.icon} />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rotate-45 bg-gold" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-2">
        <a href="/kiosk" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 font-heading text-xs font-semibold uppercase tracking-[0.14em] text-white/40 transition hover:text-gold-light">
          <NavIcon name="kiosk" size={18} />
          Kiosk display
        </a>
      </div>

      {profile && (
        <div className="m-3 rounded-card border border-gold/20 bg-royal/60 p-3">
          <div className="flex items-center gap-3">
            <Avatar name={profile.displayName} houseId={profile.houseId} size={38} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{profile.displayName}</p>
              <p className="text-[11px] uppercase tracking-wider text-white/45">{ROLE_LABEL[profile.role]}</p>
            </div>
            <button type="button" onClick={signOut} className="rounded-md p-1.5 text-white/40 transition hover:bg-white/5 hover:text-gold-light" title="Sign out" aria-label="Sign out">
              <NavIcon name="signout" size={18} />
            </button>
          </div>
          {profile.houseId && <HouseBadge houseId={profile.houseId} size="xs" className="mt-2.5" />}
        </div>
      )}
    </aside>
  );
}

/** Mobile bottom tab bar. */
export function TabBar() {
  const { role } = useAuth();
  const items = navItemsForRole(role);
  const isActive = useIsActive();
  const crowded = items.length > 5;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gold/30 bg-royal-panel/95 backdrop-blur-md pb-safe md:hidden" aria-label="Main">
      <div className="absolute inset-x-0 -top-[4px] h-px bg-gold/15" />
      <div className="mx-auto flex max-w-xl">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn('relative flex min-w-0 flex-1 flex-col items-center gap-1 pb-2 pt-2.5 transition', active ? 'text-gold-light' : 'text-white/45 active:text-white/70')}
            >
              <span className={cn('absolute top-0 h-[3px] w-10 rounded-b bg-gold transition', active ? 'opacity-100' : 'opacity-0')} />
              <span className={cn('transition', active && 'drop-shadow-[0_0_8px_rgba(212,168,67,0.7)]')}>
                <NavIcon name={item.icon} size={23} />
              </span>
              <span className={cn('truncate font-heading font-bold uppercase', crowded ? 'text-[9px] tracking-[0.02em]' : 'text-[10px] tracking-[0.08em]')}>
                {crowded ? item.short ?? item.label : item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
