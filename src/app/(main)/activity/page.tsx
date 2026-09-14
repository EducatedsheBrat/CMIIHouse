import type { Metadata } from 'next';
import { ProtectedPage } from '../../../components/auth/ProtectedPage';
import { ActivityFeed } from '../../../components/feed/ActivityFeed';

export const metadata: Metadata = { title: 'Activity' };

export default function ActivityPage() {
  return (
    <ProtectedPage>
      <ActivityFeed />
    </ProtectedPage>
  );
}
