'use client';

import { useState, useMemo } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Wrench,
  Trash2,
  AlertCircle,
  ArrowRight,
  Package,
  User,
  FileText,
  Calendar,
  Receipt,
  Save,
  Minus,
  Plus,
  Smartphone,
  X,
} from 'lucide-react';
import { useDataStore, useAuthStore } from '@/lib/store';
import { cn, canDoAction } from '@/lib/utils';
import * as supabaseData from '@/lib/supabase-data';

const qcOutcomes = [
  { id: 'good', label: 'GOOD', icon: CheckCircle2, color: 'text-[#22c55e]', bg: 'bg-[rgba(34,197,94,0.1)]', border: 'border-[rgba(34,197,94,0.2)]', desc: 'Return to sellable inventory' },
  { id: 'repair', label: 'REPAIR', icon: Wrench, color: 'text-[#f59e0b]', bg: 'bg-[rgba(245,158,11,0.1)]', border: 'border-[rgba(245,158,11,0.2)]', desc: 'Send to repair department' },
  { id: 'scrap', label: 'SCRAP', icon: Trash2, color: 'text-[#ef4444]', bg: 'bg-[rgba(239,68,68,0.1)]', border: 'border-[rgba(239,68,68,0.2)]', desc: 'Move to rejected inventory' },
];

