'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  X,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Trash2,
  Package,
  Truck,
  RotateCcw,
  Save,
  ArrowRight,
} from 'lucide-react';
import { useDataStore, useAuthStore } from '@/lib/store';
import { IMEI } from '@/lib/types';
import { cn, canDoAction } from '@/lib/utils';
import * as supabaseData from '@/lib/supabase-data';

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  produced: { color: 'text-[#3b82f6]', bg: 'bg-[rgba(59,130,246,0.1)]', icon: Package, label: 'Produced' },
  packed: { color: 'text-[#8b5cf6]', bg: 'bg-[rgba(139,92,246,0.1)]', icon: Package, label: 'Packed' },
  sold: { color: 'text-[#22c55e]', bg: 'bg-[rgba(34,197,94,0.1)]', icon: Truck, label: 'Sold' },
  returned: { color: 'text-[#f59e0b]', bg: 'bg-[rgba(245,158,11,0.1)]', icon: RotateCcw, label: 'Returned' },
  qc: { color: 'text-[#3b82f6]', bg: 'bg-[rgba(59,130,246,0.1)]', icon: AlertCircle, label: 'QC' },
  repair: { color: 'text-[#f59e0b]', bg: 'bg-[rgba(245,158,11,0.1)]', icon: Wrench, label: 'Repair' },
  scrap: { color: 'text-[#ef4444]', bg: 'bg-[rgba(239,68,68,0.1)]', icon: Trash2, label: 'Scrap' },
  sellable: { color: 'text-[#22c55e]', bg: 'bg-[rgba(34,197,94,0.1)]', icon: CheckCircle2, label: 'Sellable' },
  'in-transit': { color: 'text-[#3b82f6]', bg: 'bg-[rgba(59,130,246,0.1)]', icon: Truck, label: 'In Transit' },
  warehouse: { color: 'text-[#64748b]', bg: 'bg-[rgba(100,116,139,0.1)]', icon: Package, label: 'Warehouse' },
};

const actionButtons = [
  { status: 'repair' as const, label: 'Send to Repair', icon: Wrench, color: 'text-[#f59e0b]', bg: 'bg-[rgba(245,158,11,0.1)]', border: 'border-[rgba(245,158,11,0.2)]' },
  { status: 'scrap' as const, label: 'Mark as Scrap', icon: Trash2, color: 'text-[#ef4444]', bg: 'bg-[rgba(239,68,68,0.1)]', border: 'border-[rgba(239,68,68,0.2)]' },
  { status: 'sellable' as const, label: 'Move to Sellable', icon: CheckCircle2, color: 'text-[#22c55e]', bg: 'bg-[rgba(34,197,94,0.1)]', border: 'border-[rgba(34,197,94,0.2)]' },
  { status: 'warehouse' as const, label: 'To Warehouse', icon: Package, color: 'text-[#64748b]', bg: 'bg-[rgba(100,116,139,0.1)]', border: 'border-[rgba(100,116,139,0.2)]' },
];

