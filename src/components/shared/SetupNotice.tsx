'use client';

import { Crest } from './Crest';
import { GoldBorder } from './GoldBorder';
import { OrnamentalDivider } from './OrnamentalDivider';

/** Shown when the Firebase environment variables are missing. */
export function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <GoldBorder className="w-full max-w-lg p-7">
        <div className="flex items-center gap-4">
          <Crest size={56} />
          <div>
            <h1 className="font-display text-2xl font-bold text-gold-gradient">LeaderQuest</h1>
            <p className="text-sm text-white/55">Firebase isn’t configured yet.</p>
          </div>
        </div>
        <OrnamentalDivider className="my-5" />
        <ol className="list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-white/80">
          <li>
            Copy <code className="rounded bg-black/40 px-1.5 py-0.5 text-gold-light">.env.local.example</code> to{' '}
            <code className="rounded bg-black/40 px-1.5 py-0.5 text-gold-light">.env.local</code> and paste in your Firebase web app config.
          </li>
          <li>Restart <code className="rounded bg-black/40 px-1.5 py-0.5 text-gold-light">npm run dev</code>.</li>
          <li>
            Or run fully local: <code className="rounded bg-black/40 px-1.5 py-0.5 text-gold-light">npm run emulators</code>, then{' '}
            <code className="rounded bg-black/40 px-1.5 py-0.5 text-gold-light">npm run seed:emu</code> and{' '}
            <code className="rounded bg-black/40 px-1.5 py-0.5 text-gold-light">npm run dev:emu</code>.
          </li>
        </ol>
      </GoldBorder>
    </div>
  );
}