export default function ReturnsQCPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const perms = currentUser?.role?.permissions || [];
  const canCreate = canDoAction(perms, 'returns', 'create');
  const canEdit = canDoAction(perms, 'returns', 'edit');
  const canDelete = canDoAction(perms, 'returns', 'delete');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [returnMode, setReturnMode] = useState<'bulk' | 'imei'>('bulk');

  // Bulk form state
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [qcNotes, setQcNotes] = useState('');

  // IMEI form state
  const [imeiInput, setImeiInput] = useState('');

  // Repair intake modal state
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairIssue, setRepairIssue] = useState('');
  const [repairTechnician, setRepairTechnician] = useState('');
  const [repairCost, setRepairCost] = useState(0);
  const [repairNotes, setRepairNotes] = useState('');
  const [repairError, setRepairError] = useState('');

  const returns = useDataStore((state) => state.returns);
  const parties = useDataStore((state) => state.parties);
  const sales = useDataStore((state) => state.sales);
  const batches = useDataStore((state) => state.batches);
  const imeis = useDataStore((state) => state.imeis);
  const addReturn = useDataStore((state) => state.addReturn);
  const addRepair = useDataStore((state) => state.addRepairOrder);
  const updateBatch = useDataStore((state) => state.updateBatch);
  const updateIMEI = useDataStore((state) => state.updateIMEI);
  const addIMEIHistory = useDataStore((state) => state.addIMEIHistory);
  const addIMEI = useDataStore((state) => state.addIMEI);

  // Get party's sales for invoice selection
  const partySales = useMemo(() =>
    sales.filter((s) => s.partyId === selectedPartyId),
    [sales, selectedPartyId]
  );

  const selectedSale = partySales.find((s) => s.invoice === selectedInvoice);

  // Models from selected invoice
  const invoiceModels = useMemo(() => {
    if (!selectedSale) return [];
    return [...new Set(selectedSale.items.map((item) => item.model))];
  }, [selectedSale]);

  // Batches for selected model
  const modelBatches = useMemo(() => {
    if (!selectedModel) return [];
    return batches.filter((b) => b.modelName === selectedModel);
  }, [batches, selectedModel]);

  const handleProcessReturn = async () => {
    if (!selectedPartyId) { setError('Please select a party'); return; }
    if (!selectedInvoice) { setError('Please select an invoice'); return; }
    if (!selectedModel) { setError('Please select a model'); return; }
    if (!selectedBatchId) { setError('Please select a batch'); return; }
    if (!selectedOutcome) { setError('Please select a QC outcome'); return; }

    // If repair outcome, open intake modal first
    if (selectedOutcome === 'repair') {
      setRepairIssue(returnReason || '');
      setRepairTechnician('');
      setRepairCost(0);
      setRepairNotes(qcNotes || '');
      setRepairError('');
      setShowRepairModal(true);
      return;
    }

    // Good or Scrap - process immediately
    processReturnFinal();
  };

  const processReturnFinal = async (repairData?: { issue: string; technician: string; cost: number; notes: string }) => {
    const party = parties.find((p) => p.id === selectedPartyId);
    const batch = batches.find((b) => b.id === selectedBatchId);

    if (returnMode === 'bulk') {
      if (quantity <= 0) { setError('Please enter quantity'); return; }

      const returnData = {
        returnNumber: `RET-${Math.floor(100 + Math.random() * 900)}`,
        imei: `BULK-${selectedBatchId}-${Date.now()}`,
        model: selectedModel,
        partyId: selectedPartyId,
        partyName: party?.name || 'Unknown',
        originalInvoice: selectedInvoice,
        returnDate,
        reason: returnReason || 'Customer return',
        qcStatus: selectedOutcome as 'good' | 'repair' | 'scrap',
        qcNotes: qcNotes || `${selectedOutcome?.toUpperCase()} - QC processed`,
        refundAmount: 0,
      };
      try {
        const newReturn = await supabaseData.addReturn(returnData);
        addReturn(newReturn);
      } catch (e) { console.error('Supabase addReturn failed:', e); addReturn(returnData); }

      if (batch) {
        if (selectedOutcome === 'good') {
          const updates = { returns: batch.returns + quantity, goodReturns: batch.goodReturns + quantity, sellable: batch.sellable + quantity };
          updateBatch(selectedBatchId, updates);
          try { await supabaseData.updateBatch(selectedBatchId, updates); } catch (e) { console.error('Supabase updateBatch failed:', e); }
        } else if (selectedOutcome === 'repair') {
          const updates = { returns: batch.returns + quantity, repair: batch.repair + quantity };
          updateBatch(selectedBatchId, updates);
          try { await supabaseData.updateBatch(selectedBatchId, updates); } catch (e) { console.error('Supabase updateBatch failed:', e); }
          const repairPayload = {
            imei: `BULK-${selectedBatchId}-${Date.now()}`,
            model: selectedModel,
            issue: repairData?.issue || returnReason || 'Customer return - needs inspection',
            technician: repairData?.technician || 'Unassigned',
            startDate: returnDate,
            status: 'pending' as const,
            cost: repairData?.cost || 0,
            notes: repairData?.notes || qcNotes || 'Auto-generated from return QC',
          };
          try {
            const newRepair = await supabaseData.addRepairOrder(repairPayload);
            addRepair(newRepair);
          } catch (e) { console.error('Supabase addRepairOrder failed:', e); addRepair(repairPayload); }
        } else if (selectedOutcome === 'scrap') {
          const updates = { returns: batch.returns + quantity, scrap: batch.scrap + quantity };
          updateBatch(selectedBatchId, updates);
          try { await supabaseData.updateBatch(selectedBatchId, updates); } catch (e) { console.error('Supabase updateBatch failed:', e); }
        }
      }

      setSuccess(`Return processed: ${quantity} x ${selectedModel} → ${selectedOutcome?.toUpperCase()}`);
    } else {
      // IMEI mode - specific unit return
      if (imeiInput.trim()) {
        const imeiRecord = imeis.find((i) => i.imei === imeiInput.trim());
        const imeiStatus = selectedOutcome === 'good' ? 'sellable' : selectedOutcome as 'repair' | 'scrap' | 'sellable';

        if (imeiRecord) {
          updateIMEI(imeiRecord.id, {
            status: imeiStatus,
            location: imeiStatus === 'repair' ? 'Repair Dept' : imeiStatus === 'scrap' ? 'Scrap Yard' : 'Warehouse',
          });
          try { await supabaseData.updateIMEI(imeiRecord.id, { status: imeiStatus, location: imeiStatus === 'repair' ? 'Repair Dept' : imeiStatus === 'scrap' ? 'Scrap Yard' : 'Warehouse' }); } catch (e) { console.error('Supabase updateIMEI failed:', e); }
          addIMEIHistory(imeiRecord.id, {
            event: imeiStatus === 'sellable' ? 'Moved to Sellable' : imeiStatus === 'repair' ? 'Repair' : 'Scrapped',
            date: returnDate,
            location: imeiStatus === 'repair' ? 'Repair Dept' : imeiStatus === 'scrap' ? 'Scrap Yard' : 'Warehouse',
            notes: returnReason || `Return QC: ${selectedOutcome}`,
          });
        } else {
          const imeiPayload = {
            imei: imeiInput.trim(),
            model: selectedModel,
            modelId: selectedModel,
            batch: batch?.name || '',
            batchId: selectedBatchId,
            status: imeiStatus,
            location: imeiStatus === 'repair' ? 'Repair Dept' : imeiStatus === 'scrap' ? 'Scrap Yard' : 'Warehouse',
            partyId: selectedPartyId,
            party: party?.name || 'Unknown',
            invoice: selectedInvoice,
          };
          try {
            const newIMEIRecord = await supabaseData.addIMEI(imeiPayload);
            addIMEI(newIMEIRecord);
          } catch (e) { console.error('Supabase addIMEI failed:', e); addIMEI(imeiPayload); }
        }

        const returnData = {
          returnNumber: `RET-${Math.floor(100 + Math.random() * 900)}`,
          imei: imeiInput.trim(),
          model: selectedModel,
          partyId: selectedPartyId,
          partyName: party?.name || 'Unknown',
          originalInvoice: selectedInvoice,
          returnDate,
          reason: returnReason || 'Customer return',
          qcStatus: selectedOutcome as 'good' | 'repair' | 'scrap',
          qcNotes: qcNotes || `${selectedOutcome?.toUpperCase()} - QC processed`,
          refundAmount: 0,
        };
        try {
          const newReturn = await supabaseData.addReturn(returnData);
          addReturn(newReturn);
        } catch (e) { console.error('Supabase addReturn failed:', e); addReturn(returnData); }

        if (batch) {
          if (selectedOutcome === 'good') {
            const updates = { returns: batch.returns + 1, goodReturns: batch.goodReturns + 1, sellable: batch.sellable + 1 };
            updateBatch(batch.id, updates);
            try { await supabaseData.updateBatch(batch.id, updates); } catch (e) { console.error('Supabase updateBatch failed:', e); }
          } else if (selectedOutcome === 'repair') {
            const updates = { returns: batch.returns + 1, repair: batch.repair + 1 };
            updateBatch(batch.id, updates);
            try { await supabaseData.updateBatch(batch.id, updates); } catch (e) { console.error('Supabase updateBatch failed:', e); }
            const repairPayload = {
              imei: imeiInput.trim(),
              model: selectedModel,
              issue: repairData?.issue || returnReason || 'Customer return - needs inspection',
              technician: repairData?.technician || 'Unassigned',
              startDate: returnDate,
              status: 'pending' as const,
              cost: repairData?.cost || 0,
              notes: repairData?.notes || qcNotes || 'Auto-generated from return QC',
            };
            try {
              const newRepair = await supabaseData.addRepairOrder(repairPayload);
              addRepair(newRepair);
            } catch (e) { console.error('Supabase addRepairOrder failed:', e); addRepair(repairPayload); }
          } else if (selectedOutcome === 'scrap') {
            const updates = { returns: batch.returns + 1, scrap: batch.scrap + 1 };
            updateBatch(batch.id, updates);
            try { await supabaseData.updateBatch(batch.id, updates); } catch (e) { console.error('Supabase updateBatch failed:', e); }
          }
        }

        setSuccess(`IMEI ${imeiInput.trim()} returned → ${selectedOutcome?.toUpperCase()}`);
        setImeiInput('');
      } else {
        if (quantity <= 0) { setError('Please enter quantity or IMEI number'); return; }

        const returnData = {
          returnNumber: `RET-${Math.floor(100 + Math.random() * 900)}`,
          imei: `BULK-${selectedBatchId}-${Date.now()}`,
          model: selectedModel,
          partyId: selectedPartyId,
          partyName: party?.name || 'Unknown',
          originalInvoice: selectedInvoice,
          returnDate,
          reason: returnReason || 'Customer return',
          qcStatus: selectedOutcome as 'good' | 'repair' | 'scrap',
          qcNotes: qcNotes || `${selectedOutcome?.toUpperCase()} - QC processed`,
          refundAmount: 0,
        };
        try {
          const newReturn = await supabaseData.addReturn(returnData);
          addReturn(newReturn);
        } catch (e) { console.error('Supabase addReturn failed:', e); addReturn(returnData); }

        if (batch) {
          if (selectedOutcome === 'good') {
            const updates = { returns: batch.returns + quantity, goodReturns: batch.goodReturns + quantity, sellable: batch.sellable + quantity };
            updateBatch(selectedBatchId, updates);
            try { await supabaseData.updateBatch(selectedBatchId, updates); } catch (e) { console.error('Supabase updateBatch failed:', e); }
          } else if (selectedOutcome === 'repair') {
            const updates = { returns: batch.returns + quantity, repair: batch.repair + quantity };
            updateBatch(selectedBatchId, updates);
            try { await supabaseData.updateBatch(selectedBatchId, updates); } catch (e) { console.error('Supabase updateBatch failed:', e); }
            const repairPayload = {
              imei: `BULK-${selectedBatchId}-${Date.now()}`,
              model: selectedModel,
              issue: repairData?.issue || returnReason || 'Customer return - needs inspection',
              technician: repairData?.technician || 'Unassigned',
              startDate: returnDate,
              status: 'pending' as const,
              cost: repairData?.cost || 0,
              notes: repairData?.notes || qcNotes || 'Auto-generated from return QC',
            };
            try {
              const newRepair = await supabaseData.addRepairOrder(repairPayload);
              addRepair(newRepair);
            } catch (e) { console.error('Supabase addRepairOrder failed:', e); addRepair(repairPayload); }
          } else if (selectedOutcome === 'scrap') {
            const updates = { returns: batch.returns + quantity, scrap: batch.scrap + quantity };
            updateBatch(selectedBatchId, updates);
            try { await supabaseData.updateBatch(selectedBatchId, updates); } catch (e) { console.error('Supabase updateBatch failed:', e); }
          }
        }

        setSuccess(`Return processed: ${quantity} x ${selectedModel} → ${selectedOutcome?.toUpperCase()}`);
      }
    }

    setError('');
    setSelectedPartyId('');
    setSelectedInvoice('');
    setSelectedModel('');
    setSelectedBatchId('');
    setQuantity(1);
    setSelectedOutcome(null);
    setReturnReason('');
    setQcNotes('');
  };

  const handleRepairSubmit = async () => {
    if (!repairIssue.trim()) { setRepairError('Issue / Problem is required'); return; }
    if (!repairTechnician.trim()) { setRepairError('Technician is required'); return; }

    setShowRepairModal(false);
    await processReturnFinal({
      issue: repairIssue,
      technician: repairTechnician,
      cost: repairCost,
      notes: repairNotes,
    });
    setRepairIssue('');
    setRepairTechnician('');
    setRepairCost(0);
    setRepairNotes('');
    setRepairError('');
  };



  return (
    <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f0f0]">Returns & QC</h1>
            <p className="text-sm text-[#94a3b8] mt-1">First step — receive returned units and run quality control inspection</p>
          </div>
          {canCreate && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="btn-outline btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <Receipt size={16} />
                {showHistory ? 'New Return' : 'History'}
              </button>
            </div>
          )}
        </div>
      
      {showHistory ? (
                  <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e2a3a]">
              <h3 className="text-sm font-semibold text-[#f0f0f0]">Recent Returns ({returns.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e2a3a]">
                    {['Return #', 'IMEI', 'Model', 'Party', 'Invoice', 'Reason', 'QC Status', 'Date'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {returns.map((ret) => (
                    <tr key={ret.id} className="border-b border-[#1e2a3a]/50 table-row-hover">
                      <td className="px-4 py-3"><span className="text-sm font-mono text-[#c9a84c]">{ret.returnNumber}</span></td>
                      <td className="px-4 py-3"><span className="text-sm font-mono text-[#94a3b8]">{ret.imei}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-[#f0f0f0]">{ret.model}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-[#94a3b8]">{ret.partyName}</span></td>
                      <td className="px-4 py-3"><span className="text-sm font-mono text-[#94a3b8]">{ret.originalInvoice}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-[#94a3b8]">{ret.reason}</span></td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', ret.qcStatus === 'good' && 'badge-success', ret.qcStatus === 'repair' && 'badge-warning', ret.qcStatus === 'scrap' && 'badge-danger', ret.qcStatus === 'pending' && 'badge-info')}>
                          {ret.qcStatus === 'good' && <CheckCircle2 size={10} />}
                          {ret.qcStatus === 'repair' && <Wrench size={10} />}
                          {ret.qcStatus === 'scrap' && <Trash2 size={10} />}
                          {ret.qcStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className="text-sm text-[#94a3b8]">{ret.returnDate}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
              ) : (
        <>
          {/* Mode Toggle */}
                      <div className="flex items-center gap-2 bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-2 w-fit">
              <button
                onClick={() => { setReturnMode('bulk'); setImeiInput(''); setError(''); }}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', returnMode === 'bulk' ? 'bg-[rgba(201,168,76,0.15)] text-[#c9a84c]' : 'text-[#94a3b8] hover:text-[#f0f0f0]')}
              >
                <Package size={14} className="inline mr-2" />
                Bulk Return
              </button>
              <button
                onClick={() => { setReturnMode('imei'); setError(''); }}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', returnMode === 'imei' ? 'bg-[rgba(201,168,76,0.15)] text-[#c9a84c]' : 'text-[#94a3b8] hover:text-[#f0f0f0]')}
              >
                <Smartphone size={14} className="inline mr-2" />
                Specific IMEI
              </button>
            </div>
          
          {/* Return Info */}
                      <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User size={14} className="text-[#c9a84c]" />
                  <span className="text-xs text-[#64748b]">Party</span>
                </div>
                <select
                  value={selectedPartyId}
                  onChange={(e) => { setSelectedPartyId(e.target.value); setSelectedInvoice(''); setSelectedModel(''); setSelectedBatchId(''); setImeiInput(''); }}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                >
                  <option value="">Select Party</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={14} className="text-[#c9a84c]" />
                  <span className="text-xs text-[#64748b]">Original Invoice</span>
                </div>
                <select
                  value={selectedInvoice}
                  onChange={(e) => { setSelectedInvoice(e.target.value); setSelectedModel(''); setSelectedBatchId(''); setImeiInput(''); }}
                  disabled={!selectedPartyId}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field disabled:opacity-50"
                >
                  <option value="">Select Invoice</option>
                  {partySales.map((s) => (
                    <option key={s.invoice} value={s.invoice}>{s.invoice} ({s.items.length} pcs)</option>
                  ))}
                </select>
              </div>

              <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-[#c9a84c]" />
                  <span className="text-xs text-[#64748b]">Return Date</span>
                </div>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                />
              </div>

              <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RotateCcw size={14} className="text-[#c9a84c]" />
                  <span className="text-xs text-[#64748b]">Return #</span>
                </div>
                <input
                  type="text"
                  value={`RET-${Math.floor(100 + Math.random() * 900)}`}
                  readOnly
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#94a3b8]"
                />
              </div>
            </div>
          
          {/* Item Details */}
                      <div className="bg-gradient-to-br from-[#0f1525] to-[#0d1321] border border-[#1e2a3a] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[#f0f0f0] mb-4">Return Item Details</h3>
              <div className="grid md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => { setSelectedModel(e.target.value); setSelectedBatchId(''); setImeiInput(''); }}
                    disabled={!selectedInvoice}
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field disabled:opacity-50"
                  >
                    <option value="">Select Model</option>
                    {invoiceModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Batch</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => { setSelectedBatchId(e.target.value); setImeiInput(''); }}
                    disabled={!selectedModel}
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field disabled:opacity-50"
                  >
                    <option value="">Select Batch</option>
                    {modelBatches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.sellable} avail)</option>
                    ))}
                  </select>
                </div>

                {returnMode === 'bulk' ? (
                  <div>
                    <label className="block text-xs text-[#94a3b8] mb-1">Quantity</label>
                    <div className="flex items-center">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 bg-[#0d1321] border border-[#1e2a3a] rounded-l-lg text-[#94a3b8] hover:text-[#f0f0f0]">
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-[#0d1321] border-y border-[#1e2a3a] py-2 text-sm text-[#f0f0f0] text-center input-field"
                      />
                      <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 bg-[#0d1321] border border-[#1e2a3a] rounded-r-lg text-[#94a3b8] hover:text-[#f0f0f0]">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#94a3b8] mb-1">IMEI Number <span className="text-[#64748b]">(optional)</span></label>
                      <input
                        type="text"
                        value={imeiInput}
                        onChange={(e) => setImeiInput(e.target.value)}
                        placeholder="Enter IMEI..."
                        disabled={!selectedBatchId}
                        className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field font-mono disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#94a3b8] mb-1">Quantity</label>
                      <div className="flex items-center">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 bg-[#0d1321] border border-[#1e2a3a] rounded-l-lg text-[#94a3b8] hover:text-[#f0f0f0]">
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                          className="w-full bg-[#0d1321] border-y border-[#1e2a3a] py-2 text-sm text-[#f0f0f0] text-center input-field"
                        />
                        <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 bg-[#0d1321] border border-[#1e2a3a] rounded-r-lg text-[#94a3b8] hover:text-[#f0f0f0]">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Reason</label>
                  <input
                    type="text"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="e.g. Display defect"
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                  />
                </div>
              </div>
            </div>
          
          {/* QC Outcomes */}
                      <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[#f0f0f0] mb-4">QC Inspection Result</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {qcOutcomes.map((outcome) => (
                  <button
                    key={outcome.id}
                    onClick={() => setSelectedOutcome(outcome.id)}
                    className={cn(
                      'p-5 rounded-xl border text-left transition-all',
                      selectedOutcome === outcome.id
                        ? `${outcome.bg} ${outcome.border}`
                        : 'bg-[#0d1321] border-[#1e2a3a] hover:border-[#2a3a50]'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', outcome.bg)}>
                        <outcome.icon size={20} className={outcome.color} />
                      </div>
                      <span className={cn('text-lg font-bold', outcome.color)}>{outcome.label}</span>
                    </div>
                    <p className="text-xs text-[#94a3b8]">{outcome.desc}</p>
                  </button>
                ))}
              </div>

              {selectedOutcome && (
                <div className="mt-4">
                  <label className="block text-sm text-[#94a3b8] mb-1">QC Notes</label>
                  <input
                    type="text"
                    value={qcNotes}
                    onChange={(e) => setQcNotes(e.target.value)}
                    placeholder="Inspection notes..."
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                  />
                </div>
              )}
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

          {/* Action Button */}
                      <div className="flex justify-end">
              <button
                onClick={handleProcessReturn}
                className="btn-primary btn-press px-6 py-2.5 rounded-lg text-sm flex items-center gap-2"
              >
                <Save size={16} />
                Process Return
                <ArrowRight size={16} />
              </button>
            </div>
          
          {/* Repair Intake Modal */}
          {showRepairModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-[#1e2a3a]">
                  <div>
                    <h3 className="text-sm font-semibold text-[#f0f0f0]">Send to Repair</h3>
                    <p className="text-xs text-[#94a3b8]">{returnMode === 'bulk' ? `${quantity} x ${selectedModel}` : imeiInput.trim() || `${quantity} x ${selectedModel}`}</p>
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
                      <label className="block text-xs text-[#94a3b8] mb-1">Batch</label>
                      <input
                        type="text"
                        value={batches.find((b) => b.id === selectedBatchId)?.name || ''}
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
      )}
    </div>
  );
}
