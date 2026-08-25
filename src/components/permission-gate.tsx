'use client';

import { useAuthStore } from '@/lib/store';
import { hasPermission } from '@/lib/utils';

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const perms = currentUser?.role?.permissions || [];

  if (hasPermission(perms, permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
