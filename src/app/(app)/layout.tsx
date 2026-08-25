import DashboardShell from '@/components/dashboard-shell';
import { RouteGuard } from '@/components/route-guard';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell>
      <RouteGuard>{children}</RouteGuard>
    </DashboardShell>
  );
}
