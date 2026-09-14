import type { Metadata } from 'next';
import { ProtectedPage } from '../../../components/auth/ProtectedPage';
import { Roster } from '../../../components/roster/Roster';

export const metadata: Metadata = { title: 'House Rosters' };

export default function RosterPage() {
  return (
    <ProtectedPage allowedRoles={['faculty', 'admin']}>
      <Roster />
    </ProtectedPage>
  );
}
