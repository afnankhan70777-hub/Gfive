'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart,
} from 'recharts';
import {
  Download, TrendingUp, Package, RotateCcw, Wrench,
  FileText, Factory, DollarSign, AlertTriangle, CheckCircle2,
  Zap, Activity, BarChart3, PieChart as PieChartIcon, Layers,
} from 'lucide-react';
import { useDataStore, useSettingsStore } from '@/lib/store';
import { cn, formatCurrencyCompact } from '@/lib/utils';

/* ─── theme-aware colour tokens ─── */
function useTokens() {
  const theme = useSettingsStore((s) => s.settings.appearance.theme);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const check = () => {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const active = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
      setIsLight(active === 'light');
    };
    check();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', check);
    return () => mq.removeEventListener?.('change', check);
  }, [theme]);

  return useMemo(() => {
    if (isLight) {
      return {
        isLight: true,
        gold: '#a88a3a',
        goldGlow: 'rgba(168,138,58,0.25)',
        cyan: '#0891b2',
        cyanGlow: 'rgba(8,145,178,0.25)',
        emerald: '#059669',
        emeraldGlow: 'rgba(5,150,105,0.25)',
        rose: '#e11d48',
        roseGlow: 'rgba(225,29,72,0.25)',
        violet: '#7c3aed',
        violetGlow: 'rgba(124,58,237,0.25)',
        amber: '#d97706',
        amberGlow: 'rgba(217,119,6,0.25)',
        slate: '#78716c',
        chartBg: '#ffffff',
        cardBg: '#ffffff',
        border: '#e8e2d9',
        textPrimary: '#1c1917',
        textSecondary: '#57534e',
        textMuted: '#78716c',
        grid: '#e8e2d9',
      };
    }
    return {
      isLight: false,
      gold: '#c9a84c',
      goldGlow: 'rgba(201,168,76,0.35)',
      cyan: '#06b6d4',
      cyanGlow: 'rgba(6,182,212,0.35)',
      emerald: '#10b981',
      emeraldGlow: 'rgba(16,185,129,0.35)',
      rose: '#f43f5e',
      roseGlow: 'rgba(244,63,94,0.35)',
      violet: '#8b5cf6',
      violetGlow: 'rgba(139,92,246,0.35)',
      amber: '#f59e0b',
      amberGlow: 'rgba(245,158,11,0.35)',
      slate: '#475569',
      chartBg: '#0b1120',
      cardBg: '#0f1525',
      border: '#1e2a3a',
      textPrimary: '#f0f0f0',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      grid: '#1e2a3a',
    };
  }, [isLight]);
}

const CHART_COLORS = [
  '#c9a84c', '#06b6d4', '#10b981', '#f43f5e',
  '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6',
];

type ReportTab = 'overview' | 'production' | 'sales' | 'returns' | 'inventory' | 'financial';

