import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured, useEmulators } from './env';

// Firebase runs in the browser only. During Next.js prerendering (and when the env vars
// are missing) these stay unset; every Firestore/Auth call in the app happens inside
// effects or event handlers, which never run on the server.
const inBrowser = typeof window !== 'undefined';

function init(): { app: FirebaseApp; auth: Auth; db: Firestore } | null {
  if (!inBrowser || !isFirebaseConfigured) return null;

  // Reuse the app across Fast Refresh reloads instead of initializing twice.
  const existing = getApps()[0];
  const app = existing ?? initializeApp(firebaseConfig);
  const auth = getAuth(app);

  let db: Firestore;
  if (existing) {
    db = getFirestore(app);
  } else {
    // Persistent cache lets the leaderboard render the last-known standings offline.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
    if (useEmulators) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
  }
  return { app, auth, db };
}

const firebase = init();

export const app = firebase?.app as FirebaseApp;
export const auth = firebase?.auth as Auth;
export const db = firebase?.db as Firestore;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
