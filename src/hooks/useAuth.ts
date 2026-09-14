'use client';

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { userKey, type Role } from '../lib/constants';
import type { AppUser } from '../lib/types';
import { toAppUser } from './useStudents';

export type AuthStatus = 'loading' | 'signedOut' | 'unprovisioned' | 'ready';

interface AuthContextValue {
  status: AuthStatus;
  firebaseUser: User | null;
  profile: AppUser | null;
  role: Role | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function homeForRole(role: Role | null | undefined): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'faculty':
      return '/award';
    case 'student':
      return '/dashboard';
    default:
      return '/';
  }
}

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'That email and password don’t match an account.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method isn’t enabled in Firebase Authentication yet.';
    case 'auth/unauthorized-domain':
      return 'This domain isn’t authorized for sign-in. Add it in Firebase → Authentication → Settings.';
    default:
      return (err as Error)?.message || 'Something went wrong signing in.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  // The profile snapshot is tagged with the email it belongs to so a stale
  // profile never flashes for a different account.
  const [profileState, setProfileState] = useState<{ key: string; profile: AppUser | null } | null>(null);
  const linkedRef = useRef<string | null>(null);

  useEffect(() => {
    getRedirectResult(auth).catch(() => undefined);
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthResolved(true);
    });
  }, []);

  const email = firebaseUser?.email ? userKey(firebaseUser.email) : null;

  useEffect(() => {
    if (!email) return;
    return onSnapshot(
      doc(db, 'users', email),
      (snap) => {
        setProfileState({
          key: email,
          profile: snap.exists() ? toAppUser(snap.id, snap.data()) : null,
        });
      },
      () => setProfileState({ key: email, profile: null }),
    );
  }, [email]);

  const profile = profileState && profileState.key === email ? profileState.profile : null;

  // Record the auth uid + last login once per session.
  useEffect(() => {
    if (!firebaseUser) {
      linkedRef.current = null;
      return;
    }
    if (!profile || linkedRef.current === firebaseUser.uid) return;
    linkedRef.current = firebaseUser.uid;
    const patch: Record<string, unknown> = { uid: firebaseUser.uid, lastLoginAt: serverTimestamp() };
    if (firebaseUser.photoURL) patch.photoURL = firebaseUser.photoURL;
    updateDoc(doc(db, 'users', profile.id), patch).catch(() => undefined);
  }, [firebaseUser, profile]);

  let status: AuthStatus;
  if (!authResolved) status = 'loading';
  else if (!firebaseUser) status = 'signedOut';
  else if (!email) status = 'unprovisioned';
  else if (!profileState || profileState.key !== email) status = 'loading';
  else status = profile ? 'ready' : 'unprovisioned';

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw err;
    }
  }, []);

  const signInWithEmail = useCallback(async (emailInput: string, password: string) => {
    await signInWithEmailAndPassword(auth, emailInput.trim(), password);
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      firebaseUser,
      profile: status === 'ready' ? profile : null,
      role: status === 'ready' ? profile?.role ?? null : null,
      signInWithGoogle,
      signInWithEmail,
      signOut,
    }),
    [status, firebaseUser, profile, signInWithGoogle, signInWithEmail, signOut],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