/* ─── animated counter ─── */
function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  useEffect(() => {
    fromRef.current = val;
    startRef.current = null;
    let raf: number;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(fromRef.current + (target - fromRef.current) * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return val;
}

/* ─── theme-aware tooltip ─── */
function FuturisticTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return (
    <div className={cn(
      'backdrop-blur-md rounded-lg px-4 py-3 shadow-xl',
      isLight ? 'bg-white/95 border border-[#e8e2d9]' : 'bg-[#0b1120]/90 border border-[#c9a84c]/20 shadow-black/50'
    )}>
      {label && <p className={cn('text-[11px] font-semibold tracking-wider uppercase mb-1.5', isLight ? 'text-[#78716c]' : 'text-[#64748b]')}>{label}</p>}
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color, boxShadow: isLight ? 'none' : `0 0 6px ${p.color}` }} />
            <span className={cn('text-xs', isLight ? 'text-[#57534e]' : 'text-[#94a3b8]')}>{p.name}:</span>
            <span className={cn('text-xs font-bold ml-auto', isLight ? 'text-[#1c1917]' : 'text-[#f0f0f0]')}>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── gradient defs helper ─── */
function ChartGradients({ idPrefix, colors }: { idPrefix: string; colors: string[] }) {
  return (
    <defs>
      {colors.map((c, i) => (
        <linearGradient key={i} id={`${idPrefix}-${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity={0.9} />
          <stop offset="100%" stopColor={c} stopOpacity={0.05} />
        </linearGradient>
      ))}
      <filter id="barGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const TOKENS = useTokens();

  const imeis = useDataStore((s) => s.imeis);
  const batches = useDataStore((s) => s.batches);
  const sales = useDataStore((s) => s.sales);
  const returns = useDataStore((s) => s.returns);
  const repairs = useDataStore((s) => s.repairOrders);
  const parties = useDataStore((s) => s.parties);
  const components = useDataStore((s) => s.components);
  const currency = useSettingsStore((s) => s.settings.currency);

  /* raw numbers */
  const totalProduced = imeis.filter((i) => i.status !== 'scrap').length;
  const totalSold = imeis.filter((i) => i.status === 'sold').length;
  const totalReturned = returns.length;
  const totalRepairs = repairs.length;
  const totalOutstanding = parties.reduce((sum, p) => sum + p.outstanding, 0);
  const lowStockCount = components.filter((c) => c.status === 'low-stock').length;
  const outOfStockCount = components.filter((c) => c.status === 'out-of-stock').length;

  /* animated counters */
  const animProduced = useCountUp(totalProduced);
  const animSold = useCountUp(totalSold);
  const animReturns = useCountUp(totalReturned);
  const animRepairs = useCountUp(totalRepairs);

  /* datasets */
  const batchProductionData = useMemo(() =>
    batches.map((b) => ({
      name: b.name,
      target: b.originalQuantity,
      produced: b.produced,
      packed: b.packed,
      dispatched: b.dispatched,
    })), [batches]
  );

  const modelBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    imeis.forEach((i) => { counts[i.model] = (counts[i.model] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [imeis]);

  const partySalesData = useMemo(() =>
    parties.map((p) => ({
      name: p.name,
      sales: p.totalSales,
      received: p.paymentsReceived,
      outstanding: p.outstanding,
    })), [parties]
  );

  const monthlySales = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const data = months.map((m) => ({ month: m, sales: 0, returns: 0 }));
    sales.forEach((s) => { const m = new Date(s.date).getMonth(); if (m >= 0 && m < 12) data[m].sales += s.totalAmount; });
    returns.forEach((r) => { const m = new Date(r.returnDate).getMonth(); if (m >= 0 && m < 12) data[m].returns += r.refundAmount; });
    return data;
  }, [sales, returns]);

  const qcOutcomeData = useMemo(() => {
    const good = returns.filter((r) => r.qcStatus === 'good').length;
    const repair = returns.filter((r) => r.qcStatus === 'repair').length;
    const scrap = returns.filter((r) => r.qcStatus === 'scrap').length;
    return [
      { name: 'Good', value: good, color: TOKENS.emerald },
      { name: 'Repair', value: repair, color: TOKENS.amber },
      { name: 'Scrap', value: scrap, color: TOKENS.rose },
    ];
  }, [returns]);

  const topReturnReasons = useMemo(() => {
    const reasons: Record<string, number> = {};
    returns.forEach((r) => { reasons[r.reason] = (reasons[r.reason] || 0) + 1; });
    return Object.entries(reasons).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [returns]);

  const componentStockData = useMemo(() =>
    components.map((c) => ({
      name: c.name,
      received: c.quantityReceived,
      consumed: c.quantityConsumed,
      available: c.available,
    })), [components]
  );

  const financialSummary = useMemo(() => {
    const totalSales = parties.reduce((s, p) => s + p.totalSales, 0);
    const totalPayments = parties.reduce((s, p) => s + p.paymentsReceived, 0);
    const totalReturnVal = parties.reduce((s, p) => s + p.returnValue, 0);
    return { totalSales, totalPayments, totalOutstanding, totalReturnVal, netRevenue: totalSales - totalReturnVal };
  }, [parties, totalOutstanding]);

  const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const tabs: { id: ReportTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'production', label: 'Production', icon: Factory },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'returns', label: 'Returns & QC', icon: RotateCcw },
    { id: 'inventory', label: 'Inventory', icon: Layers },
    { id: 'financial', label: 'Financial', icon: DollarSign },
  ];

  /* ─── stat card component ─── */
  const StatCard = ({ label, value, sub, icon: Icon, color, glow }: any) => (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border p-5 transition-all duration-500 hover:shadow-[0_0_30px_rgba(201,168,76,0.08)]',
        TOKENS.cardBg === '#ffffff'
          ? 'border-[#e8e2d9] bg-white hover:border-[#c9a84c]/40'
          : 'border-[#1e2a3a] bg-[#0b1120] hover:border-[#c9a84c]/30'
      )}
    >
      <div className={cn(
        'absolute inset-0 transition-opacity duration-500 group-hover:opacity-100',
        TOKENS.cardBg === '#ffffff'
          ? 'bg-gradient-to-br from-[#c9a84c]/[0.03] to-transparent opacity-0'
          : 'bg-gradient-to-br from-white/[0.02] to-transparent opacity-0'
      )} />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <span className={cn('text-[10px] font-semibold tracking-[0.15em] uppercase', TOKENS.textMuted)}>{label}</span>
          <div className={cn('text-2xl font-bold tracking-tight', TOKENS.textPrimary)} style={{ textShadow: (glow && !TOKENS.isLight) ? `0 0 20px ${glow}` : undefined }}>{value}</div>
          {sub && <div className={cn('text-[11px]', TOKENS.textMuted)}>{sub}</div>}
        </div>
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg border',
          TOKENS.cardBg === '#ffffff'
            ? 'border-[#e8e2d9] bg-[#faf8f5]'
            : 'border-white/5 bg-white/[0.03]',
          color
        )}>
          <Icon size={18} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  );

  /* ─── section header ─── */
  const SectionHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-gradient-to-b from-[#c9a84c] to-[#c9a84c]/20" />
        <h3 className={cn('text-sm font-semibold tracking-wide', TOKENS.textPrimary)}>{title}</h3>
      </div>
      {action}
    </div>
  );

  /* ─── chart card wrapper ─── */
  const ChartCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-6',
        TOKENS.cardBg === '#ffffff'
          ? 'border-[#e8e2d9] bg-white'
          : 'border-[#1e2a3a] bg-[#0b1120]',
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,76,0.03),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.02),transparent_50%)]" />
      <div className="relative">{children}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-[#c9a84c]" />
            <span className="text-[10px] font-semibold tracking-[0.2em] text-[#c9a84c] uppercase">Analytics Dashboard</span>
          </div>
          <h1 className={cn('text-3xl font-bold tracking-tight', TOKENS.textPrimary)}>Reports & Analytics</h1>
          <p className={cn('text-sm mt-1', TOKENS.textMuted)}>Real-time intelligence across production, sales, returns, and inventory</p>
        </div>
        <div className={cn('flex items-center gap-2 text-[10px]', TOKENS.textMuted)}>
          <span className="flex h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
          Live Data
        </div>
      </div>

      {/* Tabs */}
      <div className={cn('flex items-center gap-1 border-b overflow-x-auto pb-0', TOKENS.border)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative px-5 py-3 text-xs font-semibold tracking-wide uppercase transition-all duration-300 whitespace-nowrap',
              activeTab === tab.id
                ? 'text-[#c9a84c]'
                : cn(TOKENS.textMuted, 'hover:' + TOKENS.textSecondary.split(' ')[0])
            )}
          >
            <div className="flex items-center gap-2">
              <tab.icon size={14} />
              {tab.label}
            </div>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />
            )}
          </button>
        ))}
      </div>

      {/* ═════ OVERVIEW ═════ */}
      {activeTab === 'overview' && (
        <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Produced" value={animProduced.toLocaleString()} icon={Factory} color="text-[#a855f7]" glow={TOKENS.violetGlow} />
              <StatCard label="Total Sold" value={animSold.toLocaleString()} icon={TrendingUp} color="text-[#10b981]" glow={TOKENS.emeraldGlow} />
              <StatCard label="Total Returns" value={animReturns.toLocaleString()} icon={RotateCcw} color="text-[#f43f5e]" glow={TOKENS.roseGlow} />
              <StatCard label="Active Repairs" value={animRepairs.toLocaleString()} icon={Wrench} color="text-[#f59e0b]" glow={TOKENS.amberGlow} />
              <StatCard label="Net Revenue" value={formatCurrencyCompact(financialSummary.netRevenue, currency)} icon={DollarSign} color="text-[#ec4899]" glow="rgba(236,72,153,0.35)" />
              <StatCard label="Outstanding" value={formatCurrencyCompact(totalOutstanding, currency)} icon={AlertTriangle} color="text-[#f43f5e]" glow={TOKENS.roseGlow} />
              <StatCard label="Low Stock" value={lowStockCount.toString()} icon={Package} color="text-[#f59e0b]" glow={TOKENS.amberGlow} sub="Components below threshold" />
              <StatCard label="Out of Stock" value={outOfStockCount.toString()} icon={Package} color="text-[#f43f5e]" glow={TOKENS.roseGlow} sub="Immediate reorder needed" />
            </div>
          
                      <div className="grid md:grid-cols-2 gap-6">
              {/* Sales vs Returns — Area Chart */}
              <ChartCard>
                <SectionHeader title="Sales vs Returns Trend" />
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={monthlySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={TOKENS.emerald} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={TOKENS.emerald} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="returnsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={TOKENS.rose} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={TOKENS.rose} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke={TOKENS.grid} vertical={false} />
                    <XAxis dataKey="month" stroke={TOKENS.slate} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={TOKENS.slate} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrencyCompact(v, currency).replace(/\s/g, '')} />
                    <Tooltip content={<FuturisticTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                    <Area type="monotone" dataKey="sales" stroke={TOKENS.emerald} strokeWidth={2.5} fill="url(#salesGrad)" name="Sales" dot={{ r: 3, fill: TOKENS.emerald, strokeWidth: 0 }} activeDot={{ r: 6, fill: TOKENS.emerald, stroke: TOKENS.chartBg, strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="returns" stroke={TOKENS.rose} strokeWidth={2.5} fill="url(#returnsGrad)" name="Returns" dot={{ r: 3, fill: TOKENS.rose, strokeWidth: 0 }} activeDot={{ r: 6, fill: TOKENS.rose, stroke: TOKENS.chartBg, strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* QC Donut */}
              <ChartCard>
                <SectionHeader title="QC Outcomes" />
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={qcOutcomeData}
                      cx="50%" cy="50%"
                      innerRadius={70} outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {qcOutcomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<FuturisticTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
                  </>
      )}

      {/* ═════ PRODUCTION ═════ */}
      {activeTab === 'production' && (
                  <div className="space-y-6">
            {/* Modern Production Progress — Stacked Horizontal Bars */}
            <ChartCard>
              <SectionHeader
                title="Batch Production Progress"
                action={
                  <button onClick={() => exportCSV('batch-report', ['Batch','Model','Target','Produced','Packed','Dispatched','Returns','Repair','Scrap'], batches.map((b) => [b.name, b.modelName, b.originalQuantity, b.produced, b.packed, b.dispatched, b.returns, b.repair, b.scrap]))} className={cn('flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all hover:border-[#c9a84c]/30 hover:text-[#c9a84c]', TOKENS.cardBg === '#ffffff' ? 'border-[#e8e2d9] bg-[#faf8f5] text-[#57534e]' : 'border-[#1e2a3a] bg-[#0b1120] text-[#94a3b8]')}>
                    <Download size={12} /> Export CSV
                  </button>
                }
              />
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={batchProductionData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }} barSize={28}>
                  <defs>
                    <linearGradient id="gradTarget" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={TOKENS.isLight ? '#a8a29e' : '#334155'} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={TOKENS.isLight ? '#d6d3d1' : '#475569'} stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="gradProduced" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#c9a84c" stopOpacity={1} />
                      <stop offset="100%" stopColor="#c9a84c" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="gradPacked" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="gradDispatched" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke={TOKENS.grid} horizontal={false} />
                  <XAxis type="number" stroke={TOKENS.slate} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <YAxis dataKey="name" type="category" stroke={TOKENS.textSecondary} fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip content={<FuturisticTooltip />} cursor={{ fill: TOKENS.isLight ? 'rgba(201,168,76,0.06)' : 'rgba(201,168,76,0.03)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }} />
                  <Bar dataKey="target" fill="url(#gradTarget)" name="Target" radius={[0, 6, 6, 0]} stackId="a" />
                  <Bar dataKey="produced" fill="url(#gradProduced)" name="Produced" radius={[0, 6, 6, 0]} stackId="a" />
                  <Bar dataKey="packed" fill="url(#gradPacked)" name="Packed" radius={[0, 6, 6, 0]} stackId="a" />
                  <Bar dataKey="dispatched" fill="url(#gradDispatched)" name="Dispatched" radius={[0, 6, 6, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Modern Donut with inner stats */}
              <ChartCard>
                <SectionHeader title="Units by Model" />
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <defs>
                      {CHART_COLORS.map((c, i) => (
                        <linearGradient key={i} id={`pieGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                          <stop offset="100%" stopColor={c} stopOpacity={0.5} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={modelBreakdown}
                      cx="50%" cy="50%"
                      innerRadius={65} outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      cornerRadius={6}
                      stroke="none"
                    >
                      {modelBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#pieGrad-${index % CHART_COLORS.length})`} />
                      ))}
                    </Pie>
                    <Tooltip content={<FuturisticTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Batch Table */}
              <ChartCard className="p-0">
                <div className={cn('px-6 py-4 border-b', TOKENS.border)}>
                  <SectionHeader title="Batch Summary" />
                </div>
                <div className="overflow-x-auto px-2">
                  <table className="w-full">
                    <thead>
                      <tr className={cn('border-b', TOKENS.border)}>
                        {['Batch','Model','Target','Produced','Packed','Dispatched','Status'].map((h) => (
                          <th key={h} className={cn('text-left text-[10px] font-semibold tracking-wider uppercase px-4 py-3', TOKENS.textMuted)}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((b) => (
                        <tr key={b.id} className={cn('border-b transition-colors', TOKENS.cardBg === '#ffffff' ? 'border-[#f0ebe3] hover:bg-[#faf8f5]' : 'border-[#1e2a3a]/40 hover:bg-white/[0.02]')}>
                          <td className={cn('px-4 py-3 text-sm font-semibold', TOKENS.textPrimary)}>{b.name}</td>
                          <td className={cn('px-4 py-3 text-sm', TOKENS.textSecondary)}>{b.modelName}</td>
                          <td className={cn('px-4 py-3 text-sm', TOKENS.textMuted)}>{b.originalQuantity.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm font-medium text-[#c9a84c]">{b.produced.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm font-medium text-[#06b6d4]">{b.packed.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm font-medium text-[#10b981]">{b.dispatched.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border',
                              b.status === 'completed' && 'border-[#10b981]/20 bg-[#10b981]/10 text-[#10b981]',
                              b.status === 'in-production' && 'border-[#f59e0b]/20 bg-[#f59e0b]/10 text-[#f59e0b]',
                              b.status === 'active' && 'border-[#3b82f6]/20 bg-[#3b82f6]/10 text-[#3b82f6]'
                            )}>
                              <span className={cn('h-1.5 w-1.5 rounded-full', b.status === 'completed' && 'bg-[#10b981]', b.status === 'in-production' && 'bg-[#f59e0b]', b.status === 'active' && 'bg-[#3b82f6]')} />
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </div>
          </div>
              )}

      {/* ═════ SALES ═════ */}
      {activeTab === 'sales' && (
                  <div className="space-y-6">
            {/* Modern Sales Performance — Horizontal Stacked Bars */}
            <ChartCard>
              <SectionHeader
                title="Party Sales Performance"
                action={
                  <button onClick={() => exportCSV('party-sales', ['Party','Total Sales','Payments Received','Outstanding','Phones Sold','Phones Returned'], parties.map((p) => [p.name, p.totalSales, p.paymentsReceived, p.outstanding, p.phonesSold, p.phonesReturned]))} className={cn('flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all hover:border-[#c9a84c]/30 hover:text-[#c9a84c]', TOKENS.cardBg === '#ffffff' ? 'border-[#e8e2d9] bg-[#faf8f5] text-[#57534e]' : 'border-[#1e2a3a] bg-[#0b1120] text-[#94a3b8]')}>
                    <Download size={12} /> Export CSV
                  </button>
                }
              />
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={partySalesData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }} barSize={24}>
                  <defs>
                    <linearGradient id="gradSales" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.25} />
                    </linearGradient>
                    <linearGradient id="gradPayments" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.25} />
                    </linearGradient>
                    <linearGradient id="gradOutstanding" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.25} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke={TOKENS.grid} horizontal={false} />
                  <XAxis type="number" stroke={TOKENS.slate} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrencyCompact(v, currency).replace(/\s/g, '')} />
                  <YAxis dataKey="name" type="category" stroke={TOKENS.textSecondary} fontSize={12} tickLine={false} axisLine={false} width={120} />
                  <Tooltip content={<FuturisticTooltip />} cursor={{ fill: TOKENS.isLight ? 'rgba(201,168,76,0.06)' : 'rgba(201,168,76,0.03)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }} />
                  <Bar dataKey="sales" fill="url(#gradSales)" name="Total Sales" radius={[0, 6, 6, 0]} stackId="s" />
                  <Bar dataKey="received" fill="url(#gradPayments)" name="Payments" radius={[0, 6, 6, 0]} stackId="s" />
                  <Bar dataKey="outstanding" fill="url(#gradOutstanding)" name="Outstanding" radius={[0, 6, 6, 0]} stackId="s" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard className="p-0">
              <div className={cn('px-6 py-4 border-b flex items-center justify-between', TOKENS.border)}>
                <SectionHeader title="Party Details" />
                <span className={cn('text-[11px]', TOKENS.textMuted)}>{parties.length} parties</span>
              </div>
              <div className="overflow-x-auto px-2">
                <table className="w-full">
                  <thead>
                    <tr className={cn('border-b', TOKENS.border)}>
                      {['Party','Contact','Sold','Returned','Total Sales','Outstanding','Status'].map((h) => (
                        <th key={h} className={cn('text-left text-[10px] font-semibold tracking-wider uppercase px-4 py-3', TOKENS.textMuted)}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parties.map((p) => (
                      <tr key={p.id} className={cn('border-b transition-colors', TOKENS.cardBg === '#ffffff' ? 'border-[#f0ebe3] hover:bg-[#faf8f5]' : 'border-[#1e2a3a]/40 hover:bg-white/[0.02]')}>
                        <td className={cn('px-4 py-3 text-sm font-semibold', TOKENS.textPrimary)}>{p.name}</td>
                        <td className={cn('px-4 py-3 text-sm', TOKENS.textSecondary)}>{p.contact}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#10b981]">{p.phonesSold.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#f43f5e]">{p.phonesReturned.toLocaleString()}</td>
                        <td className={cn('px-4 py-3 text-sm font-medium', TOKENS.textPrimary)}>Rs. {(p.totalSales / 100000).toFixed(1)}L</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#f43f5e]">Rs. {(p.outstanding / 100000).toFixed(1)}L</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border',
                            p.status === 'active' ? 'border-[#10b981]/20 bg-[#10b981]/10 text-[#10b981]' : 'border-[#f43f5e]/20 bg-[#f43f5e]/10 text-[#f43f5e]'
                          )}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', p.status === 'active' ? 'bg-[#10b981]' : 'bg-[#f43f5e]')} />
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
              )}

      {/* ═════ RETURNS & QC ═════ */}
      {activeTab === 'returns' && (
                  <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <ChartCard>
                <SectionHeader title="QC Outcomes Distribution" />
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={qcOutcomeData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={95}
                      paddingAngle={6}
                      dataKey="value"
                    >
                      {qcOutcomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<FuturisticTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard>
                <SectionHeader title="Top Return Reasons" />
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topReturnReasons} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke={TOKENS.grid} horizontal={false} />
                    <XAxis type="number" stroke={TOKENS.slate} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke={TOKENS.textSecondary} fontSize={10} tickLine={false} axisLine={false} width={130} />
                    <Tooltip content={<FuturisticTooltip />} />
                    <Bar dataKey="value" fill={TOKENS.rose} name="Count" radius={[0, 6, 6, 0]} barSize={16}>
                      {topReturnReasons.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? TOKENS.rose : i === 1 ? TOKENS.amber : TOKENS.slate} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <ChartCard className="p-0">
              <div className={cn('px-6 py-4 border-b flex items-center justify-between', TOKENS.border)}>
                <SectionHeader title="Return Records" />
                <button onClick={() => exportCSV('returns-report', ['Return #','IMEI','Model','Party','Reason','QC Status','Refund','Date'], returns.map((r) => [r.returnNumber || '', r.imei || '', r.model || '', r.partyName, r.reason, r.qcStatus, r.refundAmount, r.returnDate]))} className={cn('flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all hover:border-[#c9a84c]/30 hover:text-[#c9a84c]', TOKENS.cardBg === '#ffffff' ? 'border-[#e8e2d9] bg-[#faf8f5] text-[#57534e]' : 'border-[#1e2a3a] bg-[#0b1120] text-[#94a3b8]')}>
                  <Download size={12} /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto px-2">
                <table className="w-full">
                  <thead>
                    <tr className={cn('border-b', TOKENS.border)}>
                      {['Return #','IMEI','Model','Party','Reason','QC','Date'].map((h) => (
                        <th key={h} className={cn('text-left text-[10px] font-semibold tracking-wider uppercase px-4 py-3', TOKENS.textMuted)}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map((r) => (
                      <tr key={r.id} className={cn('border-b transition-colors', TOKENS.cardBg === '#ffffff' ? 'border-[#f0ebe3] hover:bg-[#faf8f5]' : 'border-[#1e2a3a]/40 hover:bg-white/[0.02]')}>
                        <td className="px-4 py-3 text-sm font-mono font-semibold text-[#c9a84c]">{r.returnNumber}</td>
                        <td className={cn('px-4 py-3 text-sm', TOKENS.textSecondary)}>{r.imei}</td>
                        <td className={cn('px-4 py-3 text-sm', TOKENS.textPrimary)}>{r.model}</td>
                        <td className={cn('px-4 py-3 text-sm', TOKENS.textSecondary)}>{r.partyName}</td>
                        <td className={cn('px-4 py-3 text-sm', TOKENS.textPrimary)}>{r.reason}</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border',
                            r.qcStatus === 'good' && 'border-[#10b981]/20 bg-[#10b981]/10 text-[#10b981]',
                            r.qcStatus === 'repair' && 'border-[#f59e0b]/20 bg-[#f59e0b]/10 text-[#f59e0b]',
                            r.qcStatus === 'scrap' && 'border-[#f43f5e]/20 bg-[#f43f5e]/10 text-[#f43f5e]'
                          )}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', r.qcStatus === 'good' && 'bg-[#10b981]', r.qcStatus === 'repair' && 'bg-[#f59e0b]', r.qcStatus === 'scrap' && 'bg-[#f43f5e]')} />
                            {r.qcStatus}
                          </span>
                        </td>
                        <td className={cn('px-4 py-3 text-sm', TOKENS.textMuted)}>{r.returnDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
              )}

      {/* ═════ INVENTORY ═════ */}
      {activeTab === 'inventory' && (
                  <div className="space-y-6">
            <ChartCard>
              <SectionHeader title="Component Stock Levels" />
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={componentStockData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="invReceived" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={TOKENS.cyan} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={TOKENS.cyan} stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="invConsumed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={TOKENS.amber} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={TOKENS.amber} stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="invAvailable" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={TOKENS.emerald} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={TOKENS.emerald} stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke={TOKENS.grid} vertical={false} />
                  <XAxis dataKey="name" stroke={TOKENS.slate} fontSize={10} tickLine={false} axisLine={false} angle={-35} textAnchor="end" height={70} />
                  <YAxis stroke={TOKENS.slate} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<FuturisticTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                  <Bar dataKey="received" fill="url(#invReceived)" name="Received" radius={[6, 6, 0, 0]} barSize={16} />
                  <Bar dataKey="consumed" fill="url(#invConsumed)" name="Consumed" radius={[6, 6, 0, 0]} barSize={16} />
                  <Bar dataKey="available" fill="url(#invAvailable)" name="Available" radius={[6, 6, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard className="p-0">
              <div className={cn('px-6 py-4 border-b flex items-center justify-between', TOKENS.border)}>
                <SectionHeader title="Component Details" />
                <button onClick={() => exportCSV('inventory-report', ['Component','Supplier','Received','Consumed','Available','Threshold','Warehouse','Status'], components.map((c) => [c.name, c.supplier, c.quantityReceived, c.quantityConsumed, c.available, c.lowStockThreshold, c.warehouse, c.status]))} className={cn('flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all hover:border-[#c9a84c]/30 hover:text-[#c9a84c]', TOKENS.cardBg === '#ffffff' ? 'border-[#e8e2d9] bg-[#faf8f5] text-[#57534e]' : 'border-[#1e2a3a] bg-[#0b1120] text-[#94a3b8]')}>
                  <Download size={12} /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto px-2">
                <table className="w-full">
                  <thead>
                    <tr className={cn('border-b', TOKENS.border)}>
                      {['Component','Supplier','Received','Consumed','Available','Threshold','Warehouse','Status'].map((h) => (
                        <th key={h} className={cn('text-left text-[10px] font-semibold tracking-wider uppercase px-4 py-3', TOKENS.textMuted)}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {components.map((c) => (
                      <tr key={c.id} className={cn('border-b transition-colors', TOKENS.cardBg === '#ffffff' ? 'border-[#f0ebe3] hover:bg-[#faf8f5]' : 'border-[#1e2a3a]/40 hover:bg-white/[0.02]')}>
                        <td className={cn('px-4 py-3 text-sm font-semibold', TOKENS.textPrimary)}>{c.name}</td>
                        <td className={cn('px-4 py-3 text-sm', TOKENS.textSecondary)}>{c.supplier}</td>
                        <td className={cn('px-4 py-3 text-sm', TOKENS.textMuted)}>{c.quantityReceived.toLocaleString()}</td>
                        <td className={cn('px-4 py-3 text-sm', TOKENS.textMuted)}>{c.quantityConsumed.toLocaleString()}</td>
                        <td className={cn('px-4 py-3 text-sm font-bold', TOKENS.textPrimary)}>{c.available.toLocaleString()}</td>
                        <td className={cn('px-4 py-3 text-sm', TOKENS.textMuted)}>{c.lowStockThreshold.toLocaleString()}</td>
                        <td className={cn('px-4 py-3 text-sm', TOKENS.textSecondary)}>{c.warehouse}</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border',
                            c.status === 'in-stock' && 'border-[#10b981]/20 bg-[#10b981]/10 text-[#10b981]',
                            c.status === 'low-stock' && 'border-[#f59e0b]/20 bg-[#f59e0b]/10 text-[#f59e0b]',
                            c.status === 'out-of-stock' && 'border-[#f43f5e]/20 bg-[#f43f5e]/10 text-[#f43f5e]'
                          )}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', c.status === 'in-stock' && 'bg-[#10b981]', c.status === 'low-stock' && 'bg-[#f59e0b]', c.status === 'out-of-stock' && 'bg-[#f43f5e]')} />
                            {c.status.replace('-', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
              )}

      {/* ═════ FINANCIAL ═════ */}
      {activeTab === 'financial' && (
                  <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Sales', value: formatCurrencyCompact(financialSummary.totalSales, currency), icon: TrendingUp, color: 'text-[#10b981]', glow: TOKENS.emeraldGlow },
                { label: 'Payments Received', value: formatCurrencyCompact(financialSummary.totalPayments, currency), icon: CheckCircle2, color: 'text-[#06b6d4]', glow: TOKENS.cyanGlow },
                { label: 'Total Outstanding', value: formatCurrencyCompact(financialSummary.totalOutstanding, currency), icon: AlertTriangle, color: 'text-[#f43f5e]', glow: TOKENS.roseGlow },
                { label: 'Return Value', value: formatCurrencyCompact(financialSummary.totalReturnVal, currency), icon: RotateCcw, color: 'text-[#f59e0b]', glow: TOKENS.amberGlow },
              ].map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </div>

            <ChartCard>
              <SectionHeader title="Monthly Sales vs Returns" />
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={monthlySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="finSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={TOKENS.emerald} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={TOKENS.emerald} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke={TOKENS.grid} vertical={false} />
                  <XAxis dataKey="month" stroke={TOKENS.slate} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={TOKENS.slate} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrencyCompact(v, currency).replace(/\s/g, '')} />
                  <Tooltip content={<FuturisticTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                  <Bar dataKey="sales" fill="url(#finSales)" name={`Sales (${currency})`} radius={[6, 6, 0, 0]} barSize={28} />
                  <Line type="monotone" dataKey="returns" stroke={TOKENS.rose} strokeWidth={3} dot={{ r: 4, fill: TOKENS.rose, stroke: TOKENS.chartBg, strokeWidth: 2 }} activeDot={{ r: 7, fill: TOKENS.rose, stroke: '#fff', strokeWidth: 2 }} name={`Returns (${currency})`} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard className="p-0">
              <div className={cn('px-6 py-4 border-b flex items-center justify-between', TOKENS.border)}>
                <SectionHeader title="Party Financial Summary" />
                <button onClick={() => exportCSV('financial-report', ['Party','Total Sales','Payments','Outstanding','Return Value','Net Receivable'], parties.map((p) => [p.name, p.totalSales, p.paymentsReceived, p.outstanding, p.returnValue, p.netReceivable]))} className={cn('flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all hover:border-[#c9a84c]/30 hover:text-[#c9a84c]', TOKENS.cardBg === '#ffffff' ? 'border-[#e8e2d9] bg-[#faf8f5] text-[#57534e]' : 'border-[#1e2a3a] bg-[#0b1120] text-[#94a3b8]')}>
                  <Download size={12} /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto px-2">
                <table className="w-full">
                  <thead>
                    <tr className={cn('border-b', TOKENS.border)}>
                      {['Party','Total Sales','Payments','Outstanding','Return Value','Net Receivable'].map((h) => (
                        <th key={h} className={cn('text-left text-[10px] font-semibold tracking-wider uppercase px-4 py-3', TOKENS.textMuted)}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parties.map((p) => (
                      <tr key={p.id} className={cn('border-b transition-colors', TOKENS.cardBg === '#ffffff' ? 'border-[#f0ebe3] hover:bg-[#faf8f5]' : 'border-[#1e2a3a]/40 hover:bg-white/[0.02]')}>
                        <td className={cn('px-4 py-3 text-sm font-semibold', TOKENS.textPrimary)}>{p.name}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#10b981]">Rs. {(p.totalSales / 100000).toFixed(1)}L</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#06b6d4]">Rs. {(p.paymentsReceived / 100000).toFixed(1)}L</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#f43f5e]">Rs. {(p.outstanding / 100000).toFixed(1)}L</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#f59e0b]">Rs. {(p.returnValue / 100000).toFixed(1)}L</td>
                        <td className={cn('px-4 py-3 text-sm font-bold', TOKENS.textPrimary)}>Rs. {(p.netReceivable / 100000).toFixed(1)}L</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
              )}
    </div>
  );
}
