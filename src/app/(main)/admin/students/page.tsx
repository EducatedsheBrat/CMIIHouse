import type { Metadata } from 'next';
import { StudentsPage } from '../../../../components/admin/StudentsPage';
import { ProtectedPage } from '../../../../components/auth/ProtectedPage';

export const metadata: Metadata = { title: 'Students' };

export default function AdminStudentsPage() {
  return (
    <ProtectedPage allowedRoles={['admin']}>
      <StudentsPage />
    </ProtectedPage>
  );
}
