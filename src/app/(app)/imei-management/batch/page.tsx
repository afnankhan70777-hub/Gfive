'use client';

import { useState } from 'react';
import {
  Layers,
  Package,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Wrench,
  Trash2,
  Warehouse,
} from 'lucide-react';
import { useDataStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function BatchPage() {
  const batches = useDataStore((state) => state.batches);
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');

  // Sync selected batch when batches change
  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  if (!selectedBatch) {
    return (
      <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#f0f0f0]">Batch Intelligence</h1>
              <p className="text-sm text-[#94a3b8] mt-1">Track production flow and batch distribution</p>
            </div>
          </div>
                <div className="text-center py-12 bg-[#0f1525] border border-[#1e2a3a] rounded-xl">
          <Layers size={32} className="text-[#1e2a3a] mx-auto mb-3" />
          <p className="text-sm text-[#64748b]">No batches found. Create a batch in Production first.</p>
        </div>
      </div>
    );
  }

  const flowSteps = [
    { label: 'Original Batch', value: selectedBatch.originalQuantity, icon: Layers, color: '#3b82f6' },
    { label: 'Produced', value: selectedBatch.produced, icon: Package, color: '#22c55e' },
    { label: 'Packed', value: selectedBatch.packed, icon: Package, color: '#8b5cf6' },
    { label: 'Dispatched', value: selectedBatch.dispatched, icon: ArrowRight, color: '#06b6d4' },
    { label: 'Returns', value: selectedBatch.returns, icon: TrendingDown, color: '#ef4444' },
  ];

  const qcOutcomes = [
    { label: 'Good Returns', value: selectedBatch.goodReturns, icon: CheckCircle2, color: 'text-[#22c55e]', bg: 'bg-[rgba(34,197,94,0.1)]' },
    { label: 'Repair', value: selectedBatch.repair, icon: Wrench, color: 'text-[#f59e0b]', bg: 'bg-[rgba(245,158,11,0.1)]' },
    { label: 'Scrap', value: selectedBatch.scrap, icon: Trash2, color: 'text-[#ef4444]', bg: 'bg-[rgba(239,68,68,0.1)]' },
  ];

  return (
    <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f0f0]">Batch Intelligence</h1>
            <p className="text-sm text-[#94a3b8] mt-1">Track production flow and batch distribution</p>
          </div>
          <select
            value={selectedBatch.id}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="bg-[#0f1525] border border-[#1e2a3a] rounded-lg px-4 py-2 text-sm text-[#f0f0f0]"
          >
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name} - {batch.modelName}
              </option>
            ))}
          </select>
        </div>
      
      {/* Batch Header */}
              <div className="bg-gradient-to-br from-[#0f1525] to-[#0d1321] border border-[#1e2a3a] rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#a88a3a] flex items-center justify-center">
              <Layers size={24} className="text-[#0a0e1a]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#f0f0f0]">{selectedBatch.modelName}</h2>
              <p className="text-sm text-[#94a3b8]">Batch: {selectedBatch.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Original', value: selectedBatch.originalQuantity },
              { label: 'Produced', value: selectedBatch.produced },
              { label: 'Dispatched', value: selectedBatch.dispatched },
              { label: 'Warehouse', value: selectedBatch.warehouse },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#0d1321] rounded-lg p-3">
                <span className="text-[10px] text-[#64748b] uppercase">{stat.label}</span>
                <div className="text-xl font-bold text-[#f0f0f0]">{stat.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      
      {/* Flow Visualization */}
              <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#f0f0f0] mb-6">Production Flow</h3>
          <div className="flex flex-col md:flex-row items-center gap-4">
            {flowSteps.map((step, index) => (
              <div key={step.label} className="flex flex-col md:flex-row items-center gap-4 flex-1">
                <div className="flex-1 text-center">
                  <div
                    className="w-14 h-14 rounded-xl mx-auto mb-2 flex items-center justify-center"
                    style={{ backgroundColor: `${step.color}20`, border: `1px solid ${step.color}40` }}
                  >
                    <step.icon size={24} style={{ color: step.color }} />
                  </div>
                  <div className="text-lg font-bold text-[#f0f0f0]">
                    {step.value.toLocaleString()}
                  </div>
                  <span className="text-xs text-[#64748b]">{step.label}</span>
                </div>
                {index < flowSteps.length - 1 && (
                  <div className="hidden md:flex items-center">
                    <ArrowRight size={20} className="text-[#1e2a3a]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      
      {/* QC Outcomes */}
              <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#f0f0f0] mb-4">Returns QC Distribution</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {qcOutcomes.map((outcome, index) => (
              <div
                key={outcome.label}
                className={cn(
                  'p-4 rounded-xl border',
                  outcome.bg,
                  'border-opacity-20'
                )}
                style={{ borderColor: outcome.color.replace('text-', '') }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <outcome.icon size={20} className={outcome.color} />
                  <span className={cn('text-sm font-medium', outcome.color)}>{outcome.label}</span>
                </div>
                <div className="text-2xl font-bold text-[#f0f0f0]">{outcome.value.toLocaleString()}</div>
                <div className="mt-2 h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${selectedBatch.returns > 0 ? (outcome.value / selectedBatch.returns) * 100 : 0}%`,
                      backgroundColor: outcome.color.includes('22c55e')
                        ? '#22c55e'
                        : outcome.color.includes('f59e0b')
                        ? '#f59e0b'
                        : '#ef4444',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
          </div>
  );
}
