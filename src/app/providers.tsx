'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '../hooks/useAuth';
import { isFirebaseConfigured } from '../lib/env';
import { SetupNotice } from '../components/shared/SetupNotice';
import { ToastProvider } from '../components/shared/Toast';

/** App-wide client context. Without Firebase config, a setup screen replaces the app instead of crashing. */
export function Providers({ children }: { children: ReactNode }) {
  if (!isFirebaseConfigured) return <SetupNotice />;
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
