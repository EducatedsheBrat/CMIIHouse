'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Reads and writes URL query params (e.g. ?house=ase) with Next.js navigation.
 * Pages using this must render inside a <Suspense> boundary — ProtectedPage provides one.
 */
export function useSearchParam(key: string): [string | null, (value: string | null, opts?: { push?: boolean }) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const value = params.get(key);

  const setValue = useCallback(
    (next: string | null, opts?: { push?: boolean }) => {
      const updated = new URLSearchParams(params.toString());
      if (next === null) updated.delete(key);
      else updated.set(key, next);
      const qs = updated.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      if (opts?.push) router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    },
    [params, router, pathname, key],
  );

  return [value, setValue];
}
