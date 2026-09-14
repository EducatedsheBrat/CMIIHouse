import type { Metadata } from 'next';
import { AdminPanel } from '../../../components/admin/AdminPanel';
import { ProtectedPage } from '../../../components/auth/ProtectedPage';

export const metadata: Metadata = { title: 'Admin' };

export default function AdminPage() {
  return (
    <ProtectedPage allowedRoles={['admin']}>
      <AdminPanel />
    </ProtectedPage>
  );
}
