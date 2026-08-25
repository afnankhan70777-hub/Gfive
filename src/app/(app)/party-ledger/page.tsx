'use client';

import { useState } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Smartphone,
  RotateCcw,
  Search,
  ChevronRight,
  FileText,
  CreditCard,
  ArrowUpDown,
  Plus,
  X,
  Save,
} from 'lucide-react';
import { useDataStore, useSettingsStore, useAuthStore } from '@/lib/store';
import { cn, formatCurrencyCompact, canDoAction } from '@/lib/utils';
import * as supabaseData from '@/lib/supabase-data';

export default function PartyLedgerPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const perms = currentUser?.role?.permissions || [];
  const canCreate = canDoAction(perms, 'parties', 'create');
  const canEdit = canDoAction(perms, 'parties', 'edit');
  const canDelete = canDoAction(perms, 'parties', 'delete');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  const parties = useDataStore((state) => state.parties);
  const sales = useDataStore((state) => state.sales);
  const returns = useDataStore((state) => state.returns);
  const payments = useDataStore((state) => state.payments);
  const addPayment = useDataStore((state) => state.addPayment);
  const updateParty = useDataStore((state) => state.updateParty);
  const currency = useSettingsStore((s) => s.settings.currency);

  const filteredParties = parties.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedParty = parties.find((p) => p.id === selectedPartyId) || parties[0];

  // Build transaction history from sales, returns, and payments
  const partyTransactions = [
    ...sales
      .filter((s) => s.partyId === selectedParty?.id)
      .map((s) => ({
        id: `sale-${s.id}`,
        date: s.date,
        description: `Invoice ${s.invoice}`,
        reference: s.invoice,
        type: 'sale' as const,
        amount: s.totalAmount,
      })),
    ...returns
      .filter((r) => r.partyId === selectedParty?.id)
      .map((r) => ({
        id: `return-${r.id}`,
        date: r.returnDate,
        description: `Return ${r.returnNumber}`,
        reference: r.returnNumber,
        type: 'return' as const,
        amount: r.refundAmount,
      })),
    ...payments
      .filter((p) => p.partyId === selectedParty?.id)
      .map((p) => ({
        id: `payment-${p.id}`,
        date: p.date,
        description: p.notes || 'Payment received',
        reference: p.reference,
        type: 'payment' as const,
        amount: p.amount,
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handlePayment = async () => {
    if (!selectedParty || !paymentAmount) return;
    const amount = Number(paymentAmount);
    if (amount <= 0) return;

    try {
      const newPayment = await supabaseData.addPayment({
        partyId: selectedParty.id,
        partyName: selectedParty.name,
        amount,
        date: new Date().toISOString().split('T')[0],
        method: paymentMethod as 'cash' | 'bank' | 'cheque',
        reference: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: paymentNotes || 'Payment received',
      });
      addPayment(newPayment);

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (err) {
      console.error('Failed to add payment:', err);
    }
  };

  return (
    <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f0f0]">Party Ledger</h1>
            <p className="text-sm text-[#94a3b8] mt-1">Financial and inventory overview by party</p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search parties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0f1525] border border-[#1e2a3a] rounded-lg pl-10 pr-4 py-2 text-sm text-[#f0f0f0] placeholder-[#64748b] input-field"
            />
          </div>
        </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Party List */}
                  <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e2a3a]">
              <h3 className="text-sm font-semibold text-[#f0f0f0]">Parties ({filteredParties.length})</h3>
            </div>
            <div className="divide-y divide-[#1e2a3a]/50">
              {filteredParties.map((party) => (
                <button
                  key={party.id}
                  onClick={() => setSelectedPartyId(party.id)}
                  className={cn(
                    'w-full px-4 py-3 text-left transition-colors',
                    selectedParty?.id === party.id
                      ? 'bg-[rgba(201,168,76,0.08)]'
                      : 'hover:bg-[rgba(201,168,76,0.04)]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-[#f0f0f0]">{party.name}</span>
                      <p className="text-xs text-[#64748b] mt-0.5">{party.contact}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-[#f0f0f0]">
                        Rs. {(party.totalSales / 100000).toFixed(1)}L
                      </span>
                      <span
                        className={cn(
                          'text-xs block mt-0.5',
                          party.outstanding > 1000000 ? 'text-[#ef4444]' : 'text-[#22c55e]'
                        )}
                      >
                        Rs. {(party.outstanding / 100000).toFixed(1)}L due
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        
        {/* Party Details */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Party Header */}
            <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#f0f0f0]">{selectedParty?.name}</h2>
                  <p className="text-sm text-[#94a3b8] mt-1">{selectedParty?.address}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-[#64748b]">{selectedParty?.phone}</span>
                    <span className="text-xs text-[#64748b]">{selectedParty?.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      selectedParty?.status === 'active' ? 'badge-success' : 'badge-danger'
                    )}
                  >
                    {selectedParty?.status?.toUpperCase()}
                  </span>
                  {canCreate && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="btn-primary btn-press px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                    >
                      <Plus size={12} />
                      Payment
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  label: 'Total Sales',
                  value: formatCurrencyCompact(selectedParty?.totalSales || 0, currency),
                  icon: TrendingUp,
                  color: 'text-[#22c55e]',
                },
                {
                  label: 'Payments Received',
                  value: formatCurrencyCompact(selectedParty?.paymentsReceived || 0, currency),
                  icon: DollarSign,
                  color: 'text-[#3b82f6]',
                },
                {
                  label: 'Outstanding',
                  value: formatCurrencyCompact(selectedParty?.outstanding || 0, currency),
                  icon: TrendingDown,
                  color: 'text-[#ef4444]',
                },
                {
                  label: 'Return Value',
                  value: formatCurrencyCompact(selectedParty?.returnValue || 0, currency),
                  icon: RotateCcw,
                  color: 'text-[#f59e0b]',
                },
                {
                  label: 'Net Receivable',
                  value: formatCurrencyCompact(selectedParty?.netReceivable || 0, currency),
                  icon: CreditCard,
                  color: 'text-[#c9a84c]',
                },
                {
                  label: 'Credit Limit',
                  value: formatCurrencyCompact(selectedParty?.creditLimit || 0, currency),
                  icon: FileText,
                  color: 'text-[#8b5cf6]',
                },
              ].map((stat) => (
                <div key={stat.label} className="stat-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon size={14} className={stat.color} />
                    <span className="text-[10px] text-[#64748b] uppercase">{stat.label}</span>
                  </div>
                  <span className="text-lg font-bold text-[#f0f0f0]">{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Inventory Overview */}
            <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[#f0f0f0] mb-4">Inventory Overview</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <Smartphone size={20} className="text-[#3b82f6] mx-auto mb-2" />
                  <div className="text-xl font-bold text-[#f0f0f0]">{(selectedParty?.phonesSold || 0).toLocaleString()}</div>
                  <div className="text-xs text-[#64748b]">Phones Sold</div>
                </div>
                <div className="text-center">
                  <RotateCcw size={20} className="text-[#ef4444] mx-auto mb-2" />
                  <div className="text-xl font-bold text-[#f0f0f0]">{(selectedParty?.phonesReturned || 0).toLocaleString()}</div>
                  <div className="text-xs text-[#64748b]">Phones Returned</div>
                </div>
                <div className="text-center">
                  <Users size={20} className="text-[#22c55e] mx-auto mb-2" />
                  <div className="text-xl font-bold text-[#f0f0f0]">
                    {((selectedParty?.phonesSold || 0) - (selectedParty?.phonesReturned || 0)).toLocaleString()}
                  </div>
                  <div className="text-xs text-[#64748b]">Net Phones</div>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1e2a3a] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#f0f0f0]">Recent Transactions</h3>
                <span className="text-xs text-[#64748b]">{partyTransactions.length} records</span>
              </div>
              <div className="divide-y divide-[#1e2a3a]/50">
                {partyTransactions.length > 0 ? (
                  partyTransactions.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            tx.type === 'sale' && 'bg-[rgba(34,197,94,0.1)]',
                            tx.type === 'return' && 'bg-[rgba(239,68,68,0.1)]',
                            tx.type === 'payment' && 'bg-[rgba(59,130,246,0.1)]'
                          )}
                        >
                          {tx.type === 'sale' && <TrendingUp size={14} className="text-[#22c55e]" />}
                          {tx.type === 'return' && <RotateCcw size={14} className="text-[#ef4444]" />}
                          {tx.type === 'payment' && <DollarSign size={14} className="text-[#3b82f6]" />}
                        </div>
                        <div>
                          <span className="text-sm text-[#f0f0f0]">{tx.description}</span>
                          <p className="text-xs text-[#64748b]">{tx.date} · {tx.reference}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            tx.type === 'payment' || tx.type === 'sale' ? 'text-[#22c55e]' : 'text-[#ef4444]'
                          )}
                        >
                          {tx.type === 'payment' || tx.type === 'sale' ? '+' : '-'}{formatCurrencyCompact(tx.amount, currency)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText size={24} className="text-[#1e2a3a] mx-auto mb-2" />
                    <p className="text-sm text-[#64748b]">No transactions yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
              </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedParty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#f0f0f0]">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-[#64748b] hover:text-[#f0f0f0] transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-[#0d1321] border border-[#1e2a3a] rounded-lg p-3">
                <span className="text-xs text-[#64748b]">Outstanding Balance</span>
                <div className="text-xl font-bold text-[#ef4444]">Rs. {selectedParty.outstanding.toLocaleString()}</div>
              </div>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] input-field"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-[#f0f0f0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  <Save size={16} />
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
