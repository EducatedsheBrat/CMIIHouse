'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authErrorMessage, homeForRole, useAuth } from '../../hooks/useAuth';
import { emailLoginEnabled } from '../../lib/env';
import { HOUSE_IDS } from '../../lib/constants';
import { Crest } from '../shared/Crest';
import { GoldBorder } from '../shared/GoldBorder';
import { OrnamentalDivider } from '../shared/OrnamentalDivider';
import { Shield } from '../shared/Shield';
import { FullScreenLoader, Notice, Spinner } from '../shared/States';

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function LoginScreen() {
  const { status, role, firebaseUser, signInWithGoogle, signInWithEmail, signOut } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Once signed in, return to the page that sent us here (same-origin paths only), else the role's home.
  useEffect(() => {
    if (status !== 'ready') return;
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login') ? next : null;
    router.replace(safeNext ?? homeForRole(role));
  }, [status, role, next, router]);

  if ((status === 'loading' && !busy) || status === 'ready') return <FullScreenLoader />;

  const run = async (kind: 'google' | 'email', fn: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const onEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    run('email', () => signInWithEmail(email, password));
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* Royal backdrop: a soft halo and the four house shields keeping watch. */}
      <div className="pointer-events-none absolute left-1/2 top-[18%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-royal-panel/60 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-8 hidden justify-center gap-[46vw] opacity-20 lg:flex">
        <div className="flex flex-col gap-10">
          <Shield houseId={HOUSE_IDS[0]} size={70} />
          <Shield houseId={HOUSE_IDS[2]} size={70} />
        </div>
        <div className="flex flex-col gap-10">
          <Shield houseId={HOUSE_IDS[1]} size={70} />
          <Shield houseId={HOUSE_IDS[3]} size={70} />
        </div>
      </div>

      <Link href="/" className="relative mb-6 btn-text">
        ← Leaderboard
      </Link>

      <GoldBorder className="relative w-full max-w-sm px-6 pb-7 pt-8 animate-fade-up">
        <div className="flex flex-col items-center text-center">
          <Crest size={84} className="drop-shadow-[0_0_24px_rgba(212,168,67,0.35)]" />
          <h1 className="mt-4 font-display text-[28px] font-black leading-tight text-gold-gradient">CMII House Points</h1>
          <p className="mt-1 font-heading text-[11px] uppercase tracking-[0.28em] text-white/55">The CMII House System</p>
        </div>

        <OrnamentalDivider className="my-6" />

        {status === 'unprovisioned' ? (
          <div className="parchment p-4 text-center">
            <p className="font-heading text-sm font-bold">Not yet on the house rolls</p>
            <p className="mt-1.5 text-xs leading-relaxed text-parchment-ink/75">
              <strong className="break-all">{firebaseUser?.email ?? 'This account'}</strong> hasn’t been added to CMII House Points. Sign in with your GSU account, or ask a CMII admin to add you.
            </p>
            <button type="button" onClick={signOut} className="mt-3 font-heading text-xs font-bold uppercase tracking-[0.14em] text-parchment-ink underline-offset-4 hover:underline">
              Use a different account
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => run('google', signInWithGoogle)}
              disabled={busy !== null}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gold/50 bg-white px-4 py-3 text-[15px] font-semibold text-[#1f1f1f] transition hover:bg-parchment disabled:opacity-60"
            >
              {busy === 'google' ? <Spinner size={18} className="border-black/20 border-t-black/70" /> : <GoogleG />}
              Sign in with Google
            </button>
            <p className="mt-2 text-center text-[11px] text-white/40">Use your @gsu.edu account</p>

            {emailLoginEnabled && (
              <>
                <OrnamentalDivider label="or" className="my-5" color="#B38E3A" />
                <form onSubmit={onEmailSubmit} className="space-y-3">
                  <div>
                    <label htmlFor="email" className="label">Email</label>
                    <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@gsu.edu" />
                  </div>
                  <div>
                    <label htmlFor="password" className="label">Password</label>
                    <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
                  </div>
                  <button type="submit" disabled={busy !== null} className="btn btn-gold w-full py-3">
                    {busy === 'email' && <Spinner size={14} className="border-black/20 border-t-black/70" />}
                    Enter the Hall
                  </button>
                </form>
              </>
            )}
          </>
        )}

        {error && <Notice tone="error" className="mt-4">{error}</Notice>}
      </GoldBorder>

      <p className="relative mt-6 text-center text-[11px] text-white/35">Creative Media Industries Institute · Georgia State University</p>
    </div>
  );
}
