'use client';

import { useState } from 'react';
import {
  Factory,
  Package,
  Plus,
  Minus,
  Save,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Layers,
  Calendar,
  Pencil,
  Smartphone,
} from 'lucide-react';
import { useDataStore, useAuthStore } from '@/lib/store';
import { cn, canDoAction } from '@/lib/utils';
import * as supabaseData from '@/lib/supabase-data';

export default function ProductionPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const perms = currentUser?.role?.permissions || [];
  const canCreate = canDoAction(perms, 'production', 'create');
  const canEdit = canDoAction(perms, 'production', 'edit');
  const canDelete = canDoAction(perms, 'production', 'delete');
  const [showNewBatch, setShowNewBatch] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New batch form
  const [batchName, setBatchName] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [originalQty, setOriginalQty] = useState(1000);

  // Update form
  const [producedQty, setProducedQty] = useState(0);
  const [packedQty, setPackedQty] = useState(0);
  const [warehouseQty, setWarehouseQty] = useState(0);

  // Model management state
  const [showModelModal, setShowModelModal] = useState(false);
  const [modelName, setModelName] = useState('');
  const [modelSpecs, setModelSpecs] = useState('');
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  const batches = useDataStore((state) => state.batches);
  const models = useDataStore((state) => state.models);
  const addBatch = useDataStore((state) => state.addBatch);
  const updateBatch = useDataStore((state) => state.updateBatch);
  const deleteBatch = useDataStore((state) => state.deleteBatch);
  const addModel = useDataStore((state) => state.addModel);
  const updateModel = useDataStore((state) => state.updateModel);
  const deleteModel = useDataStore((state) => state.deleteModel);
  const bomItems = useDataStore((state) => state.bomItems);
  const components = useDataStore((state) => state.components);

  const consumePartsForBatch = useDataStore((state) => state.consumePartsForBatch);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const selectedModel = models.find((m) => m.id === selectedModelId);

  // Calculate parts required for selected model and quantity
  const partsRequired = selectedModelId
    ? bomItems
        .filter((b) => b.modelId === selectedModelId)
        .map((b) => {
          const component = components.find((c) => c.id === b.componentId);
          const required = b.quantityPerUnit * originalQty;
          const available = component?.available || 0;
          return {
            componentId: b.componentId,
            componentName: component?.name || 'Unknown',
            qtyPerUnit: b.quantityPerUnit,
            required,
            available,
            shortfall: Math.max(0, required - available),
            sufficient: available >= required,
          };
        })
    : [];

  const handleModelSubmit = async () => {
    if (!modelName.trim()) { setError('Model name is required'); return; }
    if (editingModelId) {
      updateModel(editingModelId, { name: modelName, specifications: modelSpecs });
      try { await supabaseData.updateModel(editingModelId, { name: modelName, specifications: modelSpecs }); } catch (e) { console.error('Supabase updateModel failed:', e); }
      setSuccess('Model updated');
    } else {
      const newModel = { name: modelName, specifications: modelSpecs };
      try {
        const createdModel = await supabaseData.addModel(newModel);
        addModel(createdModel);
      } catch (e) { console.error('Supabase addModel failed:', e); addModel(newModel); }
      setSuccess('Model created');
    }
    setModelName('');
    setModelSpecs('');
    setEditingModelId(null);
    setShowModelModal(false);
    setError('');
  };

  const handleEditModel = (model: any) => {
    setEditingModelId(model.id);
    setModelName(model.name);
    setModelSpecs(model.specifications);
    setShowModelModal(true);
  };

  const handleDeleteModel = async (id: string) => {
    if (confirm('Delete this model?')) {
      deleteModel(id);
      try { await supabaseData.deleteModel(id); } catch (e) { console.error('Supabase deleteModel failed:', e); }
      setSuccess('Model deleted');
    }
  };

  const handleCreateBatch = async () => {
    if (!batchName.trim()) { setError('Enter batch name'); return; }
    if (!selectedModelId) { setError('Select a model'); return; }
    if (originalQty <= 0) { setError('Enter valid quantity'); return; }

    // Check parts availability
    const requiredParts = bomItems
      .filter((b) => b.modelId === selectedModelId)
      .map((b) => {
        const component = components.find((c) => c.id === b.componentId);
        return {
          componentId: b.componentId,
          componentName: component?.name || 'Unknown',
          required: b.quantityPerUnit * originalQty,
          available: component?.available || 0,
        };
      });

    const insufficient = requiredParts.filter((p) => p.required > p.available);
    if (insufficient.length > 0) {
      setError(`Cannot create batch: ${insufficient.map((p) => `${p.componentName} (need ${p.required}, have ${p.available})`).join(', ')}`);
      return;
    }

    // Consume parts from inventory
    consumePartsForBatch(selectedModelId, originalQty);
    // Sync consumed parts to Supabase
    for (const part of requiredParts) {
      const component = components.find((c) => c.id === part.componentId);
      if (component) {
        try { await supabaseData.updateComponent(part.componentId, { quantityConsumed: component.quantityConsumed + part.required, available: component.available - part.required }); } catch (e) { console.error('Supabase updateComponent failed:', e); }
      }
    }

    const batchPayload = {
      name: batchName,
      modelId: selectedModelId,
      modelName: selectedModel?.name || 'Unknown',
      originalQuantity: originalQty,
      produced: 0,
      packed: 0,
      dispatched: 0,
      returns: 0,
      goodReturns: 0,
      repair: 0,
      scrap: 0,
      warehouse: 0,
      sellable: 0,
      status: 'in-production' as const,
    };
    try {
      const createdBatch = await supabaseData.addBatch(batchPayload);
      addBatch(createdBatch);
    } catch (e) { console.error('Supabase addBatch failed:', e); addBatch(batchPayload); }

    setSuccess(`Batch ${batchName} created and parts consumed from inventory`);
    setError('');
    setBatchName('');
    setSelectedModelId('');
    setOriginalQty(1000);
    setShowNewBatch(false);
  };

  const handleUpdateBatch = async () => {
    if (!selectedBatchId) { setError('Select a batch'); return; }
    if (!selectedBatch) return;

    const newProduced = Math.max(0, producedQty);
    const newPacked = Math.max(0, packedQty);
    const newWarehouse = Math.max(0, warehouseQty);
    const newSellable = newPacked - selectedBatch.dispatched + selectedBatch.goodReturns;

    const updates = {
      produced: newProduced,
      packed: newPacked,
      warehouse: newWarehouse,
      sellable: Math.max(0, newSellable),
      status: newPacked >= selectedBatch.originalQuantity ? 'completed' as const : 'in-production' as const,
    };
    updateBatch(selectedBatchId, updates);
    try { await supabaseData.updateBatch(selectedBatchId, updates); } catch (e) { console.error('Supabase updateBatch failed:', e); }

    setSuccess(`Batch ${selectedBatch.name} updated`);
    setError('');
    setShowUpdate(false);
    setSelectedBatchId('');
    setProducedQty(0);
    setPackedQty(0);
    setWarehouseQty(0);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this batch?')) {
      deleteBatch(id);
      try { await supabaseData.deleteBatch(id); } catch (e) { console.error('Supabase deleteBatch failed:', e); }
      setSuccess('Batch deleted');
    }
  };

  return (
    <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f0f0]">Production</h1>
            <p className="text-sm text-[#94a3b8] mt-1">Manage production batches and track output</p>
          </div>
          <div className="flex items-center gap-3">
            {canCreate && (
              <button onClick={() => setShowModelModal(true)} className="btn-outline btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Layers size={16} />
                Manage Models
              </button>
            )}
            <button onClick={() => setShowUpdate(!showUpdate)} className="btn-outline btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Factory size={16} />
              {showUpdate ? 'Close' : 'Record Output'}
            </button>
            {canCreate && (
              <button onClick={() => setShowNewBatch(!showNewBatch)} className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Plus size={16} />
                New Batch
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

      {/* New Batch Form */}
      {showNewBatch && (
                  <div className="bg-gradient-to-br from-[#0f1525] to-[#0d1321] border border-[#1e2a3a] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#f0f0f0] mb-4">Create New Production Batch</h3>
            <div className="grid md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Batch Name</label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. XYZ-004"
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                />
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Model</label>
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                >
                  <option value="">Select Model</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Target Quantity</label>
                <input
                  type="number"
                  value={originalQty}
                  onChange={(e) => setOriginalQty(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                />
              </div>
              <button onClick={handleCreateBatch} className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Save size={16} />
                Create Batch
              </button>
            </div>

            {/* Parts Requirement Check */}
            {selectedModelId && partsRequired.length > 0 && (
              <div className="mt-4 bg-[#0d1321] border border-[#1e2a3a] rounded-lg p-4">
                <h4 className="text-xs font-semibold text-[#64748b] uppercase mb-3">Parts Required for {originalQty.toLocaleString()} units</h4>
                <div className="space-y-2">
                  {partsRequired.map((part) => (
                    <div
                      key={part.componentId}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-lg border',
                        part.sufficient
                          ? 'bg-[rgba(34,197,94,0.05)] border-[rgba(34,197,94,0.2)]'
                          : 'bg-[rgba(239,68,68,0.05)] border-[rgba(239,68,68,0.2)]'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Package size={14} className={part.sufficient ? 'text-[#22c55e]' : 'text-[#ef4444]'} />
                        <span className="text-sm text-[#f0f0f0]">{part.componentName}</span>
                        <span className="text-xs text-[#64748b]">({part.qtyPerUnit} per unit)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#94a3b8]">
                          Need: <span className="font-mono text-[#f0f0f0]">{part.required.toLocaleString()}</span>
                        </span>
                        <span className="text-xs text-[#94a3b8]">
                          Have: <span className={cn('font-mono', part.sufficient ? 'text-[#22c55e]' : 'text-[#ef4444]')}>{part.available.toLocaleString()}</span>
                        </span>
                        {!part.sufficient && (
                          <span className="text-xs text-[#ef4444] font-medium">
                            Short: {part.shortfall.toLocaleString()}
                          </span>
                        )}
                        {part.sufficient && (
                          <CheckCircle2 size={14} className="text-[#22c55e]" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {partsRequired.some((p) => !p.sufficient) && (
                  <div className="mt-3 p-2 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] flex items-center gap-2">
                    <AlertCircle size={14} className="text-[#ef4444]" />
                    <span className="text-xs text-[#ef4444]">Insufficient parts for this batch. Adjust quantity or restock.</span>
                  </div>
                )}
              </div>
            )}
            {selectedModelId && partsRequired.length === 0 && (
              <div className="mt-4 p-3 rounded-lg bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] flex items-center gap-2">
                <AlertCircle size={14} className="text-[#f59e0b]" />
                <span className="text-xs text-[#f59e0b]">No BOM defined for this model. Go to Parts Inventory &gt; BOM Management to add parts.</span>
              </div>
            )}
          </div>
              )}

      {/* Update Production Form */}
      {showUpdate && (
                  <div className="bg-gradient-to-br from-[#0f1525] to-[#0d1321] border border-[#1e2a3a] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#f0f0f0] mb-4">Record Production Output</h3>
            <div className="grid md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => {
                    setSelectedBatchId(e.target.value);
                    const b = batches.find((x) => x.id === e.target.value);
                    if (b) { setProducedQty(b.produced); setPackedQty(b.packed); setWarehouseQty(b.warehouse); }
                  }}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                >
                  <option value="">Select Batch</option>
                  {batches.filter((b) => b.status !== 'completed').map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.modelName})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Produced</label>
                <input
                  type="number"
                  value={producedQty}
                  onChange={(e) => setProducedQty(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                />
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Packed</label>
                <input
                  type="number"
                  value={packedQty}
                  onChange={(e) => setPackedQty(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                />
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">To Warehouse</label>
                <input
                  type="number"
                  value={warehouseQty}
                  onChange={(e) => setWarehouseQty(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                />
              </div>
              <button onClick={handleUpdateBatch} className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Save size={16} />
                Update
              </button>
            </div>
          </div>
              )}

      {/* Batch Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <div key={batch.id} className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-5 hover:border-[#2a3a50] transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs text-[#64748b]">Batch</span>
                  <h3 className="text-lg font-bold text-[#f0f0f0]">{batch.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', batch.status === 'active' && 'badge-success', batch.status === 'completed' && 'badge-info', batch.status === 'in-production' && 'badge-warning')}>
                    {batch.status.toUpperCase()}
                  </span>
                  {canDelete && (
                    <button onClick={() => handleDelete(batch.id)} className="text-[#ef4444] hover:text-[#f87171] transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <span className="text-xs text-[#64748b]">Model</span>
                <p className="text-sm font-medium text-[#94a3b8]">{batch.modelName}</p>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#64748b]">Production Progress</span>
                  <span className="text-xs text-[#94a3b8]">
                    {Math.round((batch.produced / batch.originalQuantity) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-[#1e2a3a] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c9a84c] to-[#a88a3a]"
                    style={{ width: `${Math.min(100, (batch.produced / batch.originalQuantity) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Target', value: batch.originalQuantity },
                  { label: 'Produced', value: batch.produced },
                  { label: 'Packed', value: batch.packed },
                  { label: 'Dispatched', value: batch.dispatched },
                  { label: 'Warehouse', value: batch.warehouse },
                  { label: 'Sellable', value: batch.sellable },
                ].map((item) => (
                  <div key={item.label} className="bg-[#0d1321] rounded-lg p-2.5">
                    <span className="text-[10px] text-[#64748b] uppercase">{item.label}</span>
                    <div className="text-sm font-bold text-[#f0f0f0]">{item.value.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      
      {/* Model Management Modal */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#1e2a3a]">
              <div>
                <h3 className="text-sm font-semibold text-[#f0f0f0]">{editingModelId ? 'Edit Model' : 'Manage Models'}</h3>
                <p className="text-xs text-[#94a3b8]">Define models for production batches</p>
              </div>
              <button onClick={() => { setShowModelModal(false); setEditingModelId(null); setModelName(''); setModelSpecs(''); }} className="text-[#64748b] hover:text-[#f0f0f0]">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Add/Edit Form */}
              <div className="bg-gradient-to-br from-[#0d1321] to-[#0a0e1a] border border-[#1e2a3a] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-[#64748b] uppercase mb-3">{editingModelId ? 'Edit Model' : 'Add New Model'}</h4>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Model Name</label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="e.g. iPhone 15 Pro"
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-[#94a3b8] mb-1">Specifications</label>
                  <textarea
                    value={modelSpecs}
                    onChange={(e) => setModelSpecs(e.target.value)}
                    placeholder="RAM, Storage, Battery, Display, etc."
                    rows={2}
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field resize-none"
                  />
                </div>
                <div className="flex justify-end mt-3">
                  <button onClick={handleModelSubmit} className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <Save size={14} />
                    {editingModelId ? 'Update Model' : 'Add Model'}
                  </button>
                </div>
              </div>

              {/* Models Table */}
              <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1e2a3a]">
                        {['Model', 'Specifications', 'Actions'].map((h) => (
                          <th key={h} className="text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {models.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-sm text-[#64748b]">No models defined yet</td>
                        </tr>
                      ) : (
                        models.map((model) => (
                          <tr key={model.id} className="border-b border-[#1e2a3a]/50 table-row-hover">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Smartphone size={14} className="text-[#c9a84c]" />
                                <span className="text-sm font-medium text-[#f0f0f0]">{model.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-[#94a3b8] line-clamp-1">{model.specifications}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {canEdit && (
                                  <button
                                    onClick={() => handleEditModel(model)}
                                    className="p-1.5 rounded-lg bg-[rgba(59,130,246,0.1)] text-[#3b82f6] hover:bg-[rgba(59,130,246,0.2)] transition-colors"
                                    title="Edit"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteModel(model.id)}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
