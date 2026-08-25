'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Settings,
  ChevronDown,
  LogOut,
  User,
  HelpCircle,
  Smartphone,
  Package,
  Users,
  ShoppingCart,
  RotateCcw,
  Wrench,
  FileText,
  BarChart3,
  ArrowRight,
  X,
  MessageCircle,
} from 'lucide-react';
import { cn, formatCurrency, getCurrencySymbol, formatDistanceToNow, hasPermission } from '@/lib/utils';
import { useAuthStore, useSettingsStore, useDataStore } from '@/lib/store';
import { useChatStore } from '@/lib/chat-store';
import { createClient } from '@/utils/supabase/client';
import type { AppSettings } from '@/lib/types';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  icon: React.ElementType;
  href: string;
}

export function Header() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { currentUser, logout } = useAuthStore();
  const settings = useSettingsStore((s) => s.settings);
  const supabase = createClient();

  // Data stores for global search
  const imeis = useDataStore((s) => s.imeis);
  const sales = useDataStore((s) => s.sales);
  const parties = useDataStore((s) => s.parties);
  const batches = useDataStore((s) => s.batches);
  const components = useDataStore((s) => s.components);
  const repairOrders = useDataStore((s) => s.repairOrders);
  const returns = useDataStore((s) => s.returns);
  const payments = useDataStore((s) => s.payments);
  const users = useDataStore((s) => s.users);
  const chatUnreadCounts = useChatStore((s) => s.unreadCounts);
  const messages = useChatStore((s) => s.messages);

  const userPerms = currentUser?.role?.permissions || [];

  // Close notifications dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (notificationsOpen || profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [notificationsOpen, profileOpen]);

  // Update browser tab title with unread count
  useEffect(() => {
    const totalChatUnread = Object.values(chatUnreadCounts).reduce((a, b) => a + b, 0);
    const baseTitle = "G'FIVE Pakistan - ERP System";
    if (totalChatUnread > 0) {
      document.title = `(${totalChatUnread}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [chatUnreadCounts]);

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    // IMEIs
    imeis.forEach((i) => {
      if (i.imei.toLowerCase().includes(q) || i.model.toLowerCase().includes(q)) {
        results.push({
          id: `imei-${i.id}`,
          title: i.imei,
          subtitle: `${i.model} — ${i.status}`,
          type: 'IMEI',
          icon: Smartphone,
          href: '/imei-management',
        });
      }
    });

    // Sales / Invoices
    sales.forEach((s) => {
      if (s.invoice.toLowerCase().includes(q) || s.partyName.toLowerCase().includes(q)) {
        results.push({
          id: `sale-${s.id}`,
          title: s.invoice,
          subtitle: `${s.partyName} — ${formatCurrency(s.totalAmount, settings.currency)}`,
          type: 'Sale',
          icon: ShoppingCart,
          href: '/sales',
        });
      }
    });

    // Parties
    parties.forEach((p) => {
      if (p.name.toLowerCase().includes(q) || p.phone?.toLowerCase().includes(q)) {
        results.push({
          id: `party-${p.id}`,
          title: p.name,
          subtitle: p.phone || 'No phone',
          type: 'Party',
          icon: FileText,
          href: '/party-ledger',
        });
      }
    });

    // Batches
    batches.forEach((b) => {
      if (b.id.toLowerCase().includes(q) || b.modelName.toLowerCase().includes(q)) {
        results.push({
          id: `batch-${b.id}`,
          title: b.id,
          subtitle: `${b.modelName} — ${b.originalQuantity} units`,
          type: 'Batch',
          icon: Package,
          href: '/production',
        });
      }
    });

    // Components / Parts
    components.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.supplier?.toLowerCase().includes(q)) {
        results.push({
          id: `comp-${c.id}`,
          title: c.name,
          subtitle: `Stock: ${c.available} — ${c.supplier || 'No supplier'}`,
          type: 'Part',
          icon: Package,
          href: '/parts-inventory',
        });
      }
    });

    // Repair Orders
    repairOrders.forEach((r) => {
      if (r.id.toLowerCase().includes(q) || r.imei?.toLowerCase().includes(q) || r.issue.toLowerCase().includes(q)) {
        results.push({
          id: `repair-${r.id}`,
          title: r.id,
          subtitle: `${r.imei || 'No IMEI'} — ${r.issue.slice(0, 40)}`,
          type: 'Repair',
          icon: Wrench,
          href: '/repair',
        });
      }
    });

    // Returns
    returns.forEach((r) => {
      if (r.id.toLowerCase().includes(q) || r.partyName.toLowerCase().includes(q)) {
        results.push({
          id: `return-${r.id}`,
          title: r.id,
          subtitle: `${r.partyName} — ${r.qcStatus || 'Pending QC'}`,
          type: 'Return',
          icon: RotateCcw,
          href: '/returns',
        });
      }
    });

    // Users
    users.forEach((u) => {
      if (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) {
        results.push({
          id: `user-${u.id}`,
          title: u.name,
          subtitle: `${u.email} — ${u.role.name}`,
          type: 'User',
          icon: Users,
          href: '/users',
        });
      }
    });

    return results.slice(0, 10);
  }, [searchQuery, imeis, sales, parties, batches, components, repairOrders, returns, users, settings.currency]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    router.push('/login');
  };

  // Generate real notifications from app data
  const allNotifications = useMemo(() => {
    const notifs: Array<{
      id: string;
      title: string;
      message: string;
      time: string;
      type: 'warning' | 'info' | 'success';
      category: keyof AppSettings['notifications'];
      href: string;
      senderId?: string;
    }> = [];

    // Low stock alerts (only if user has inventory permission)
    if (settings.notifications.lowStock && hasPermission(userPerms, 'inventory')) {
      components
        .filter((c) => c.available <= 10 && c.available > 0)
        .slice(0, 3)
        .forEach((c) => {
          notifs.push({
            id: `stock-${c.id}`,
            title: 'Low Stock Alert',
            message: `${c.name} — only ${c.available} remaining`,
            time: 'Just now',
            type: 'warning',
            category: 'lowStock',
            href: '/parts-inventory',
          });
        });
    }

    // Out of stock alerts (only if user has inventory permission)
    if (settings.notifications.outOfStock && hasPermission(userPerms, 'inventory')) {
      components
        .filter((c) => c.available === 0)
        .slice(0, 3)
        .forEach((c) => {
          notifs.push({
            id: `outstock-${c.id}`,
            title: 'Out of Stock',
            message: `${c.name} — zero inventory`,
            time: 'Just now',
            type: 'warning',
            category: 'outOfStock',
            href: '/parts-inventory',
          });
        });
    }

    // Pending returns needing QC (only if user has returns permission)
    if (settings.notifications.returns && hasPermission(userPerms, 'returns')) {
      returns
        .filter((r) => r.qcStatus === 'pending')
        .slice(0, 3)
        .forEach((r) => {
          notifs.push({
            id: `return-${r.id}`,
            title: 'Return Needs QC',
            message: `${r.id} from ${r.partyName} — ${r.reason}`,
            time: 'Pending',
            type: 'info',
            category: 'returns',
            href: '/returns',
          });
        });
    }

    // Recent payments (only if user has parties permission)
    if (settings.notifications.payments && hasPermission(userPerms, 'parties')) {
      payments
        .slice(-3)
        .reverse()
        .forEach((p) => {
          notifs.push({
            id: `payment-${p.id}`,
            title: 'Payment Received',
            message: `${formatCurrency(p.amount, settings.currency)} from ${p.partyName}`,
            time: new Date(p.date).toLocaleDateString(),
            type: 'success',
            category: 'payments',
            href: '/party-ledger',
          });
        });
    }

    // QC completed (only if user has returns permission)
    if (settings.notifications.qcCompletion && hasPermission(userPerms, 'returns')) {
      returns
        .filter((r) => r.qcStatus === 'good' || r.qcStatus === 'scrap')
        .slice(0, 2)
        .forEach((r) => {
          notifs.push({
            id: `qc-${r.id}`,
            title: `QC ${r.qcStatus === 'good' ? 'Passed' : 'Rejected'}`,
            message: `${r.id} — ${r.reason}`,
            time: 'Completed',
            type: r.qcStatus === 'good' ? 'success' : 'warning',
            category: 'qcCompletion',
            href: '/returns',
          });
        });
    }

    // New sales notifications (only if user has sales permission)
    if (settings.notifications.newSales && hasPermission(userPerms, 'sales')) {
      sales
        .slice(-3)
        .reverse()
        .forEach((s) => {
          notifs.push({
            id: `sale-${s.id}`,
            title: s.status === 'cancelled' ? 'Sale Cancelled' : 'New Sale',
            message: `${s.invoice} — ${formatCurrency(s.totalAmount, settings.currency)} from ${s.partyName}`,
            time: new Date(s.date).toLocaleDateString(),
            type: s.status === 'cancelled' ? 'warning' : 'success',
            category: 'newSales',
            href: '/sales',
          });
        });
    }

    // Repair orders notifications (only if user has repair permission)
    if (settings.notifications.repairOrders && hasPermission(userPerms, 'repair')) {
      repairOrders
        .filter((r) => r.status === 'pending' || r.status === 'completed' || r.status === 'failed')
        .slice(0, 3)
        .forEach((r) => {
          const statusLabel = r.status === 'pending' ? 'New Repair' : r.status === 'completed' ? 'Repair Completed' : 'Repair Failed';
          notifs.push({
            id: `repair-${r.id}`,
            title: statusLabel,
            message: `${r.imei} — ${r.issue}`,
            time: r.status === 'pending' ? 'Pending' : 'Completed',
            type: r.status === 'failed' ? 'warning' : r.status === 'completed' ? 'success' : 'info',
            category: 'repairOrders',
            href: '/repair',
          });
        });
    }

    // Batch status notifications (only if user has production permission)
    if (settings.notifications.batchStatus && hasPermission(userPerms, 'production')) {
      batches
        .filter((b) => b.status === 'completed')
        .slice(0, 2)
        .forEach((b) => {
          notifs.push({
            id: `batch-${b.id}`,
            title: 'Batch Completed',
            message: `${b.id} — ${b.modelName} (${b.produced} produced)`,
            time: 'Completed',
            type: 'success',
            category: 'batchStatus',
            href: '/production',
          });
        });
    }

    // Chat messages (available to all users)
    if (settings.notifications.messages) {
      Object.entries(chatUnreadCounts).forEach(([senderId, count]) => {
        if (count > 0) {
          const sender = users.find((u) => u.id === senderId);
          const senderName = sender?.name || 'Someone';
          const latestMsg = messages
            .filter((m) => m.senderId === senderId && !m.read)
            .slice(-1)[0];
          const preview = latestMsg ? latestMsg.content.substring(0, 40) + (latestMsg.content.length > 40 ? '...' : '') : `${count} unread message${count > 1 ? 's' : ''}`;
          notifs.push({
            id: `chat-${senderId}`,
            title: `Message from ${senderName}`,
            message: preview,
            time: latestMsg ? formatDistanceToNow(latestMsg.createdAt) : 'Just now',
            type: 'info',
            category: 'messages',
            href: '#chat',
            senderId,
          });
        }
      });
    }

    return notifs;
  }, [components, returns, payments, settings, currentUser?.id, chatUnreadCounts]);

  const notifications = allNotifications;

  const userInitial = currentUser?.name?.charAt(0) || 'A';
  const userName = currentUser?.name || 'Admin';
  const userEmail = currentUser?.email || 'admin@mobiis.com';
  const userRole = currentUser?.role?.name || 'Super Admin';

  return (
    <header className="h-16 bg-[#0d1321]/80 backdrop-blur-md border-b border-[#1e2a3a] flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-xl relative">
        <div
          className={cn(
            'relative flex items-center transition-transform duration-200',
            searchFocused && 'scale-[1.02]'
          )}
        >
          <Search
            size={16}
            className={cn(
              'absolute left-3 transition-colors duration-200 z-10',
              searchFocused ? 'text-[#c9a84c]' : 'text-[#64748b]'
            )}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search IMEI / Invoice / Party / Batch..."
            className="w-full bg-[#0f1525] border border-[#1e2a3a] rounded-lg pl-10 pr-8 py-2 text-sm text-[#f0f0f0] placeholder-[#64748b] input-field focus:border-[#c9a84c]/50 transition-colors"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[#64748b] hover:text-[#f0f0f0] hover:bg-[#1e2a3a] transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchFocused && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f1525] border border-[#1e2a3a] rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="px-3 py-2 border-b border-[#1e2a3a] flex items-center justify-between">
              <span className="text-xs text-[#64748b]">{searchResults.length} result{searchResults.length !== 1 && 's'} found</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {searchResults.map((result) => {
                const Icon = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => {
                      router.push(result.href);
                      setSearchQuery('');
                      setSearchFocused(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[rgba(201,168,76,0.06)] transition-colors text-left border-b border-[#1e2a3a]/30 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#0d1321] border border-[#1e2a3a] flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-[#c9a84c]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#f0f0f0] truncate">{result.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e2a3a] text-[#64748b] flex-shrink-0">{result.type}</span>
                      </div>
                      <p className="text-xs text-[#94a3b8] truncate">{result.subtitle}</p>
                    </div>
                    <ArrowRight size={12} className="text-[#64748b] flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchFocused && searchQuery.length >= 2 && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f1525] border border-[#1e2a3a] rounded-xl shadow-2xl overflow-hidden z-50 p-4 text-center">
            <p className="text-sm text-[#94a3b8]">No results found for <span className="text-[#f0f0f0] font-medium">"{searchQuery}"</span></p>
            <p className="text-xs text-[#64748b] mt-1">Try searching for IMEI, invoice, party name, batch ID, or part name</p>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Chat */}
        <button
          onClick={() => useChatStore.getState().toggleChat()}
          className="relative p-2 rounded-lg text-[#94a3b8] hover:text-[#c9a84c] hover:bg-[rgba(201,168,76,0.08)] transition-all duration-200"
        >
          <MessageCircle size={18} />
          {(() => {
            const totalUnread = Object.values(chatUnreadCounts).reduce((a, b) => a + b, 0);
            return totalUnread > 0 ? (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#ef4444] rounded-full text-white text-[10px] font-medium flex items-center justify-center">
                {totalUnread}
              </span>
            ) : null;
          })()}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            className="relative p-2 rounded-lg text-[#94a3b8] hover:text-[#c9a84c] hover:bg-[rgba(201,168,76,0.08)] transition-all duration-200"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#ef4444] rounded-full text-white text-[10px] font-medium flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-12 w-80 bg-[#0f1525] border border-[#1e2a3a] rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[#1e2a3a] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#f0f0f0]">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      useChatStore.getState().markAllAsRead(currentUser?.id || '');
                      setNotificationsOpen(false);
                    }}
                    className="text-xs text-[#c9a84c] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <Bell size={24} className="mx-auto text-[#1e2a3a] mb-2" />
                    <p className="text-sm text-[#94a3b8]">No notifications</p>
                  </div>
                )}
                {notifications.map((n: any) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.category === 'messages' && n.senderId) {
                        useChatStore.getState().openChatWithUser(n.senderId);
                      } else if (n.href && n.href !== '#') {
                        router.push(n.href);
                      }
                      setNotificationsOpen(false);
                    }}
                    className="px-4 py-3 border-b border-[#1e2a3a]/50 hover:bg-[rgba(201,168,76,0.04)] cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                          n.type === 'warning' && 'bg-[#f59e0b]',
                          n.type === 'success' && 'bg-[#22c55e]',
                          n.type === 'info' && 'bg-[#3b82f6]'
                        )}
                      />
                      <div>
                        <p className="text-sm text-[#f0f0f0] font-medium">{n.title}</p>
                        <p className="text-xs text-[#94a3b8] mt-0.5">{n.message}</p>
                        <p className="text-xs text-[#64748b] mt-1">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[rgba(201,168,76,0.08)] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#a88a3a] flex items-center justify-center">
              <span className="text-[#0a0e1a] font-semibold text-xs">{userInitial}</span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-[#f0f0f0]">{userName}</p>
              <p className="text-xs text-[#64748b]">{userRole}</p>
            </div>
            <ChevronDown
              size={14}
              className={cn(
                'text-[#64748b] transition-transform duration-150',
                profileOpen && 'rotate-180'
              )}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-56 bg-[#0f1525] border border-[#1e2a3a] rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[#1e2a3a]">
                <p className="text-sm font-semibold text-[#f0f0f0]">{userName}</p>
                <p className="text-xs text-[#94a3b8]">{userEmail}</p>
              </div>
              <div className="py-1">
                {[
                  { icon: User, label: 'Profile' },
                  { icon: Settings, label: 'Settings' },
                  { icon: HelpCircle, label: 'Help & Support' },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#94a3b8] hover:text-[#c9a84c] hover:bg-[rgba(201,168,76,0.08)] transition-colors"
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="border-t border-[#1e2a3a] py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
