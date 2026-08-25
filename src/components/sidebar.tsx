'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Factory,
  Smartphone,
  ShoppingCart,
  Users,
  BookOpen,
  RotateCcw,
  Wrench,
  BarChart3,
  Settings,
  ChevronRight,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { cn, hasPermission } from '@/lib/utils';
import { useSettingsStore, useAuthStore } from '@/lib/store';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission: string;
  subItems?: { label: string; href: string }[];
}

const allSidebarItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { label: 'Parts Inventory', href: '/parts-inventory', icon: Package, permission: 'inventory' },
  { label: 'Production', href: '/production', icon: Factory, permission: 'production' },
  { label: 'Sales / Dispatch', href: '/sales', icon: ShoppingCart, permission: 'sales' },
  { label: 'Returns & QC', href: '/returns', icon: RotateCcw, permission: 'returns' },
  { label: 'Repair Management', href: '/repair', icon: Wrench, permission: 'repair' },
  {
    label: 'IMEI Management',
    href: '/imei-management',
    icon: Smartphone,
    permission: 'imei',
    subItems: [
      { label: 'All IMEIs', href: '/imei-management' },
      { label: 'Batch Tracking', href: '/imei-management/batch' },
    ],
  },
  { label: 'Party Ledger', href: '/party-ledger', icon: BookOpen, permission: 'parties' },
  { label: 'Reports & Analytics', href: '/reports', icon: BarChart3, permission: 'reports' },
  { label: 'Users & Roles', href: '/users', icon: Users, permission: 'users' },
  { label: 'Audit Logs', href: '/audit-logs', icon: Shield, permission: 'users' },
  { label: 'Settings', href: '/settings', icon: Settings, permission: '' }, // Accessible to all users
];

export function Sidebar() {
  const pathname = usePathname();
  const settings = useSettingsStore((s) => s.settings);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [collapsed, setCollapsed] = useState(settings.appearance.sidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['IMEI Management']);

  // Sync collapsed state when settings change
  useEffect(() => {
    setCollapsed(settings.appearance.sidebarCollapsed);
  }, [settings.appearance.sidebarCollapsed]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const sidebarWidth = collapsed ? 72 : 260;

  // Filter items based on user permissions
  const userPerms = currentUser?.role?.permissions || [];
  const sidebarItems = allSidebarItems.filter((item) =>
    hasPermission(userPerms, item.permission)
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-[#0f1525] border border-[#1e2a3a] text-[#94a3b8] hover:text-[#c9a84c]"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar - always visible, part of document flow */}
      <aside
        className="hidden md:flex flex-col h-screen bg-[#0a0e17] border-r border-[#1e2a3a]/60 overflow-hidden flex-shrink-0 transition-[width] duration-200 ease-out"
        style={{ width: sidebarWidth }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1e2a3a]/60">
          {!collapsed && (
            <div className="overflow-hidden transition-opacity duration-200 leading-none">
              <span
                style={{
                  fontFamily: 'var(--font-sora), sans-serif',
                  fontWeight: 800,
                  fontSize: '17px',
                  letterSpacing: '0.5px',
                  lineHeight: 1,
                }}
              >
                <span style={{ color: '#f5f7fb' }}>G</span>
                <span style={{ color: '#f5f7fb' }}>&apos;</span>
                <span style={{ color: '#ffd873', textShadow: '0 0 12px rgba(255,216,115,0.45)' }}>FIVE</span>
              </span>
              <p
                className="mt-1.5"
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '4.5px',
                  color: '#caa24a',
                  opacity: 0.9,
                }}
              >
                PAKISTAN
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const expanded = expandedItems.includes(item.label);

            return (
              <div key={item.label}>
                <Link
                  href={item.href}
                  onClick={(e) => {
                    if (item.subItems) {
                      e.preventDefault();
                      toggleExpand(item.label);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150',
                    active
                      ? 'bg-[rgba(201,168,76,0.15)] text-[#c9a84c] border-r-2 border-[#c9a84c]'
                      : 'text-[#94a3b8] hover:text-[#c9a84c] hover:bg-[rgba(201,168,76,0.06)]'
                  )}
                >
                  <Icon size={18} className={cn('flex-shrink-0', active && 'text-[#c9a84c]')} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 whitespace-nowrap font-medium">{item.label}</span>
                      {item.subItems && (
                        <span
                          className="transition-transform duration-150"
                          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                        >
                          <ChevronRight size={14} />
                        </span>
                      )}
                    </>
                  )}
                </Link>

                {/* Sub Items - CSS only expand */}
                {item.subItems && expanded && !collapsed && (
                  <div className="ml-9 mt-0.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={cn(
                          'block px-3 py-1.5 rounded-md text-xs transition-colors duration-150',
                          pathname === sub.href
                            ? 'text-[#c9a84c] bg-[rgba(201,168,76,0.08)]'
                            : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[rgba(201,168,76,0.04)]'
                        )}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Collapse Toggle (Desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center py-3 border-t border-[#1e2a3a]/60 text-[#64748b] hover:text-[#c9a84c] transition-colors duration-150"
        >
          <span
            className="transition-transform duration-150"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <ChevronRight size={16} />
          </span>
        </button>
      </aside>

      {/* Mobile Sidebar - fixed overlay */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-[260px] z-50 bg-[#0a0e17] border-r border-[#1e2a3a]/60 flex flex-col overflow-hidden md:hidden',
          'transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1e2a3a]/60">
          <div className="overflow-hidden leading-none">
            <span
              style={{
                fontFamily: 'var(--font-sora), sans-serif',
                fontWeight: 800,
                fontSize: '17px',
                letterSpacing: '0.5px',
                lineHeight: 1,
              }}
            >
              <span style={{ color: '#f5f7fb' }}>G</span>
              <span style={{ color: '#f5f7fb' }}>&apos;</span>
              <span style={{ color: '#ffd873', textShadow: '0 0 12px rgba(255,216,115,0.45)' }}>FIVE</span>
            </span>
            <p
              className="mt-1.5"
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '4.5px',
                color: '#caa24a',
                opacity: 0.9,
              }}
            >
              PAKISTAN
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const expanded = expandedItems.includes(item.label);

            return (
              <div key={item.label}>
                <Link
                  href={item.href}
                  onClick={(e) => {
                    if (item.subItems) {
                      e.preventDefault();
                      toggleExpand(item.label);
                    } else {
                      setMobileOpen(false);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150',
                    active
                      ? 'bg-[rgba(201,168,76,0.15)] text-[#c9a84c] border-r-2 border-[#c9a84c]'
                      : 'text-[#94a3b8] hover:text-[#c9a84c] hover:bg-[rgba(201,168,76,0.06)]'
                  )}
                >
                  <Icon size={18} className={cn('flex-shrink-0', active && 'text-[#c9a84c]')} />
                  <span className="flex-1 whitespace-nowrap font-medium">{item.label}</span>
                  {item.subItems && (
                    <span
                      className="transition-transform duration-150"
                      style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    >
                      <ChevronRight size={14} />
                    </span>
                  )}
                </Link>

                {/* Sub Items */}
                {item.subItems && expanded && (
                  <div className="ml-9 mt-0.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'block px-3 py-1.5 rounded-md text-xs transition-colors duration-150',
                          pathname === sub.href
                            ? 'text-[#c9a84c] bg-[rgba(201,168,76,0.08)]'
                            : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[rgba(201,168,76,0.04)]'
                        )}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
