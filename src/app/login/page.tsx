import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginScreen } from '../../components/auth/LoginScreen';
import { FullScreenLoader } from '../../components/shared/States';

export const metadata: Metadata = { title: 'Sign In' };

/** Full-bleed sign-in page, outside the (main) chrome like the kiosk. */
export default function LoginPage() {
  return (
    // LoginScreen reads ?next= with useSearchParams, which needs a Suspense boundary.
    <Suspense fallback={<FullScreenLoader />}>
      <LoginScreen />
    </Suspense>
  );
}
