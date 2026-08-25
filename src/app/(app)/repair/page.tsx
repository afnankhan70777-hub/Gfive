'use client';

import { useState } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Smartphone,
  User,
  Calendar,
  X,
  ChevronRight,
  ArrowLeft,
  Trash2,
  Save,
  RotateCcw,
  Package,
} from 'lucide-react';
import { useDataStore, useAuthStore } from '@/lib/store';
import { cn, canDoAction } from '@/lib/utils';
import * as supabaseData from '@/lib/supabase-data';

export default function RepairPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const perms = currentUser?.role?.permissions || [];
  const canCreate = canDoAction(perms, 'repair', 'create');
  const canEdit = canDoAction(perms, 'repair', 'edit');
  const canDelete = canDoAction(perms, 'repair', 'delete');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [viewMode, setViewMode] = useState<'individual' | 'batch'>('individual');

  // New repair form state
  const [newImei, setNewImei] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newIssue, setNewIssue] = useState('');
  const [newTechnician, setNewTechnician] = useState('');
  const [newCost, setNewCost] = useState(0);
  const [newNotes, setNewNotes] = useState('');

  // Complete repair form state
  const [completeCost, setCompleteCost] = useState(0);
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeOutcome, setCompleteOutcome] = useState<'completed' | 'failed'>('completed');

  const repairOrders = useDataStore((state) => state.repairOrders);
  const imeis = useDataStore((state) => state.imeis);
  const addRepairOrder = useDataStore((state) => state.addRepairOrder);
  const updateRepairOrder = useDataStore((state) => state.updateRepairOrder);
  const deleteRepairOrder = useDataStore((state) => state.deleteRepairOrder);
  const addIMEI = useDataStore((state) => state.addIMEI);
  const updateIMEI = useDataStore((state) => state.updateIMEI);
  const addIMEIHistory = useDataStore((state) => state.addIMEIHistory);

  const filteredOrders = repairOrders.filter((order) => {
    const matchesSearch =
      order.imei.includes(searchQuery) ||
      order.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.issue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ['all', 'pending', 'in-progress', 'completed', 'failed'];

  const pendingCount = repairOrders.filter((o) => o.status === 'pending').length;
  const inProgressCount = repairOrders.filter((o) => o.status === 'in-progress').length;
  const completedCount = repairOrders.filter((o) => o.status === 'completed').length;
  const failedCount = repairOrders.filter((o) => o.status === 'failed').length;

  const handleCreateRepair = async () => {
    if (!newImei.trim() || !newModel.trim() || !newIssue.trim()) return;

    const today = new Date().toISOString().split('T')[0];

    // Check if IMEI exists, if not create it
    const existingIMEI = imeis.find((i) => i.imei === newImei.trim());
    if (!existingIMEI) {
      const imeiPayload = {
        imei: newImei.trim(),
        model: newModel,
        modelId: newModel,
        batch: '',
        batchId: '',
        status: 'repair' as const,
        location: 'Repair Center',
      };
      try {
        const newIMEIRecord = await supabaseData.addIMEI(imeiPayload);
        addIMEI(newIMEIRecord);
      } catch (e) { console.error('Supabase addIMEI failed:', e); addIMEI(imeiPayload); }
    } else {
      updateIMEI(existingIMEI.id, {
        status: 'repair',
        location: 'Repair Center',
      });
      try { await supabaseData.updateIMEI(existingIMEI.id, { status: 'repair', location: 'Repair Center' }); } catch (e) { console.error('Supabase updateIMEI failed:', e); }
      addIMEIHistory(existingIMEI.id, {
        event: 'Sent to Repair',
        date: today,
        location: 'Repair Center',
        notes: newIssue,
      });
    }

    const repairPayload = {
      imei: newImei.trim(),
      model: newModel,
      issue: newIssue,
      technician: newTechnician || 'Unassigned',
      startDate: today,
      status: 'pending' as const,
      cost: newCost,
      notes: newNotes,
    };
    try {
      const newRepair = await supabaseData.addRepairOrder(repairPayload);
      addRepairOrder(newRepair);
    } catch (e) { console.error('Supabase addRepairOrder failed:', e); addRepairOrder(repairPayload); }

    setNewImei('');
    setNewModel('');
    setNewIssue('');
    setNewTechnician('');
    setNewCost(0);
    setNewNotes('');
    setShowNewForm(false);
  };

  const handleStartRepair = async (orderId: string) => {
    updateRepairOrder(orderId, { status: 'in-progress' });
    try { await supabaseData.updateRepairOrder(orderId, { status: 'in-progress' }); } catch (e) { console.error('Supabase updateRepairOrder failed:', e); }
  };

  const handleCompleteRepair = async () => {
    if (!selectedOrder) return;
    const today = new Date().toISOString().split('T')[0];

    updateRepairOrder(selectedOrder.id, {
      status: completeOutcome,
      completionDate: today,
      cost: completeCost,
      notes: completeNotes || selectedOrder.notes,
    });
    try { await supabaseData.updateRepairOrder(selectedOrder.id, { status: completeOutcome, completionDate: today, cost: completeCost, notes: completeNotes || selectedOrder.notes }); } catch (e) { console.error('Supabase updateRepairOrder failed:', e); }

    setShowCompleteForm(false);
    setSelectedOrder(null);
    setCompleteCost(0);
    setCompleteNotes('');
    setCompleteOutcome('completed');
  };

  const handleDeleteRepair = async (orderId: string) => {
    if (confirm('Delete this repair order?')) {
      deleteRepairOrder(orderId);
      try { await supabaseData.deleteRepairOrder(orderId); } catch (e) { console.error('Supabase deleteRepairOrder failed:', e); }
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: any; class: string }> = {
      completed: { icon: CheckCircle2, class: 'badge-success' },
      'in-progress': { icon: Wrench, class: 'badge-info' },
      pending: { icon: Clock, class: 'badge-warning' },
      failed: { icon: AlertCircle, class: 'badge-danger' },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', config.class)}>
        <Icon size={10} />
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f0f0]">Repair Management</h1>
            <p className="text-sm text-[#94a3b8] mt-1">Middle step — fix units flagged by QC and update their status</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowNewForm(true)}
              className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <Plus size={16} />
              New Repair
            </button>
          )}
        </div>
      
      {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-[#f59e0b]', bg: 'bg-[rgba(245,158,11,0.1)]' },
            { label: 'In Progress', value: inProgressCount, icon: Wrench, color: 'text-[#3b82f6]', bg: 'bg-[rgba(59,130,246,0.1)]' },
            { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'text-[#22c55e]', bg: 'bg-[rgba(34,197,94,0.1)]' },
            { label: 'Failed', value: failedCount, icon: AlertCircle, color: 'text-[#ef4444]', bg: 'bg-[rgba(239,68,68,0.1)]' },
          ].map((stat) => (
            <div key={stat.label} className="stat-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold tracking-wider text-[#64748b] uppercase">{stat.label}</span>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', stat.bg)}>
                  <stat.icon size={16} className={stat.color} />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#f0f0f0]">{stat.value}</div>
            </div>
          ))}
        </div>
      
      {/* View Mode Toggle + Filters */}
              <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-2">
            <button
              onClick={() => setViewMode('individual')}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', viewMode === 'individual' ? 'bg-[rgba(201,168,76,0.15)] text-[#c9a84c]' : 'text-[#94a3b8] hover:text-[#f0f0f0]')}
            >
              Individual Repairs
            </button>
            <button
              onClick={() => setViewMode('batch')}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', viewMode === 'batch' ? 'bg-[rgba(201,168,76,0.15)] text-[#c9a84c]' : 'text-[#94a3b8] hover:text-[#f0f0f0]')}
            >
              Batch Repairs
            </button>
          </div>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              placeholder={viewMode === 'individual' ? "Search by IMEI, model, or issue..." : "Search by batch or model..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f1525] border border-[#1e2a3a] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#f0f0f0] placeholder-[#64748b] input-field"
            />
          </div>
          {viewMode === 'individual' && (
            <div className="flex items-center gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    statusFilter === status
                      ? 'bg-[rgba(201,168,76,0.15)] text-[#c9a84c] border border-[rgba(201,168,76,0.2)]'
                      : 'bg-[#0f1525] text-[#94a3b8] border border-[#1e2a3a]'
                  )}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      
      {viewMode === 'individual' ? (
        <>
          {/* Repair Orders Table */}
              <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2a3a]">
                  {['IMEI', 'Model', 'Issue', 'Technician', 'Start Date', 'Status', 'Actions'].map((header) => (
                    <th key={header} className="text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider px-4 py-3">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#64748b]">
                      No repair orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-[#1e2a3a]/50 table-row-hover">
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-[#c9a84c]">{order.imei}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#f0f0f0]">{order.model}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#94a3b8] line-clamp-1">{order.issue}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User size={12} className="text-[#64748b]" />
                          <span className="text-sm text-[#94a3b8]">{order.technician}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-[#64748b]" />
                          <span className="text-sm text-[#94a3b8]">{order.startDate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleStartRepair(order.id)}
                              className="p-1.5 rounded-lg bg-[rgba(59,130,246,0.1)] text-[#3b82f6] hover:bg-[rgba(59,130,246,0.2)] transition-colors"
                              title="Start Repair"
                            >
                              <Wrench size={14} />
                            </button>
                          )}
                          {order.status === 'in-progress' && (
                            <button
                              onClick={() => { setSelectedOrder(order); setShowCompleteForm(true); }}
                              className="p-1.5 rounded-lg bg-[rgba(34,197,94,0.1)] text-[#22c55e] hover:bg-[rgba(34,197,94,0.2)] transition-colors"
                              title="Complete / Fail"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg bg-[rgba(201,168,76,0.1)] text-[#c9a84c] hover:bg-[rgba(201,168,76,0.2)] transition-colors"
                            title="View Details"
                          >
                            <ChevronRight size={14} />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteRepair(order.id)}
                              className="p-1.5 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.2)] transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
              </>
      ) : (
        <>
          {/* Batch Repairs Table */}
                      <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e2a3a]">
                      {['Batch', 'Model', 'Sent to Repair', 'Pending', 'In Progress', 'Fixed', 'Scrapped'].map((header) => (
                        <th key={header} className="text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider px-4 py-3">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Group repair orders by batch
                      const batchMap = new Map<string, { batchName: string; model: string; total: number; pending: number; inProgress: number; completed: number; failed: number }>();
                      repairOrders.forEach((order) => {
                        const imeiRec = imeis.find((i) => i.imei === order.imei);
                        const batchId = imeiRec?.batchId || 'UNKNOWN';
                        const batchName = imeiRec?.batch || 'Unknown Batch';
                        const model = order.model;
                        const key = `${batchId}-${model}`;
                        if (!batchMap.has(key)) {
                          batchMap.set(key, { batchName, model, total: 0, pending: 0, inProgress: 0, completed: 0, failed: 0 });
                        }
                        const entry = batchMap.get(key)!;
                        entry.total++;
                        if (order.status === 'pending') entry.pending++;
                        else if (order.status === 'in-progress') entry.inProgress++;
                        else if (order.status === 'completed') entry.completed++;
                        else if (order.status === 'failed') entry.failed++;
                      });
                      const batchData = Array.from(batchMap.values()).filter((b) =>
                        b.batchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        b.model.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                      if (batchData.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#64748b]">
                              No batch repair data found
                            </td>
                          </tr>
                        );
                      }
                      return batchData.map((batch) => (
                        <tr key={`${batch.batchName}-${batch.model}`} className="border-b border-[#1e2a3a]/50 table-row-hover">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-[#f0f0f0]">{batch.batchName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-[#94a3b8]">{batch.model}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-mono text-[#c9a84c]">{batch.total}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-[#f59e0b]">{batch.pending}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-[#3b82f6]">{batch.inProgress}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-[#22c55e]">{batch.completed}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-[#ef4444]">{batch.failed}</span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
                  </>
      )}

      {/* New Repair Modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#1e2a3a]">
              <h3 className="text-sm font-semibold text-[#f0f0f0]">New Repair Order</h3>
              <button onClick={() => setShowNewForm(false)} className="text-[#64748b] hover:text-[#f0f0f0]">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">IMEI Number</label>
                <input
                  type="text"
                  value={newImei}
                  onChange={(e) => setNewImei(e.target.value)}
                  placeholder="Enter IMEI..."
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Model</label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro"
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                />
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Issue / Problem</label>
                <textarea
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={3}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Technician</label>
                  <input
                    type="text"
                    value={newTechnician}
                    onChange={(e) => setNewTechnician(e.target.value)}
                    placeholder="Technician name"
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Estimated Cost</label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[#1e2a3a]">
              <button onClick={() => setShowNewForm(false)} className="btn-outline btn-press px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={handleCreateRepair} className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Save size={14} />
                Create Repair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Repair Modal */}
      {showCompleteForm && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-[#1e2a3a]">
              <h3 className="text-sm font-semibold text-[#f0f0f0]">Complete Repair</h3>
              <button onClick={() => setShowCompleteForm(false)} className="text-[#64748b] hover:text-[#f0f0f0]">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-[#0d1321] border border-[#1e2a3a] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone size={12} className="text-[#c9a84c]" />
                  <span className="text-xs text-[#64748b]">IMEI</span>
                </div>
                <span className="text-sm font-mono text-[#c9a84c]">{selectedOrder.imei}</span>
              </div>

              <div>
                <label className="block text-xs text-[#94a3b8] mb-2">Outcome</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCompleteOutcome('completed')}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all',
                      completeOutcome === 'completed'
                        ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.3)]'
                        : 'bg-[#0d1321] border-[#1e2a3a] hover:border-[#2a3a50]'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 size={16} className="text-[#22c55e]" />
                      <span className="text-sm font-medium text-[#22c55e]">Completed</span>
                    </div>
                    <p className="text-xs text-[#94a3b8]">Return to sellable inventory</p>
                  </button>
                  <button
                    onClick={() => setCompleteOutcome('failed')}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all',
                      completeOutcome === 'failed'
                        ? 'bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)]'
                        : 'bg-[#0d1321] border-[#1e2a3a] hover:border-[#2a3a50]'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle size={16} className="text-[#ef4444]" />
                      <span className="text-sm font-medium text-[#ef4444]">Failed</span>
                    </div>
                    <p className="text-xs text-[#94a3b8]">Move to scrap inventory</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Actual Cost</label>
                <input
                  type="number"
                  value={completeCost}
                  onChange={(e) => setCompleteCost(Number(e.target.value))}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                />
              </div>

              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Completion Notes</label>
                <textarea
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="What was done / why it failed..."
                  rows={3}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[#1e2a3a]">
              <button onClick={() => setShowCompleteForm(false)} className="btn-outline btn-press px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={handleCompleteRepair} className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Save size={14} />
                Save Outcome
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selectedOrder && !showCompleteForm && (
        <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[480px] bg-[#0f1525] border-l border-[#1e2a3a] shadow-2xl overflow-y-auto">
          <div className="sticky top-0 bg-[#0f1525]/95 backdrop-blur-sm border-b border-[#1e2a3a] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-lg hover:bg-[#1e2a3a] text-[#94a3b8]">
                <ArrowLeft size={16} />
              </button>
              <h3 className="text-sm font-semibold text-[#f0f0f0]">Repair Details</h3>
            </div>
            <button onClick={() => setSelectedOrder(null)} className="text-[#64748b] hover:text-[#f0f0f0]">
              <X size={18} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* IMEI & Model */}
            <div className="bg-gradient-to-br from-[#0d1321] to-[#0a0e1a] border border-[#1e2a3a] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[rgba(201,168,76,0.1)] flex items-center justify-center">
                  <Smartphone size={20} className="text-[#c9a84c]" />
                </div>
                <div>
                  <p className="text-xs text-[#64748b]">IMEI</p>
                  <p className="text-sm font-mono text-[#c9a84c]">{selectedOrder.imei}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[#64748b]">Model</p>
                  <p className="text-sm text-[#f0f0f0]">{selectedOrder.model}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748b]">Status</p>
                  <div className="mt-0.5">{getStatusBadge(selectedOrder.status)}</div>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0d1321] border border-[#1e2a3a] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <User size={12} className="text-[#64748b]" />
                  <span className="text-xs text-[#64748b]">Technician</span>
                </div>
                <p className="text-sm text-[#f0f0f0]">{selectedOrder.technician}</p>
              </div>
              <div className="bg-[#0d1321] border border-[#1e2a3a] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={12} className="text-[#64748b]" />
                  <span className="text-xs text-[#64748b]">Start Date</span>
                </div>
                <p className="text-sm text-[#f0f0f0]">{selectedOrder.startDate}</p>
              </div>
              {selectedOrder.completionDate && (
                <div className="bg-[#0d1321] border border-[#1e2a3a] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={12} className="text-[#64748b]" />
                    <span className="text-xs text-[#64748b]">Completion Date</span>
                  </div>
                  <p className="text-sm text-[#f0f0f0]">{selectedOrder.completionDate}</p>
                </div>
              )}
              <div className="bg-[#0d1321] border border-[#1e2a3a] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Package size={12} className="text-[#64748b]" />
                  <span className="text-xs text-[#64748b]">Cost</span>
                </div>
                <p className="text-sm text-[#f0f0f0]">Rs. {selectedOrder.cost.toLocaleString()}</p>
              </div>
            </div>

            {/* Issue */}
            <div className="bg-[#0d1321] border border-[#1e2a3a] rounded-lg p-4">
              <p className="text-xs text-[#64748b] mb-1">Issue</p>
              <p className="text-sm text-[#f0f0f0]">{selectedOrder.issue}</p>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="bg-[#0d1321] border border-[#1e2a3a] rounded-lg p-4">
                <p className="text-xs text-[#64748b] mb-1">Notes</p>
                <p className="text-sm text-[#94a3b8]">{selectedOrder.notes}</p>
              </div>
            )}

            {/* IMEI History */}
            {(() => {
              const imeiRecord = imeis.find((i) => i.imei === selectedOrder.imei);
              if (!imeiRecord || imeiRecord.history.length <= 1) return null;
              return (
                <div>
                  <p className="text-xs text-[#64748b] mb-2">IMEI History</p>
                  <div className="space-y-2">
                    {imeiRecord.history.slice().reverse().map((evt: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 bg-[#0d1321] border border-[#1e2a3a] rounded-lg p-3">
                        <div className="w-2 h-2 rounded-full bg-[#c9a84c] mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm text-[#f0f0f0]">{evt.event}</p>
                          <p className="text-xs text-[#64748b]">{evt.date} · {evt.location}</p>
                          {evt.notes && <p className="text-xs text-[#94a3b8] mt-1">{evt.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => handleStartRepair(selectedOrder.id)}
                  className="flex-1 btn-primary btn-press px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Wrench size={14} />
                  Start Repair
                </button>
              )}
              {selectedOrder.status === 'in-progress' && (
                <button
                  onClick={() => setShowCompleteForm(true)}
                  className="flex-1 btn-primary btn-press px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={14} />
                  Complete / Fail
                </button>
              )}
              {selectedOrder.status === 'completed' && (
                <div className="flex-1 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] rounded-lg px-4 py-2.5 text-sm text-[#22c55e] flex items-center justify-center gap-2">
                  <RotateCcw size={14} />
                  Returned to Sellable Inventory
                </div>
              )}
              {selectedOrder.status === 'failed' && (
                <div className="flex-1 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg px-4 py-2.5 text-sm text-[#ef4444] flex items-center justify-center gap-2">
                  <Trash2 size={14} />
                  Moved to Scrap
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
