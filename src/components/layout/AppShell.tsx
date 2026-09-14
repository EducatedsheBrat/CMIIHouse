'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { Header } from './Header';
import { InstallPrompt } from './InstallPrompt';
import { SideNav, TabBar } from './NavBar';

function subscribeOnline(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

/** navigator.onLine as live state; the server render assumes online. */
function useOnline() {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

const WIDE_ROUTES = ['/ceremony', '/admin/students'];

/** Header + sidebar (desktop) / tab bar (mobile) chrome for every page except the kiosk. */
export function AppShell({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const signedIn = status === 'ready';
  const online = useOnline();
  const pathname = usePathname();
  const wide = WIDE_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <div className="min-h-screen">
      {signedIn && <SideNav />}
      <div className={cn(signedIn && 'md:pl-64')}>
        <Header />
        {!online && (
          <div className="border-b border-gold/30 bg-gold/10 px-4 py-1.5 text-center text-xs font-medium text-gold-light">
            You’re offline — showing the last saved standings.
          </div>
        )}
        <main
          className={cn(
            'mx-auto w-full px-4 pt-5 md:px-8 md:pt-8',
            wide ? 'max-w-7xl' : 'max-w-5xl',
            signedIn ? 'pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-12' : 'pb-12',
          )}
        >
          {children}
        </main>
      </div>
      {signedIn && <TabBar />}
      <InstallPrompt />
    </div>
  );
}
