'use client';

import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Package,
  User,
  FileText,
  Smartphone,
  Layers,
  ArrowRight,
  Trash2,
  Save,
  Receipt,
  Minus,
  Plus,
  Calendar,
} from 'lucide-react';
import { useDataStore, useSettingsStore, useAuthStore } from '@/lib/store';
import { cn, formatCurrency, hasPermission, canDoAction } from '@/lib/utils';
import * as supabaseData from '@/lib/supabase-data';

interface CartItem {
  id: string;
  model: string;
  batchId: string;
  batchName: string;
  quantity: number;
  price: number;
}

export default function SalesPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const perms = currentUser?.role?.permissions || [];
  const canCreate = canDoAction(perms, 'sales', 'create');
  const canDelete = canDoAction(perms, 'sales', 'delete');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invoice, setInvoice] = useState(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [showHistory, setShowHistory] = useState(!canCreate);

  // Line item form
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(45000);
  const [cart, setCart] = useState<CartItem[]>([]);

  const parties = useDataStore((state) => state.parties);
  const sales = useDataStore((state) => state.sales);
  const addSale = useDataStore((state) => state.addSale);
  const updateBatch = useDataStore((state) => state.updateBatch);
  const batches = useDataStore((state) => state.batches);
  const models = useDataStore((state) => state.models);
  const currency = useSettingsStore((s) => s.settings.currency);

  // Unique model names from batches
  const modelNames = useMemo(() => {
    const names = [...new Set(batches.map((b) => b.modelName))];
    return names;
  }, [batches]);

  // Batches for selected model with sellable stock
  const modelBatches = useMemo(() => {
    if (!selectedModel) return [];
    return batches.filter((b) => b.modelName === selectedModel && b.sellable > 0);
  }, [batches, selectedModel]);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  const addToCart = () => {
    if (!selectedModel) { setError('Please select a model'); return; }
    if (!selectedBatchId) { setError('Please select a batch'); return; }
    if (quantity <= 0) { setError('Please enter quantity'); return; }
    if (selectedBatch && quantity > selectedBatch.sellable) {
      setError(`Only ${selectedBatch.sellable} units available in this batch`);
      return;
    }

    const batch = batches.find((b) => b.id === selectedBatchId);
    if (!batch) return;

    const existing = cart.find((c) => c.batchId === selectedBatchId);
    if (existing) {
      setCart(cart.map((c) =>
        c.batchId === selectedBatchId
          ? { ...c, quantity: c.quantity + quantity }
          : c
      ));
    } else {
      setCart([...cart, {
        id: `${Date.now()}`,
        model: selectedModel,
        batchId: selectedBatchId,
        batchName: batch.name,
        quantity,
        price: unitPrice,
      }]);
    }

    setError('');
    setSuccess(`Added ${quantity} x ${selectedModel} to cart`);
    setSelectedBatchId('');
    setQuantity(1);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((c) => c.id !== id));
  };

  const handleDispatch = async () => {
    if (!selectedPartyId) { setError('Please select a party'); return; }
    if (cart.length === 0) { setError('No items in cart'); return; }

    const party = parties.find((p) => p.id === selectedPartyId);
    if (!party) return;

    const totalAmount = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const saleItems = cart.map((item, idx) => ({
      id: `${Date.now()}-${idx}`,
      imei: `BULK-${item.batchId}-${Date.now()}-${idx}`,
      model: item.model,
      batch: item.batchName,
      price: item.price,
    }));

    try {
      const newSale = await supabaseData.addSale({
        invoice,
        partyId: selectedPartyId,
        partyName: party.name,
        date: saleDate,
        items: saleItems,
        totalAmount,
        status: 'completed',
      });
      addSale(newSale);

      // Update batch stock in Supabase
      await Promise.all(cart.map(async (item) => {
        const batch = batches.find((b) => b.id === item.batchId);
        if (batch) {
          await supabaseData.updateBatch(item.batchId, {
            dispatched: batch.dispatched + item.quantity,
            sellable: Math.max(0, batch.sellable - item.quantity),
          });
          updateBatch(item.batchId, {
            dispatched: batch.dispatched + item.quantity,
            sellable: Math.max(0, batch.sellable - item.quantity),
          });
        }
      }));

      setSuccess(`Invoice ${invoice} dispatched successfully!`);
      setError('');
      setCart([]);
      setInvoice(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
      setSelectedPartyId('');
      setSelectedModel('');
      setSelectedBatchId('');
      setQuantity(1);
    } catch (err) {
      console.error('Failed to dispatch sale:', err);
      setError('Failed to save sale. Please try again.');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const cartQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f0f0]">Sales / Dispatch</h1>
            <p className="text-sm text-[#94a3b8] mt-1">{canCreate ? 'Record sales and dispatch to parties' : 'View sales history'}</p>
          </div>
          {canCreate && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="btn-outline btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <Receipt size={16} />
                {showHistory ? 'New Sale' : 'History'}
              </button>
            </div>
          )}
        </div>
      
      {showHistory ? (
                  <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e2a3a]">
              <h3 className="text-sm font-semibold text-[#f0f0f0]">Recent Sales ({sales.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e2a3a]">
                    {['Invoice', 'Party', 'Date', 'Items', 'Total', 'Status'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-[#1e2a3a]/50 table-row-hover">
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-[#c9a84c]">{sale.invoice}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#f0f0f0]">{sale.partyName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#94a3b8]">{sale.date}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#94a3b8]">{sale.items.length}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-[#f0f0f0]">{formatCurrency(sale.totalAmount, currency)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', sale.status === 'completed' && 'badge-success', sale.status === 'pending' && 'badge-warning', sale.status === 'cancelled' && 'badge-danger')}>
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
              ) : (
        <>
          {/* Invoice Info */}
                      <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User size={14} className="text-[#c9a84c]" />
                  <span className="text-xs text-[#64748b]">Party</span>
                </div>
                <select
                  value={selectedPartyId}
                  onChange={(e) => setSelectedPartyId(e.target.value)}
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
                  <span className="text-xs text-[#64748b]">Invoice</span>
                </div>
                <input
                  type="text"
                  value={invoice}
                  onChange={(e) => setInvoice(e.target.value)}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                />
              </div>

              <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-[#c9a84c]" />
                  <span className="text-xs text-[#64748b]">Date</span>
                </div>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                />
              </div>
            </div>
          
          {/* Add Item */}
                      <div className="bg-gradient-to-br from-[#0f1525] to-[#0d1321] border border-[#1e2a3a] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[#f0f0f0] mb-4">Add Item</h3>
              <div className="grid md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => { setSelectedModel(e.target.value); setSelectedBatchId(''); }}
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                  >
                    <option value="">Select Model</option>
                    {modelNames.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Batch</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    disabled={!selectedModel}
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field disabled:opacity-50"
                  >
                    <option value="">Select Batch</option>
                    {modelBatches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.sellable} avail)</option>
                    ))}
                  </select>
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

                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Unit Price (Rs)</label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                  />
                </div>

                <div>
                  <button onClick={addToCart} className="btn-primary btn-press w-full px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                    <Package size={16} />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          
          {/* Cart */}
                      <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1e2a3a] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#f0f0f0]">Cart Items ({cartQty})</h3>
                <span className="text-xs text-[#94a3b8]">Total: {formatCurrency(cartTotal, currency)}</span>
              </div>

              {cart.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1e2a3a]">
                        {['#', 'Model', 'Batch', 'Qty', 'Unit Price', 'Total', ''].map((header) => (
                          <th key={header} className="text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider px-4 py-2">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, index) => (
                        <tr key={item.id} className="border-b border-[#1e2a3a]/50">
                          <td className="px-4 py-2"><span className="text-xs text-[#64748b]">{index + 1}</span></td>
                          <td className="px-4 py-2"><span className="text-sm text-[#f0f0f0]">{item.model}</span></td>
                          <td className="px-4 py-2"><span className="text-sm font-mono text-[#94a3b8]">{item.batchName}</span></td>
                          <td className="px-4 py-2"><span className="text-sm text-[#f0f0f0]">{item.quantity}</span></td>
                          <td className="px-4 py-2"><span className="text-sm text-[#94a3b8]">{formatCurrency(item.price, currency)}</span></td>
                          <td className="px-4 py-2"><span className="text-sm font-medium text-[#f0f0f0]">{formatCurrency(item.quantity * item.price, currency)}</span></td>
                          <td className="px-4 py-2">
                            {canDelete && (
                              <button onClick={() => removeFromCart(item.id)} className="text-[#ef4444] hover:text-[#f87171] transition-colors">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package size={32} className="text-[#1e2a3a] mx-auto mb-3" />
                  <p className="text-sm text-[#64748b]">No items in cart. Add items above to build your invoice.</p>
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

          {/* Action Buttons */}
          {cart.length > 0 && (
                          <div className="flex justify-end gap-3">
                <button onClick={() => { setCart([]); setError(''); setSuccess(''); }} className="btn-outline btn-press px-6 py-2.5 rounded-lg text-sm">
                  Clear All
                </button>
                <button onClick={handleDispatch} className="btn-primary btn-press px-6 py-2.5 rounded-lg text-sm flex items-center gap-2">
                  <Save size={16} />
                  Complete Dispatch
                  <ArrowRight size={16} />
                </button>
              </div>
                      )}
        </>
      )}
    </div>
  );
}
