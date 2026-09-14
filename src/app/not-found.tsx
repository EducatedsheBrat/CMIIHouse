import Link from 'next/link';
import { Crest } from '../components/shared/Crest';
import { GoldBorder } from '../components/shared/GoldBorder';
import { OrnamentalDivider } from '../components/shared/OrnamentalDivider';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <GoldBorder className="w-full max-w-sm px-6 py-8 text-center">
        <Crest size={64} className="mx-auto" />
        <h1 className="mt-4 font-display text-2xl font-black text-gold-gradient">Lost in the halls</h1>
        <OrnamentalDivider className="my-4" />
        <p className="text-sm text-white/60">That page isn’t part of the house system.</p>
        <Link href="/" className="btn btn-gold mt-6">
          Back to the Cup
        </Link>
      </GoldBorder>
    </div>
  );
}
