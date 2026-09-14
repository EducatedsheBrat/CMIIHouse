import type { Metadata } from 'next';
import { ProtectedPage } from '../../../components/auth/ProtectedPage';
import { StudentDash } from '../../../components/dashboard/StudentDash';

export const metadata: Metadata = { title: 'My House' };

export default function DashboardPage() {
  return (
    <ProtectedPage allowedRoles={['student']}>
      <StudentDash />
    </ProtectedPage>
  );
}
