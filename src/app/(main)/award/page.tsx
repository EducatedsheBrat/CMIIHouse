import type { Metadata } from 'next';
import { ProtectedPage } from '../../../components/auth/ProtectedPage';
import { AwardPoints } from '../../../components/award/AwardPoints';

export const metadata: Metadata = { title: 'Award Points' };

export default function AwardPage() {
  return (
    <ProtectedPage allowedRoles={['faculty', 'admin']}>
      <AwardPoints />
    </ProtectedPage>
  );
}
