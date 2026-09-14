import type { Metadata } from 'next';
import { ProtectedPage } from '../../../components/auth/ProtectedPage';
import { SortingCeremony } from '../../../components/ceremony/SortingCeremony';

export const metadata: Metadata = { title: 'Sorting Ceremony' };

export default function CeremonyPage() {
  return (
    <ProtectedPage allowedRoles={['faculty', 'admin']}>
      <SortingCeremony />
    </ProtectedPage>
  );
}
