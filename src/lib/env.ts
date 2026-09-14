// Next.js inlines NEXT_PUBLIC_* values at build time. Each one must be referenced
// literally (no dynamic process.env[key] lookups) for that to work.

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

export const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

export const emailLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_EMAIL_LOGIN !== 'false';
