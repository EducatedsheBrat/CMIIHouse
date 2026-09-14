'use client';

import { Suspense, useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { homeForRole, useAuth } from '../../hooks/useAuth';
import type { Role } from '../../lib/constants';
import { FullScreenLoader, SkeletonRows } from '../shared/States';

interface ProtectedPageProps {
  children: ReactNode;
  /** Omit to allow any signed-in member. */
  allowedRoles?: Role[];
}

/**
 * Client-side route protection: signed-out visitors go to /login (and come back afterward),
 * and members without an allowed role go to their own home page.
 * Firestore security rules remain the real enforcement — this only shapes navigation.
 */
export function ProtectedPage({ children, allowedRoles }: ProtectedPageProps) {
  const { status, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const signedOut = status === 'signedOut' || status === 'unprovisioned';
  const forbidden = status === 'ready' && !!allowedRoles && (!role || !allowedRoles.includes(role));

  useEffect(() => {
    if (signedOut) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (forbidden) router.replace(homeForRole(role));
  }, [signedOut, forbidden, role, pathname, router]);

  if (status === 'loading') return <FullScreenLoader />;
  if (signedOut || forbidden) return null;

  // Suspense lets pages read query params (useSearchParams) without opting the build out of prerendering.
  return <Suspense fallback={<SkeletonRows rows={6} height={64} />}>{children}</Suspense>;
}
