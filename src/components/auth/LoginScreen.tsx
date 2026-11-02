'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authErrorMessage, homeForRole, useAuth } from '../../hooks/useAuth';
import { HOUSE_IDS } from '../../lib/constants';
import { Crest } from '../shared/Crest';
import { GoldBorder } from '../shared/GoldBorder';
import { OrnamentalDivider } from '../shared/OrnamentalDivider';
import { Shield } from '../shared/Shield';
import { FullScreenLoader, Notice, Spinner } from '../shared/States';

export function LoginScreen() {
  const { status, role, firebaseUser, signInWithGoogle, signOut } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [busy, setBusy] = useState<'gsu' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Once signed in, return to the page that sent us here (same-origin paths only), else the role's home.
  useEffect(() => {
    if (status !== 'ready') return;
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login') ? next : null;
    router.replace(safeNext ?? homeForRole(role));
  }, [status, role, next, router]);

  if ((status === 'loading' && !busy) || status === 'ready') return <FullScreenLoader />;

  const run = async (kind: 'gsu', fn: () => Promise<void>) => {
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
          <h1 className="mt-4 font-display text-[28px] font-black leading-tight text-gold-gradient">CMII Den Points</h1>
          <p className="mt-1 font-heading text-[11px] uppercase tracking-[0.28em] text-white/55">The CMII House System</p>
        </div>

        <OrnamentalDivider className="my-6" />

        {status === 'unprovisioned' ? (
          <div className="parchment p-4 text-center">
            <p className="font-heading text-sm font-bold">Not yet on the house rolls</p>
            <p className="mt-1.5 text-xs leading-relaxed text-parchment-ink/75">
              <strong className="break-all">{firebaseUser?.email ?? 'This account'}</strong> hasn’t been added to Den Points. Sign in with your GSU account, or ask a CMII admin to add you.
            </p>
            <button type="button" onClick={signOut} className="mt-3 font-heading text-xs font-bold uppercase tracking-[0.14em] text-parchment-ink underline-offset-4 hover:underline">
              Use a different account
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => run('gsu', signInWithGoogle)}
              disabled={busy !== null}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gold/50 bg-white px-4 py-3 text-[15px] font-semibold text-[#1f1f1f] transition hover:bg-parchment disabled:opacity-60"
            >
              {busy === 'gsu' && <Spinner size={18} className="border-black/20 border-t-black/70" />}
              Sign in with your GSU account
            </button>
            <p className="mt-2 text-center text-[11px] text-white/40">Use your @gsu.edu or @student.gsu.edu email</p>
          </>
        )}

        {error && <Notice tone="error" className="mt-4">{error}</Notice>}
      </GoldBorder>

      <p className="relative mt-6 text-center text-[11px] text-white/35">Creative Media Industries Institute · Georgia State University</p>
    </div>
  );
}
