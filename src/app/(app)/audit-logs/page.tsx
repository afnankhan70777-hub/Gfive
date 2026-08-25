'use client';

import { useState, useMemo } from 'react';
import {
  Shield,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { useDataStore, useAuthStore } from '@/lib/store';
import { cn, hasPermission } from '@/lib/utils';
import type { AuditLog } from '@/lib/types';

const actionConfig: Record<string, { label: string; color: string; icon: any }> = {
  create: { label: 'Created', color: '#22c55e', icon: CheckCircle2 },
  update: { label: 'Updated', color: '#3b82f6', icon: Activity },
  delete: { label: 'Deleted', color: '#ef4444', icon: Trash2 },
  login: { label: 'Login', color: '#22c55e', icon: User },
  logout: { label: 'Logout', color: '#94a3b8', icon: User },
  export: { label: 'Exported', color: '#f59e0b', icon: Download },
  import: { label: 'Imported', color: '#8b5cf6', icon: FileText },
  backup: { label: 'Backup', color: '#06b6d4', icon: Shield },
  clear: { label: 'Cleared', color: '#ef4444', icon: AlertTriangle },
  settings: { label: 'Settings', color: '#64748b', icon: Activity },
  other: { label: 'Other', color: '#94a3b8', icon: Activity },
};

export default function AuditLogsPage() {
  const auditLogs = useDataStore((s) => s.auditLogs);
  const currentUser = useAuthStore((s) => s.currentUser);
  const addAuditLog = useDataStore((s) => s.addAuditLog);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<'timestamp' | 'userName' | 'action' | 'entity'>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const pageSize = 25;

  // Get unique values for filters
  const uniqueUsers = useMemo(() => [...new Set(auditLogs.map((l) => l.userName))], [auditLogs]);
  const uniqueEntities = useMemo(() => [...new Set(auditLogs.map((l) => l.entity))], [auditLogs]);

  // Filtered logs
  const filtered = useMemo(() => {
    let logs = [...auditLogs];

    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.entity.toLowerCase().includes(q) ||
          l.entityName?.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q)
      );
    }

    if (actionFilter !== 'all') logs = logs.filter((l) => l.action === actionFilter);
    if (entityFilter !== 'all') logs = logs.filter((l) => l.entity === entityFilter);
    if (userFilter !== 'all') logs = logs.filter((l) => l.userName === userFilter);
    if (dateFrom) logs = logs.filter((l) => l.timestamp >= new Date(dateFrom).toISOString());
    if (dateTo) logs = logs.filter((l) => l.timestamp <= new Date(dateTo + 'T23:59:59').toISOString());

    logs.sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : aVal > bVal ? -1 : 1;
    });

    return logs;
  }, [auditLogs, search, actionFilter, entityFilter, userFilter, dateFrom, dateTo, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Stats
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = auditLogs.filter((l) => l.timestamp.startsWith(today));
  const stats = {
    total: auditLogs.length,
    today: todayLogs.length,
    create: auditLogs.filter((l) => l.action === 'create').length,
    delete: auditLogs.filter((l) => l.action === 'delete').length,
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Entity Name', 'Details', 'IP'];
    const rows = filtered.map((l) => [
      new Date(l.timestamp).toLocaleString(),
      l.userName,
      l.action,
      l.entity,
      l.entityName || '',
      l.details || '',
      l.ip || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    addAuditLog({
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System',
      action: 'export',
      entity: 'audit-logs',
      details: `Exported ${filtered.length} audit log records to CSV`,
    });
  };

  const clearFilters = () => {
    setSearch('');
    setActionFilter('all');
    setEntityFilter('all');
    setUserFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const activeFilterCount = [actionFilter, entityFilter, userFilter, dateFrom, dateTo].filter((v) => v && v !== 'all').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f0]">Audit Logs</h1>
          <p className="text-sm text-[#94a3b8] mt-1">Track all system activities and changes</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-lg text-sm flex items-center gap-2 bg-[#1e2a3a] hover:bg-[#2a3a4f] text-[#f0f0f0] transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Logs', value: stats.total, icon: FileText, color: '#3b82f6' },
          { label: 'Today', value: stats.today, icon: Calendar, color: '#22c55e' },
          { label: 'Created', value: stats.create, icon: CheckCircle2, color: '#22c55e' },
          { label: 'Deleted', value: stats.delete, icon: Trash2, color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-lg bg-[#0d1321] border border-[#1e2a3a]">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={16} style={{ color: s.color }} />
              <span className="text-sm text-[#94a3b8]">{s.label}</span>
            </div>
            <span className="text-2xl font-bold text-[#f0f0f0]">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search by user, entity, action, or details..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#f0f0f0] placeholder-[#64748b]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors border',
              showFilters || activeFilterCount > 0
                ? 'bg-[rgba(201,168,76,0.15)] border-[rgba(201,168,76,0.3)] text-[#c9a84c]'
                : 'bg-[#0d1321] border-[#1e2a3a] text-[#94a3b8] hover:text-[#f0f0f0]'
            )}
          >
            <Filter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-[#c9a84c] text-[#0a0e17] text-xs font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-[#94a3b8] hover:text-[#ef4444] transition-colors">
              <X size={16} />
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid md:grid-cols-4 gap-3 p-4 rounded-lg bg-[#0d1321] border border-[#1e2a3a]">
            <div>
              <label className="block text-xs text-[#64748b] mb-1.5">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="w-full bg-[#0a0e17] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0]"
              >
                <option value="all">All Actions</option>
                {Object.entries(actionConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1.5">Entity</label>
              <select
                value={entityFilter}
                onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
                className="w-full bg-[#0a0e17] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0]"
              >
                <option value="all">All Entities</option>
                {uniqueEntities.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1.5">User</label>
              <select
                value={userFilter}
                onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
                className="w-full bg-[#0a0e17] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0]"
              >
                <option value="all">All Users</option>
                {uniqueUsers.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-[#64748b] mb-1.5">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="w-full bg-[#0a0e17] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#64748b] mb-1.5">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="w-full bg-[#0a0e17] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg bg-[#0d1321] border border-[#1e2a3a] overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-12 text-center">
            <Shield size={48} className="mx-auto mb-4 text-[#1e2a3a]" />
            <p className="text-[#94a3b8] text-sm">No audit logs found</p>
            <p className="text-[#64748b] text-xs mt-1">Logs will appear here when users perform actions</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2a3a]">
                    {[
                      { key: 'timestamp' as const, label: 'Timestamp' },
                      { key: 'userName' as const, label: 'User' },
                      { key: 'action' as const, label: 'Action' },
                      { key: 'entity' as const, label: 'Entity' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => {
                          if (sortField === col.key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                          else { setSortField(col.key); setSortDir('desc'); }
                        }}
                        className="text-left px-4 py-3 text-[#94a3b8] font-medium cursor-pointer hover:text-[#f0f0f0] select-none"
                      >
                        <span className="flex items-center gap-1">
                          {col.label}
                          {sortField === col.key && <ArrowUpDown size={12} />}
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-[#94a3b8] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((log) => {
                    const cfg = actionConfig[log.action] || actionConfig.other;
                    const Icon = cfg.icon;
                    return (
                      <tr
                        key={log.id}
                        className="border-b border-[#1e2a3a]/50 hover:bg-[rgba(201,168,76,0.04)] transition-colors"
                      >
                        <td className="px-4 py-3 text-[#94a3b8] whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock size={12} />
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#f0f0f0]">{log.userName}</td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                            style={{ background: `${cfg.color}18`, color: cfg.color }}
                          >
                            <Icon size={12} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#94a3b8]">
                          <span className="capitalize">{log.entity}</span>
                          {log.entityName && (
                            <span className="text-[#64748b] ml-1">({log.entityName})</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#94a3b8] max-w-xs truncate">{log.details || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded-md text-[#64748b] hover:text-[#c9a84c] hover:bg-[rgba(201,168,76,0.1)] transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e2a3a]">
              <span className="text-xs text-[#64748b]">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#f0f0f0] hover:bg-[#1e2a3a] disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-[#94a3b8]">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#f0f0f0] hover:bg-[#1e2a3a] disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-[#0d1321] border border-[#1e2a3a] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#f0f0f0]">Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-md text-[#64748b] hover:text-[#f0f0f0] hover:bg-[#1e2a3a] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'ID', value: selectedLog.id },
                { label: 'Timestamp', value: new Date(selectedLog.timestamp).toLocaleString() },
                { label: 'User', value: selectedLog.userName },
                { label: 'User ID', value: selectedLog.userId },
                { label: 'Action', value: actionConfig[selectedLog.action]?.label || selectedLog.action },
                { label: 'Entity', value: selectedLog.entity },
                { label: 'Entity ID', value: selectedLog.entityId || '-' },
                { label: 'Entity Name', value: selectedLog.entityName || '-' },
                { label: 'Details', value: selectedLog.details || '-' },
                { label: 'IP Address', value: selectedLog.ip || '-' },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-3">
                  <span className="text-xs text-[#64748b] w-24 shrink-0">{row.label}</span>
                  <span className="text-sm text-[#f0f0f0] break-all">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
