import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Currency ──────────────────────────────────────────────
const CURRENCY_SYMBOLS: Record<string, string> = {
  PKR: 'Rs.',
  USD: '$',
  EUR: '€',
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

export function formatCurrency(amount: number, currency: string = 'PKR'): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol} ${amount.toLocaleString()}`;
}

export function formatCurrencyCompact(amount: number, currency: string = 'PKR'): string {
  const symbol = getCurrencySymbol(currency);
  if (amount >= 10000000) return `${symbol} ${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${symbol} ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${symbol} ${(amount / 1000).toFixed(1)}K`;
  return `${symbol} ${amount.toLocaleString()}`;
}

// ── Date / Time ───────────────────────────────────────────
export function formatDate(date: Date | string, format: string = 'DD-MM-YYYY', timeZone?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  const shortYear = year.slice(-2);

  let result = format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year)
    .replace('YY', shortYear);

  if (timeZone) {
    try {
      result += ` (${timeZone.split('/').pop()})`;
    } catch { /* ignore */ }
  }

  return result;
}

export function formatDistanceToNow(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}mo ago`;
  return `${Math.floor(diffDay / 365)}y ago`;
}

export type PeriodFilter = 'this-month' | 'last-month' | 'this-quarter' | 'this-year';

export function getPeriodBounds(period: PeriodFilter, now = new Date()) {
  const start = new Date(now);
  const end = new Date(now);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case 'this-month':
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      break;
    case 'last-month': {
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end.setDate(0);
      break;
    }
    case 'this-quarter': {
      const quarter = Math.floor(start.getMonth() / 3);
      start.setMonth(quarter * 3);
      start.setDate(1);
      end.setMonth(quarter * 3 + 3);
      end.setDate(0);
      break;
    }
    case 'this-year': {
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      break;
    }
  }

  return { start, end };
}

export function isDateInPeriod(date: Date | string, period: PeriodFilter, now = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return false;
  const { start, end } = getPeriodBounds(period, now);
  return d >= start && d <= end;
}

// ── Permissions ───────────────────────────────────────────
export function hasPermission(userPermissions: string[] | undefined, required: string): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(required);
}

export function hasAnyPermission(userPermissions: string[] | undefined, required: string[]): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes('*')) return true;
  return required.some((p) => userPermissions.includes(p));
}

/**
 * Check if user can perform a specific CRUD action on a module.
 * Examples: canDoAction(perms, 'sales', 'create') → checks for 'sales:create' or '*'
 */
export function canDoAction(
  userPermissions: string[] | undefined,
  module: string,
  action: 'view' | 'create' | 'edit' | 'delete'
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes('*')) return true;
  // view action is covered by the base module permission (e.g., 'sales')
  if (action === 'view') {
    return userPermissions.includes(module);
  }
  return userPermissions.includes(`${module}:${action}`);
}

// Ordered list of routes to check for first permitted page after login
const PERMITTED_ROUTE_ORDER: { route: string; permission: string }[] = [
  { route: '/dashboard', permission: 'dashboard' },
  { route: '/parts-inventory', permission: 'inventory' },
  { route: '/production', permission: 'production' },
  { route: '/sales', permission: 'sales' },
  { route: '/returns', permission: 'returns' },
  { route: '/repair', permission: 'repair' },
  { route: '/imei-management', permission: 'imei' },
  { route: '/party-ledger', permission: 'parties' },
  { route: '/reports', permission: 'reports' },
  { route: '/users', permission: 'users' },
  { route: '/settings', permission: 'settings' },
];

export function getFirstPermittedRoute(userPermissions: string[] | undefined): string {
  if (!userPermissions || userPermissions.length === 0) return '/';
  for (const { route, permission } of PERMITTED_ROUTE_ORDER) {
    if (hasPermission(userPermissions, permission)) {
      return route;
    }
  }
  return '/';
}

// ── Password Validation ───────────────────────────────────
export function validatePassword(password: string, rules: {
  minLength: number;
  requireSpecialChar: boolean;
  requireNumber: boolean;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < rules.minLength) {
    errors.push(`Password must be at least ${rules.minLength} characters`);
  }
  if (rules.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (rules.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
}
