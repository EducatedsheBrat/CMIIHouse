'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { Avatar } from '../shared/Avatar';
import { Crest } from '../shared/Crest';
import { HouseBadge } from '../shared/HouseBadge';
import { NavIcon } from './NavIcons';

/** Top bar with CMII Houses branding. On desktop it only shows for signed-out visitors (the sidebar carries the brand). */
export function Header() {
  const { status, profile, signOut } = useAuth();
  const signedIn = status === 'ready';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <header className={cn('sticky top-0 z-20 border-b border-gold/25 bg-royal/85 backdrop-blur-md', signedIn && 'md:hidden')} style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Crest size={28} />
          <span className="font-display text-[17px] font-bold tracking-wide text-gold-gradient">CMII Houses</span>
        </Link>

        {status === 'signedOut' || status === 'unprovisioned' ? (
          <Link href="/login" className="btn btn-ghost btn-sm">
            Sign In
          </Link>
        ) : signedIn && profile ? (
          <div className="relative" ref={menuRef}>
            <button type="button" onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-0.5" aria-label="Account menu" aria-expanded={menuOpen}>
              <Avatar name={profile.displayName} houseId={profile.houseId} size={34} ring={menuOpen} />
            </button>
            {menuOpen && (
              <div className="lq-card absolute right-0 mt-2 w-60 p-3 animate-fade-in">
                <p className="truncate text-sm font-semibold">{profile.displayName}</p>
                <p className="truncate text-xs text-white/45">{profile.email}</p>
                {profile.houseId && <HouseBadge houseId={profile.houseId} size="xs" className="mt-2" />}
                <div className="my-3 h-px bg-gold/20" />
                <a href="/kiosk" target="_blank" rel="noreferrer" className="flex items-center gap-2 py-1.5 text-sm text-white/70 hover:text-gold-light">
                  <NavIcon name="kiosk" size={17} /> Kiosk display
                </a>
                <button type="button" onClick={signOut} className="flex w-full items-center gap-2 py-1.5 text-sm text-white/70 hover:text-gold-light">
                  <NavIcon name="signout" size={17} /> Sign out
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}
