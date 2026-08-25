'use client';

import { useState } from 'react';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Download,
  Search,
  ArrowUpDown,
  Factory,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Minus,
  PlusCircle,
  Layers,
  Smartphone,
} from 'lucide-react';
import { useDataStore, useAuthStore } from '@/lib/store';
import { cn, canDoAction } from '@/lib/utils';
import * as supabaseData from '@/lib/supabase-data';

interface ComponentFormData {
  name: string;
  supplier: string;
  purchaseBatch: string;
  quantityReceived: number;
  quantityConsumed: number;
  warehouse: string;
  lowStockThreshold: number;
}

const initialFormData: ComponentFormData = {
  name: '',
  supplier: '',
  purchaseBatch: '',
  quantityReceived: 0,
  quantityConsumed: 0,
  warehouse: '',
  lowStockThreshold: 100,
};

export default function PartsInventoryPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const perms = currentUser?.role?.permissions || [];
  const canCreate = canDoAction(perms, 'inventory', 'create');
  const canEdit = canDoAction(perms, 'inventory', 'edit');
  const canDelete = canDoAction(perms, 'inventory', 'delete');
  const [activeTab, setActiveTab] = useState<'inventory' | 'bom'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ComponentFormData>(initialFormData);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  // BOM state
  const [showBOMModal, setShowBOMModal] = useState(false);
  const [editingBOMId, setEditingBOMId] = useState<string | null>(null);
  const [bomModelId, setBomModelId] = useState('');
  const [bomComponentId, setBomComponentId] = useState('');
  const [bomQtyPerUnit, setBomQtyPerUnit] = useState(1);

  const components = useDataStore((state) => state.components);
  const addComponent = useDataStore((state) => state.addComponent);
  const updateComponent = useDataStore((state) => state.updateComponent);
  const deleteComponent = useDataStore((state) => state.deleteComponent);
  const adjustStock = useDataStore((state) => state.adjustStock);

  const bomItems = useDataStore((state) => state.bomItems);
  const models = useDataStore((state) => state.models);
  const addBOMItem = useDataStore((state) => state.addBOMItem);
  const updateBOMItem = useDataStore((state) => state.updateBOMItem);
  const deleteBOMItem = useDataStore((state) => state.deleteBOMItem);

  const filteredComponents = components.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.warehouse.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalReceived = components.reduce((sum, c) => sum + c.quantityReceived, 0);
  const totalConsumed = components.reduce((sum, c) => sum + c.quantityConsumed, 0);
  const totalAvailable = components.reduce((sum, c) => sum + c.available, 0);
  const lowStockCount = components.filter((c) => c.status === 'low-stock').length;
  const outOfStockCount = components.filter((c) => c.status === 'out-of-stock').length;

  const handleAdd = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleEdit = (component: typeof components[0]) => {
    setEditingId(component.id);
    setFormData({
      name: component.name,
      supplier: component.supplier,
      purchaseBatch: component.purchaseBatch,
      quantityReceived: component.quantityReceived,
      quantityConsumed: component.quantityConsumed,
      warehouse: component.warehouse,
      lowStockThreshold: component.lowStockThreshold,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this component?')) {
      try {
        await supabaseData.deleteComponent(id);
        deleteComponent(id);
      } catch (err) {
        console.error('Failed to delete component:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await supabaseData.updateComponent(editingId, { ...formData });
        updateComponent(editingId, { ...formData });
      } else {
        const newComponent = await supabaseData.addComponent({ ...formData });
        addComponent(newComponent);
      }
      setShowModal(false);
      setFormData(initialFormData);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to save component:', err);
    }
  };

  const handleAdjust = (id: string) => {
    setAdjustingId(id);
    setAdjustQuantity(0);
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const submitAdjust = async () => {
    if (adjustingId && adjustQuantity !== 0) {
      try {
        await supabaseData.adjustStock(adjustingId, adjustQuantity, adjustReason || 'Manual adjustment');
        adjustStock(adjustingId, adjustQuantity, adjustReason || 'Manual adjustment');
        setShowAdjustModal(false);
        setAdjustingId(null);
        setAdjustQuantity(0);
        setAdjustReason('');
      } catch (err) {
        console.error('Failed to adjust stock:', err);
      }
    }
  };

  const handleExport = () => {
    const csv = [
      ['Component', 'Supplier', 'Purchase Batch', 'Received', 'Consumed', 'Available', 'Warehouse', 'Status'].join(','),
      ...components.map(c =>
        [c.name, c.supplier, c.purchaseBatch, c.quantityReceived, c.quantityConsumed, c.available, c.warehouse, c.status].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parts-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f0f0]">Parts Inventory</h1>
            <p className="text-sm text-[#94a3b8] mt-1">Track imported components and stock levels</p>
          </div>
          <div className="flex items-center gap-3">
            {canCreate && (
              <button onClick={handleAdd} className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Plus size={16} />
                Add Component
              </button>
            )}
            <button onClick={handleExport} className="btn-outline btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e2a3a]">
        <button
          onClick={() => setActiveTab('inventory')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'inventory'
              ? 'text-[#c9a84c] border-[#c9a84c]'
              : 'text-[#64748b] border-transparent hover:text-[#94a3b8]'
          )}
        >
          <div className="flex items-center gap-2">
            <Package size={14} />
            Parts Inventory
          </div>
        </button>
        <button
          onClick={() => setActiveTab('bom')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'bom'
              ? 'text-[#c9a84c] border-[#c9a84c]'
              : 'text-[#64748b] border-transparent hover:text-[#94a3b8]'
          )}
        >
          <div className="flex items-center gap-2">
            <Layers size={14} />
            BOM Management
          </div>
        </button>
      </div>

      {activeTab === 'inventory' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Received', value: totalReceived, icon: Package, color: 'text-[#3b82f6]' },
          { label: 'Total Consumed', value: totalConsumed, icon: Factory, color: 'text-[#f59e0b]' },
          { label: 'Available Stock', value: totalAvailable, icon: Package, color: 'text-[#22c55e]' },
          { label: 'Low/Out Stock', value: lowStockCount + outOfStockCount, icon: AlertTriangle, color: 'text-[#ef4444]' },
        ].map((stat) => (
                      <div key={stat.label} className="stat-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold tracking-wider text-[#64748b] uppercase">{stat.label}</span>
                <stat.icon size={16} className={stat.color} />
              </div>
              <div className="text-2xl font-bold text-[#f0f0f0]">{stat.value.toLocaleString()}</div>
            </div>
                  ))}
            </div>
      
      {/* Search */}
              <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            placeholder="Search components, suppliers, or warehouses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0f1525] border border-[#1e2a3a] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#f0f0f0] placeholder-[#64748b] input-field focus:border-[#c9a84c]/50 transition-colors"
          />
        </div>
      
      {/* Components Table */}
              <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2a3a]">
                  {['Component', 'Supplier', 'Purchase Batch', 'Received', 'Consumed', 'Available', 'Threshold', 'Warehouse', 'Status', 'Actions'].map((header) => (
                    <th
                      key={header}
                      className="text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider px-4 py-3"
                    >
                      <div className="flex items-center gap-1">
                        {header}
                        {header !== 'Actions' && <ArrowUpDown size={10} className="text-[#1e2a3a]" />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredComponents.map((component) => {
                  const stockPercent = component.quantityReceived > 0
                    ? Math.min(100, (component.available / component.quantityReceived) * 100)
                    : 0;
                  const thresholdPercent = component.quantityReceived > 0
                    ? Math.min(100, ((component.lowStockThreshold || 100) / component.quantityReceived) * 100)
                    : 0;
                  return (
                    <tr
                      key={component.id}
                      className="border-b border-[#1e2a3a]/50 table-row-hover"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-[#f0f0f0]">{component.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#94a3b8]">{component.supplier}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-[#c9a84c]">{component.purchaseBatch}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#94a3b8]">{component.quantityReceived.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#94a3b8]">{component.quantityConsumed.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className="text-sm font-medium text-[#f0f0f0]">{component.available.toLocaleString()}</span>
                          <div className="w-24 h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden relative">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                component.status === 'in-stock' && 'bg-[#22c55e]',
                                component.status === 'low-stock' && 'bg-[#f59e0b]',
                                component.status === 'out-of-stock' && 'bg-[#ef4444]'
                              )}
                              style={{ width: `${stockPercent}%` }}
                            />
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-[#ef4444]"
                              style={{ left: `${thresholdPercent}%` }}
                              title="Low stock threshold"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#64748b]">{(component.lowStockThreshold || 100).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#94a3b8]">{component.warehouse}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                            component.status === 'in-stock' && 'badge-success',
                            component.status === 'low-stock' && 'badge-warning',
                            component.status === 'out-of-stock' && 'badge-danger'
                          )}
                        >
                          {component.status === 'in-stock' && (
                            <>
                              <Package size={10} className="mr-1" />
                              In Stock
                            </>
                          )}
                          {component.status === 'low-stock' && (
                            <>
                              <TrendingDown size={10} className="mr-1" />
                              Low Stock
                            </>
                          )}
                          {component.status === 'out-of-stock' && (
                            <>
                              <AlertTriangle size={10} className="mr-1" />
                              Out of Stock
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAdjust(component.id)}
                            className="p-1.5 rounded-md text-[#3b82f6] hover:bg-[rgba(59,130,246,0.1)] transition-colors"
                            title="Adjust Stock"
                          >
                            <PlusCircle size={14} />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(component)}
                              className="p-1.5 rounded-md text-[#c9a84c] hover:bg-[rgba(201,168,76,0.1)] transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(component.id)}
                              className="p-1.5 rounded-md text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                              title="Delete"
                            >
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
        </div>
      </>
      )}

      {/* BOM Tab */}
      {activeTab === 'bom' && (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#f0f0f0]">Bill of Materials</h2>
                <p className="text-sm text-[#94a3b8] mt-1">Define parts required per model</p>
              </div>
              <button
                onClick={() => {
                  setEditingBOMId(null);
                  setBomModelId('');
                  setBomComponentId('');
                  setBomQtyPerUnit(1);
                  setShowBOMModal(true);
                }}
                className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <Plus size={16} />
                Add BOM Entry
              </button>
            </div>
          
                      <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e2a3a]">
                      {['Model', 'Component', 'Qty per Unit', 'Actions'].map((header) => (
                        <th
                          key={header}
                          className="text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider px-4 py-3"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bomItems.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-[#64748b]">
                          No BOM entries defined yet
                        </td>
                      </tr>
                    )}
                    {bomItems.map((item) => {
                      const model = models.find((m) => m.id === item.modelId);
                      const component = components.find((c) => c.id === item.componentId);
                      return (
                        <tr key={item.id} className="border-b border-[#1e2a3a]/50 table-row-hover">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Smartphone size={14} className="text-[#c9a84c]" />
                              <span className="text-sm font-medium text-[#f0f0f0]">{model?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Package size={14} className="text-[#3b82f6]" />
                              <span className="text-sm text-[#94a3b8]">{component?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-mono text-[#c9a84c]">{item.quantityPerUnit}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {canEdit && (
                                <button
                                  onClick={() => {
                                    setEditingBOMId(item.id);
                                    setBomModelId(item.modelId);
                                    setBomComponentId(item.componentId);
                                    setBomQtyPerUnit(item.quantityPerUnit);
                                    setShowBOMModal(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-[rgba(59,130,246,0.1)] text-[#3b82f6] hover:bg-[rgba(59,130,246,0.2)] transition-colors"
                                  title="Edit"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this BOM entry?')) {
                                      deleteBOMItem(item.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.2)] transition-colors"
                                  title="Delete"
                                >
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
            </div>
          
          {/* BOM Modal */}
          {showBOMModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-[#1e2a3a]">
                  <h3 className="text-sm font-semibold text-[#f0f0f0]">
                    {editingBOMId ? 'Edit BOM Entry' : 'Add BOM Entry'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowBOMModal(false);
                      setEditingBOMId(null);
                    }}
                    className="text-[#64748b] hover:text-[#f0f0f0]"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs text-[#94a3b8] mb-1">Model</label>
                    <select
                      value={bomModelId}
                      onChange={(e) => setBomModelId(e.target.value)}
                      className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                    >
                      <option value="">Select Model</option>
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#94a3b8] mb-1">Component</label>
                    <select
                      value={bomComponentId}
                      onChange={(e) => setBomComponentId(e.target.value)}
                      className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                    >
                      <option value="">Select Component</option>
                      {components.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#94a3b8] mb-1">Quantity per Unit</label>
                    <input
                      type="number"
                      min={1}
                      value={bomQtyPerUnit}
                      onChange={(e) => setBomQtyPerUnit(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowBOMModal(false);
                        setEditingBOMId(null);
                      }}
                      className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-[#f0f0f0]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!bomModelId || !bomComponentId) return;
                        try {
                          if (editingBOMId) {
                            await supabaseData.updateBOMItem(editingBOMId, {
                              modelId: bomModelId,
                              componentId: bomComponentId,
                              quantityPerUnit: bomQtyPerUnit,
                            });
                            updateBOMItem(editingBOMId, {
                              modelId: bomModelId,
                              componentId: bomComponentId,
                              quantityPerUnit: bomQtyPerUnit,
                            });
                          } else {
                            const newBOM = await supabaseData.addBOMItem({
                              modelId: bomModelId,
                              componentId: bomComponentId,
                              quantityPerUnit: bomQtyPerUnit,
                            });
                            addBOMItem(newBOM);
                          }
                          setShowBOMModal(false);
                          setEditingBOMId(null);
                          setBomModelId('');
                          setBomComponentId('');
                          setBomQtyPerUnit(1);
                        } catch (err) {
                          console.error('Failed to save BOM item:', err);
                        }
                      }}
                      className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                    >
                      <Save size={14} />
                      {editingBOMId ? 'Update' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#f0f0f0]">
                {editingId ? 'Edit Component' : 'Add Component'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#64748b] hover:text-[#f0f0f0] transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-[#94a3b8] mb-1">Component Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-1">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-1">Purchase Batch</label>
                  <input
                    type="text"
                    value={formData.purchaseBatch}
                    onChange={(e) => setFormData({ ...formData, purchaseBatch: e.target.value })}
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-1">Quantity Received</label>
                  <input
                    type="number"
                    value={formData.quantityReceived}
                    onChange={(e) => setFormData({ ...formData, quantityReceived: Number(e.target.value) })}
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-1">Quantity Consumed</label>
                  <input
                    type="number"
                    value={formData.quantityConsumed}
                    onChange={(e) => setFormData({ ...formData, quantityConsumed: Number(e.target.value) })}
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                    required
                  />
                  <p className="text-xs text-[#64748b] mt-1">Alert when available drops below this</p>
                </div>
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-1">Warehouse</label>
                  <input
                    type="text"
                    value={formData.warehouse}
                    onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                    required
                  />
                </div>
                <div className="col-span-2 bg-[#0d1321] border border-[#1e2a3a] rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#94a3b8]">Available (Auto-calculated):</span>
                    <span className="font-mono font-medium text-[#f0f0f0]">
                      {Math.max(0, formData.quantityReceived - formData.quantityConsumed).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-[#94a3b8]">Status (Auto-calculated):</span>
                    <span className={cn(
                      'text-xs font-medium',
                      Math.max(0, formData.quantityReceived - formData.quantityConsumed) <= 0 ? 'text-[#ef4444]' :
                      Math.max(0, formData.quantityReceived - formData.quantityConsumed) <= formData.lowStockThreshold ? 'text-[#f59e0b]' : 'text-[#22c55e]'
                    )}>
                      {Math.max(0, formData.quantityReceived - formData.quantityConsumed) <= 0 ? 'Out of Stock' :
                       Math.max(0, formData.quantityReceived - formData.quantityConsumed) <= formData.lowStockThreshold ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-[#f0f0f0] transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <Save size={16} />
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#f0f0f0]">Adjust Stock</h2>
              <button onClick={() => setShowAdjustModal(false)} className="text-[#64748b] hover:text-[#f0f0f0] transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">Adjustment Quantity (+/-)</label>
                <input
                  type="number"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                  placeholder="e.g. 100 or -50"
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                />
                <p className="text-xs text-[#64748b] mt-1">Use positive to add stock, negative to remove</p>
              </div>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">Reason</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. New shipment received"
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-[#f0f0f0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAdjust}
                  className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  <Save size={16} />
                  Adjust
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
