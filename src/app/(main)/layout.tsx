import { AppShell } from '../../components/layout/AppShell';

/** Header + navigation for every page in the (main) group. The kiosk and login pages sit outside it. */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
