import type { Metadata } from 'next';
import { Leaderboard } from '../../../components/leaderboard/Leaderboard';

export const metadata: Metadata = { title: 'CMII Media Cup' };

/** Same standings as "/" — the nav's Leaderboard tab points here. */
export default function LeaderboardPage() {
  return <Leaderboard />;
}
