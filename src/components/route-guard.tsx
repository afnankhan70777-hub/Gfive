'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { hasPermission, getFirstPermittedRoute } from '@/lib/utils';

const routePermissionMap: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/parts-inventory': 'inventory',
  '/production': 'production',
  '/sales': 'sales',
  '/returns': 'returns',
  '/repair': 'repair',
  '/imei-management': 'imei',
  '/imei-management/batch': 'imei',
  '/party-ledger': 'parties',
  '/reports': 'reports',
  '/users': 'users',
  // '/settings' removed — accessible to all users with filtered content
};

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const required = routePermissionMap[pathname];
    if (!required) return;

    const perms = currentUser?.role?.permissions || [];
    if (!hasPermission(perms, required)) {
      const fallbackRoute = getFirstPermittedRoute(perms);
      router.replace(fallbackRoute);
    }
  }, [pathname, isAuthenticated, currentUser, router]);

  return <>{children}</>;
}