function IMETimelinePanel({ imei, onClose }: { imei: IMEI; onClose: () => void }) {
  const eventIcons: Record<string, React.ElementType> = {
    'Produced': Package,
    'Packed': Package,
    'Sold': Truck,
    'Returned': RotateCcw,
    'QC Inspection': AlertCircle,
    'Repair': Wrench,
    'Scrapped': Trash2,
    'Moved to Sellable': CheckCircle2,
    'Moved to Warehouse': Package,
  };

  const updateIMEI = useDataStore((state) => state.updateIMEI);
  const addIMEIHistory = useDataStore((state) => state.addIMEIHistory);
  const addRepairOrder = useDataStore((state) => state.addRepairOrder);
  const [note, setNote] = useState('');

  // Repair intake modal state
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairIssue, setRepairIssue] = useState('');
  const [repairTechnician, setRepairTechnician] = useState('');
  const [repairCost, setRepairCost] = useState(0);
  const [repairNotes, setRepairNotes] = useState('');
  const [repairError, setRepairError] = useState('');

  const handleAction = async (newStatus: 'repair' | 'scrap' | 'sellable' | 'warehouse') => {
    if (newStatus === 'repair') {
      // Show repair intake modal instead of immediate update
      setShowRepairModal(true);
      setRepairIssue('');
      setRepairTechnician('');
      setRepairCost(0);
      setRepairNotes('');
      setRepairError('');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const location = newStatus === 'warehouse' ? 'Warehouse' : newStatus === 'scrap' ? 'Scrap Yard' : 'Sales Floor';
    updateIMEI(imei.id, { status: newStatus, location });
    try { await supabaseData.updateIMEI(imei.id, { status: newStatus, location }); } catch (e) { console.error('Supabase updateIMEI failed:', e); }

    const eventName = newStatus === 'scrap' ? 'Scrapped' : newStatus === 'sellable' ? 'Moved to Sellable' : 'Moved to Warehouse';
    addIMEIHistory(imei.id, {
      event: eventName,
      date: today,
      location,
      notes: note || `Status changed to ${newStatus}`,
    });
    setNote('');
  };

  const handleRepairSubmit = async () => {
    if (!repairIssue.trim()) { setRepairError('Issue / Problem is required'); return; }
    if (!repairTechnician.trim()) { setRepairError('Technician is required'); return; }

    const today = new Date().toISOString().split('T')[0];

    updateIMEI(imei.id, { status: 'repair', location: 'Repair Dept' });
    try { await supabaseData.updateIMEI(imei.id, { status: 'repair', location: 'Repair Dept' }); } catch (e) { console.error('Supabase updateIMEI failed:', e); }

    addIMEIHistory(imei.id, {
      event: 'Repair',
      date: today,
      location: 'Repair Dept',
      notes: repairNotes || `Sent to repair: ${repairIssue}`,
    });

    const repairPayload = {
      imei: imei.imei,
      model: imei.model,
      issue: repairIssue,
      technician: repairTechnician,
      startDate: today,
      status: 'pending' as const,
      cost: repairCost,
      notes: repairNotes || `From IMEI Management. Batch: ${imei.batch}`,
    };
    try {
      const newRepair = await supabaseData.addRepairOrder(repairPayload);
      addRepairOrder(newRepair);
    } catch (e) { console.error('Supabase addRepairOrder failed:', e); addRepairOrder(repairPayload); }

    setShowRepairModal(false);
    setRepairIssue('');
    setRepairTechnician('');
    setRepairCost(0);
    setRepairNotes('');
    setRepairError('');
    setNote('');
  };

  return (
    <>
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0d1321] border-l border-[#1e2a3a] shadow-2xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-[#0d1321]/95 backdrop-blur-md border-b border-[#1e2a3a] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#f0f0f0]">IMEI Details</h2>
            <p className="text-xs text-[#94a3b8]">{imei.imei}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[rgba(239,68,68,0.1)] text-[#64748b] hover:text-[#ef4444] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* IMEI Info Card */}
          <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#64748b]">Model</p>
                <p className="text-sm font-medium text-[#f0f0f0]">{imei.model}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b]">Batch</p>
                <p className="text-sm font-medium text-[#f0f0f0]">{imei.batch}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b]">Current Location</p>
                <p className="text-sm font-medium text-[#f0f0f0]">{imei.location}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b]">Status</p>
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1', statusConfig[imei.status]?.bg, statusConfig[imei.status]?.color)}>
                  {imei.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-sm font-semibold text-[#f0f0f0] mb-3">Change Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {actionButtons.map((action) => (
                <button
                  key={action.status}
                  onClick={() => handleAction(action.status)}
                  disabled={imei.status === action.status}
                  className={cn('p-3 rounded-lg border text-left transition-all disabled:opacity-30', action.bg, action.border, 'hover:brightness-110')}
                >
                  <div className="flex items-center gap-2">
                    <action.icon size={16} className={action.color} />
                    <span className={cn('text-xs font-semibold', action.color)}>{action.label}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-3">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)..."
                className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
              />
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-[#f0f0f0] mb-4">History</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-[#1e2a3a]" />
              <div className="space-y-6">
                {imei.history.map((event, index) => {
                  const Icon = eventIcons[event.event] || Clock;
                  const isLast = index === imei.history.length - 1;
                  return (
                    <div key={event.id} className="relative pl-10">
                      <div className={cn('absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center', isLast ? 'bg-[#c9a84c] border-[#c9a84c]' : 'bg-[#0d1321] border-[#1e2a3a]')}>
                        <Icon size={10} className={isLast ? 'text-[#0a0e1a]' : 'text-[#64748b]'} />
                      </div>
                      <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[#f0f0f0]">{event.event}</span>
                          <span className="text-xs text-[#64748b]">{event.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[#94a3b8]">
                          <MapPin size={10} />
                          {event.location}
                        </div>
                        {event.notes && <p className="text-xs text-[#64748b] mt-1">{event.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Repair Intake Modal */}
      {showRepairModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-[#1e2a3a]">
              <div>
                <h3 className="text-sm font-semibold text-[#f0f0f0]">Send to Repair</h3>
                <p className="text-xs text-[#94a3b8] font-mono">{imei.imei}</p>
              </div>
              <button onClick={() => setShowRepairModal(false)} className="text-[#64748b] hover:text-[#f0f0f0]">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {repairError && (
                <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3 text-sm text-[#ef4444]">
                  {repairError}
                </div>
              )}
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Issue / Problem <span className="text-[#ef4444]">*</span></label>
                <textarea
                  value={repairIssue}
                  onChange={(e) => setRepairIssue(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={3}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Technician <span className="text-[#ef4444]">*</span></label>
                <input
                  type="text"
                  value={repairTechnician}
                  onChange={(e) => setRepairTechnician(e.target.value)}
                  placeholder="Technician name"
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Estimated Cost</label>
                  <input
                    type="number"
                    value={repairCost}
                    onChange={(e) => setRepairCost(Number(e.target.value))}
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Model</label>
                  <input
                    type="text"
                    value={imei.model}
                    readOnly
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#94a3b8]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Notes</label>
                <textarea
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[#1e2a3a]">
              <button onClick={() => setShowRepairModal(false)} className="btn-outline btn-press px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={handleRepairSubmit} className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Wrench size={14} />
                Send to Repair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function IMEIManagementPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const perms = currentUser?.role?.permissions || [];
  const canCreate = canDoAction(perms, 'imei', 'create');
  const canEdit = canDoAction(perms, 'imei', 'edit');
  const canDelete = canDoAction(perms, 'imei', 'delete');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIMEI, setSelectedIMEI] = useState<IMEI | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add form state
  const [newIMEI, setNewIMEI] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newBatch, setNewBatch] = useState('');

  const imeis = useDataStore((state) => state.imeis);
  const batches = useDataStore((state) => state.batches);
  const models = useDataStore((state) => state.models);
  const addIMEI = useDataStore((state) => state.addIMEI);
  const deleteIMEI = useDataStore((state) => state.deleteIMEI);

  const filteredIMEIs = imeis.filter((imei) => {
    const matchesSearch =
      imei.imei.toLowerCase().includes(searchQuery.toLowerCase()) ||
      imei.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      imei.party?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      imei.invoice?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || imei.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ['all', 'produced', 'packed', 'sold', 'returned', 'qc', 'repair', 'scrap', 'sellable', 'warehouse'];

  const handleAddIMEI = async () => {
    if (!newIMEI.trim()) { setError('Enter IMEI number'); return; }
    if (!newModel) { setError('Select a model'); return; }
    if (!newBatch) { setError('Select a batch'); return; }
    if (imeis.find((i) => i.imei === newIMEI.trim())) { setError('IMEI already exists'); return; }

    const batch = batches.find((b) => b.id === newBatch);
    const imeiPayload = {
      imei: newIMEI.trim(),
      model: batch?.modelName || newModel,
      modelId: batch?.modelId || '',
      batch: batch?.name || newBatch,
      batchId: newBatch,
      location: 'Warehouse',
      status: 'warehouse' as const,
    };
    try {
      const newIMEIRecord = await supabaseData.addIMEI(imeiPayload);
      addIMEI(newIMEIRecord);
    } catch (e) { console.error('Supabase addIMEI failed:', e); addIMEI(imeiPayload); }

    setSuccess(`IMEI ${newIMEI} registered`);
    setError('');
    setNewIMEI('');
    setNewModel('');
    setNewBatch('');
    setShowAddForm(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this IMEI record?')) {
      deleteIMEI(id);
      try { await supabaseData.deleteIMEI(id); } catch (e) { console.error('Supabase deleteIMEI failed:', e); }
      setSuccess('IMEI deleted');
    }
  };

  return (
    <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f0f0]">IMEI Management</h1>
            <p className="text-sm text-[#94a3b8] mt-1">Final tracking hub — view all unit statuses after production, sales, returns, and repair</p>
          </div>
          <div className="flex items-center gap-3">
            {canCreate && (
              <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Plus size={16} />
                Add IMEI
              </button>
            )}
          </div>
        </div>
      
      {/* Messages */}
      {error && (
                  <div className="p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] flex items-center gap-2">
            <AlertCircle size={16} className="text-[#ef4444]" />
            <span className="text-sm text-[#ef4444]">{error}</span>
          </div>
              )}
      {success && (
                  <div className="p-3 rounded-lg bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#22c55e]" />
            <span className="text-sm text-[#22c55e]">{success}</span>
          </div>
              )}

      {/* Add IMEI Form */}
      {showAddForm && (
                  <div className="bg-gradient-to-br from-[#0f1525] to-[#0d1321] border border-[#1e2a3a] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#f0f0f0] mb-4">Register New IMEI</h3>
            <div className="grid md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">IMEI Number</label>
                <input
                  type="text"
                  value={newIMEI}
                  onChange={(e) => setNewIMEI(e.target.value)}
                  placeholder="e.g. 352123456789012"
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Model</label>
                <select
                  value={newModel}
                  onChange={(e) => { setNewModel(e.target.value); setNewBatch(''); }}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                >
                  <option value="">Select Model</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Batch</label>
                <select
                  value={newBatch}
                  onChange={(e) => setNewBatch(e.target.value)}
                  disabled={!newModel}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field disabled:opacity-50"
                >
                  <option value="">Select Batch</option>
                  {batches.filter((b) => b.modelName === newModel).map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleAddIMEI} className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Save size={16} />
                Register
              </button>
            </div>
          </div>
              )}

      {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search by IMEI, Model, Party, or Invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f1525] border border-[#1e2a3a] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#f0f0f0] placeholder-[#64748b] input-field"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter size={16} className="text-[#64748b] flex-shrink-0" />
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors', statusFilter === status ? 'bg-[rgba(201,168,76,0.15)] text-[#c9a84c] border border-[rgba(201,168,76,0.2)]' : 'bg-[#0f1525] text-[#94a3b8] border border-[#1e2a3a] hover:border-[#2a3a50]')}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      
      {/* IMEI Table */}
              <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2a3a]">
                  {['IMEI', 'Model', 'Batch', 'Party', 'Invoice', 'Location', 'Status', ''].map((header) => (
                    <th key={header} className="text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider px-4 py-3">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredIMEIs.map((imei) => {
                  const status = statusConfig[imei.status];
                  const StatusIcon = status?.icon || Package;
                  return (
                    <tr key={imei.id} className="border-b border-[#1e2a3a]/50 table-row-hover">
                      <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedIMEI(imei)}>
                        <span className="text-sm font-mono text-[#c9a84c]">{imei.imei}</span>
                      </td>
                      <td className="px-4 py-3"><span className="text-sm text-[#f0f0f0]">{imei.model}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-[#94a3b8]">{imei.batch}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-[#94a3b8]">{imei.party || '-'}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-[#94a3b8]">{imei.invoice || '-'}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-[#94a3b8]">{imei.location}</span></td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status?.bg, status?.color)}>
                          <StatusIcon size={10} />
                          {imei.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelectedIMEI(imei)} className="text-[#c9a84c] hover:text-[#f0f0f0] transition-colors">
                            <ArrowRight size={14} />
                          </button>
                          {canDelete && (
                            <button onClick={() => handleDelete(imei.id)} className="text-[#ef4444] hover:text-[#f87171] transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredIMEIs.length === 0 && (
            <div className="text-center py-12">
              <Search size={32} className="text-[#1e2a3a] mx-auto mb-3" />
              <p className="text-sm text-[#64748b]">No IMEIs found. Add specific units that need tracking.</p>
            </div>
          )}
        </div>
      
      {/* IMEI Detail Panel */}
      {selectedIMEI && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setSelectedIMEI(null)} />
          <IMETimelinePanel imei={selectedIMEI} onClose={() => setSelectedIMEI(null)} />
        </>
      )}
    </div>
  );
}
