'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import {
  Package,
  Truck,
  RotateCcw,
  Warehouse,
  Wrench,
  Trash2,
  FileText,
  BarChart3,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Factory,
  Users,
} from 'lucide-react';
import { useDataStore, useAuthStore } from '@/lib/store';
import { FadeIn, StaggerContainer, StaggerItem, CountUp } from '@/components/motion';
import { cn, type PeriodFilter, getPeriodBounds, isDateInPeriod, hasPermission } from '@/lib/utils';

const batchColors = ['#00f0ff', '#ff2d95', '#a855f7', '#f59e0b', '#22c55e', '#06b6d4'];

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'this-quarter', label: 'This Quarter' },
  { value: 'this-year', label: 'This Year' },
];

const allQuickActions = [
  { icon: FileText, label: 'New Sale / Invoice', color: 'text-[#3b82f6]', href: '/sales', permission: 'sales' },
  { icon: Factory, label: 'Record Production', color: 'text-[#a855f7]', href: '/production', permission: 'production' },
  { icon: RotateCcw, label: 'Process Return', color: 'text-[#ef4444]', href: '/returns', permission: 'returns' },
  { icon: Wrench, label: 'QC / Repair', color: 'text-[#22c55e]', href: '/repair', permission: 'repair' },
  { icon: Users, label: 'Party Ledger', color: 'text-[#f59e0b]', href: '/party-ledger', permission: 'parties' },
  { icon: BarChart3, label: 'View Reports', color: 'text-[#c9a84c]', href: '/reports', permission: 'reports' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>('this-month');
  const dashboardStats = useDataStore((state) => state.dashboardStats);
  const transactions = useDataStore((state) => state.transactions);
  const sales = useDataStore((state) => state.sales);
  const returns = useDataStore((state) => state.returns);
  const imeis = useDataStore((state) => state.imeis);
  const parties = useDataStore((state) => state.parties);
  const currentUser = useAuthStore((state) => state.currentUser);

  const userPerms = currentUser?.role?.permissions || [];
  const quickActions = allQuickActions.filter((a) => hasPermission(userPerms, a.permission));

  const { start, end } = useMemo(() => getPeriodBounds(period), [period]);

  const filteredTransactions = useMemo(
    () => transactions.filter((t) => isDateInPeriod(t.date, period)).slice(0, 5),
    [transactions, period]
  );

  const filteredSales = useMemo(
    () => sales.filter((s) => isDateInPeriod(s.date, period)),
    [sales, period]
  );

  const filteredReturns = useMemo(
    () => returns.filter((r) => isDateInPeriod(r.returnDate, period)),
    [returns, period]
  );

  const periodStats = useMemo(() => {
    const produced = imeis.filter((i) => {
      const producedEvent = i.history.find((h) => h.event === 'Produced');
      return producedEvent ? isDateInPeriod(producedEvent.date, period) : false;
    }).length;

    const dispatched = imeis.filter((i) =>
      (i.status === 'sold' || i.status === 'in-transit') &&
      i.saleDate &&
      isDateInPeriod(i.saleDate, period)
    ).length;

    const customerReturns = filteredReturns.length;

    const sellableStock = imeis.filter((i) =>
      (i.status === 'sellable' || i.status === 'packed') &&
      i.history.some((h) => h.event === 'Moved to Sellable' && isDateInPeriod(h.date, period))
    ).length;

    const repairStock = imeis.filter((i) =>
      i.status === 'repair' &&
      i.history.some((h) => h.event === 'Repair' && isDateInPeriod(h.date, period))
    ).length;

    const scrapRejected = imeis.filter((i) =>
      i.status === 'scrap' &&
      i.history.some((h) => h.event === 'Scrapped' && isDateInPeriod(h.date, period))
    ).length;

    return { produced, dispatched, customerReturns, sellableStock, repairStock, scrapRejected };
  }, [imeis, filteredReturns, period]);

  const recentTransactions = filteredTransactions;

  const statCards = useMemo(() => {
    const baseSpark = (seed: number) =>
      Array.from({ length: 20 }, (_, i) => Math.max(0, seed + Math.sin(i * 0.8) * seed * 0.3 + (i % 3) * 2));

    return [
      {
        label: 'TOTAL PRODUCTION',
        value: periodStats.produced,
        icon: Package,
        color: '#a855f7',
        trend: `${periodStats.produced > 0 ? '+' : ''}${periodStats.produced}`,
        trendUp: periodStats.produced >= 0,
        sparkline: baseSpark(periodStats.produced || 1),
      },
      {
        label: 'DISPATCHED',
        value: periodStats.dispatched,
        icon: Truck,
        color: '#3b82f6',
        trend: `${periodStats.dispatched > 0 ? '+' : ''}${periodStats.dispatched}`,
        trendUp: periodStats.dispatched >= 0,
        sparkline: baseSpark(periodStats.dispatched || 1),
      },
      {
        label: 'CUSTOMER RETURNS',
        value: periodStats.customerReturns,
        icon: RotateCcw,
        color: '#06b6d4',
        trend: `${periodStats.customerReturns}`,
        trendUp: false,
        sparkline: baseSpark(periodStats.customerReturns || 1),
      },
      {
        label: 'SELLABLE STOCK',
        value: periodStats.sellableStock,
        icon: Warehouse,
        color: '#22c55e',
        trend: `${periodStats.sellableStock > 0 ? '+' : ''}${periodStats.sellableStock}`,
        trendUp: periodStats.sellableStock >= 0,
        sparkline: baseSpark(periodStats.sellableStock || 1),
      },
      {
        label: 'REPAIR STOCK',
        value: periodStats.repairStock,
        icon: Wrench,
        color: '#f59e0b',
        trend: `${periodStats.repairStock}`,
        trendUp: false,
        sparkline: baseSpark(periodStats.repairStock || 1),
      },
      {
        label: 'SCRAP / REJECTED',
        value: periodStats.scrapRejected,
        icon: Trash2,
        color: '#ef4444',
        trend: `${periodStats.scrapRejected}`,
        trendUp: false,
        sparkline: baseSpark(periodStats.scrapRejected || 1),
      },
    ];
  }, [periodStats]);

  const summarySegments = useMemo(() => {
    const total = Math.max(1, periodStats.produced + periodStats.dispatched + periodStats.customerReturns + periodStats.sellableStock + periodStats.repairStock + periodStats.scrapRejected);
    return [
      { name: 'Produced', value: periodStats.produced, color: '#6366f1', subValue: `${((periodStats.produced / total) * 100).toFixed(0)}%` },
      { name: 'Dispatched', value: periodStats.dispatched, color: '#10b981', subValue: `${((periodStats.dispatched / total) * 100).toFixed(0)}%` },
      { name: 'Returns', value: periodStats.customerReturns, color: '#0ea5e9', subValue: `${((periodStats.customerReturns / total) * 100).toFixed(0)}%` },
      { name: 'Sellable Stock', value: periodStats.sellableStock, color: '#8b5cf6', subValue: `${((periodStats.sellableStock / total) * 100).toFixed(0)}%` },
      { name: 'Repair Stock', value: periodStats.repairStock, color: '#f59e0b', subValue: `${((periodStats.repairStock / total) * 100).toFixed(0)}%` },
      { name: 'Scrap / Rejected', value: periodStats.scrapRejected, color: '#ef4444', subValue: `${((periodStats.scrapRejected / total) * 100).toFixed(0)}%` },
    ];
  }, [periodStats]);

  const chartData = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months.map((m) => {
      const monthSales = filteredSales
        .filter((s) => new Date(s.date).toLocaleString('en-US', { month: 'short' }) === m)
        .reduce((acc, s) => acc + s.totalAmount, 0);
      const monthReturns = filteredReturns
        .filter((r) => new Date(r.returnDate).toLocaleString('en-US', { month: 'short' }) === m)
        .reduce((acc, r) => acc + (r.refundAmount || 0), 0);
      return { name: m, sales: monthSales, returns: monthReturns } as { name: string; sales: number; returns: number };
    });
  }, [filteredSales, filteredReturns]);

  const displayChartData = chartData;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f0f0]">Dashboard Overview</h1>
            <p className="text-sm text-[#94a3b8] mt-1">Real-time insights into your inventory and operations</p>
            {/* Animated gradient line */}
            <div className="mt-3 h-[1px] w-32 relative overflow-hidden">
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)',
                  animation: 'shimmer 2s linear infinite',
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
              className="bg-[#0f1525] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#94a3b8] hover:border-[#2a3a50] transition-colors duration-300"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {hasPermission(userPerms, 'reports') && (
              <button className="btn-primary btn-press px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <BarChart3 size={16} />
                Export Report
              </button>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Stats Grid */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          const minSpark = Math.min(...stat.sparkline);
          const maxSpark = Math.max(...stat.sparkline);
          const range = maxSpark - minSpark || 1;
          const points = stat.sparkline
            .map((v, i) => {
              const x = (i / (stat.sparkline.length - 1)) * 100;
              const y = 100 - ((v - minSpark) / range) * 80 - 10;
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <StaggerItem key={stat.label} index={idx}>
              <div className="card-futuristic neon-border bg-[#0a0e17] border border-[#1e2a3a]/40 rounded-xl p-4 relative overflow-hidden group">
                {/* Animated corner accent */}
                <div
                  className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at top right, ${stat.color}15, transparent 70%)`,
                  }}
                />
                {/* Top row: label + icon */}
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <span className="text-[9px] font-semibold tracking-widest text-[#64748b] uppercase leading-tight group-hover:text-[#94a3b8] transition-colors duration-300">
                    {stat.label}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: `${stat.color}15`,
                      boxShadow: `0 0 12px ${stat.color}20`,
                    }}
                  >
                    <Icon size={14} style={{ color: stat.color }} className="transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </div>

                {/* Value with glow on hover */}
                <div className="text-xl font-bold text-[#f0f0f0] mb-1 relative z-10">
                  <CountUp end={stat.value} className="group-hover:animate-neon" style={{ color: stat.color }} />
                </div>

                {/* Trend with pulse */}
                <div className="flex items-center gap-1 mb-3 relative z-10">
                  <span
                    className="text-[10px] font-medium transition-all duration-300 group-hover:scale-105"
                    style={{ color: stat.trendUp ? stat.color : '#ef4444' }}
                  >
                    {stat.trendUp ? '↑' : '↓'} {stat.trend}
                  </span>
                </div>

                {/* Sparkline with enhanced glow */}
                <div className="h-8 w-full relative z-10">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                      <linearGradient id={`sparkGrad-${stat.label.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stat.color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={stat.color} stopOpacity={0} />
                      </linearGradient>
                      <filter id={`glow-${stat.label.replace(/\s+/g, '')}`}>
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <polygon
                      points={`0,100 ${points} 100,100`}
                      fill={`url(#sparkGrad-${stat.label.replace(/\s+/g, '')})`}
                      className="transition-opacity duration-300 group-hover:opacity-80"
                    />
                    <polyline
                      points={points}
                      fill="none"
                      stroke={stat.color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter={`url(#glow-${stat.label.replace(/\s+/g, '')})`}
                      className="transition-all duration-300"
                      style={{ filter: `drop-shadow(0 0 3px ${stat.color}60)` }}
                    />
                  </svg>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary Overview */}
        <FadeIn delay={0.2}>
          <div className="card-futuristic neon-border bg-[#0a0e17] border border-[#1e2a3a]/60 rounded-xl p-5 relative overflow-hidden">
            {/* Ambient glow background */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 30% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(16, 185, 129, 0.06) 0%, transparent 50%)',
              }}
            />
            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-base font-semibold text-[#f0f0f0]">Summary Overview</h3>
              <button className="btn-press flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0f1525] border border-[#1e2a3a]/60 text-xs text-[#94a3b8] hover:text-[#f0f0f0] hover:border-[#c9a84c]/30 transition-all duration-300">
                {PERIOD_OPTIONS.find((o) => o.value === period)?.label}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-8 relative z-10">
              {/* Donut */}
              <div className="relative w-40 h-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {summarySegments.map((seg, i) => (
                        <linearGradient key={`ringg-${i}`} id={`ringSeg-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={seg.color} stopOpacity={1} />
                          <stop offset="100%" stopColor={seg.color} stopOpacity={0.8} />
                        </linearGradient>
                      ))}
                    </defs>
                    
                    <Pie
                      data={summarySegments}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="#0a0e17"
                      strokeWidth={2}
                      cornerRadius={4}
                      onMouseEnter={(_, index) => setActiveSegment(index)}
                      onMouseLeave={() => setActiveSegment(null)}
                    >
                      {summarySegments.map((seg, index) => (
                        <Cell
                          key={`ringc-${index}`}
                          fill={`url(#ringSeg-${index})`}
                          stroke={activeSegment === index ? seg.color : '#0a0e17'}
                          strokeWidth={activeSegment === index ? 3 : 2}
                          style={{
                            filter: activeSegment === index ? `drop-shadow(0 0 6px ${seg.color}80)` : 'none',
                            opacity: activeSegment !== null && activeSegment !== index ? 0.5 : 1,
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-200">
                  {activeSegment !== null ? (
                    <>
                      <span className="text-xl font-bold" style={{ color: summarySegments[activeSegment].color }}>
                        {summarySegments[activeSegment].value.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#64748b] mt-0.5">{summarySegments[activeSegment].name}</span>
                      <span className="text-xs font-medium mt-0.5" style={{ color: summarySegments[activeSegment].color }}>
                        {summarySegments[activeSegment].subValue}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl font-bold text-[#f0f0f0]">{summarySegments.reduce((acc, s) => acc + s.value, 0).toLocaleString()}</span>
                      <span className="text-[10px] text-[#64748b] mt-0.5">Total Units</span>
                    </>
                  )}
                </div>
              </div>              
              
              {/* Legend */}
              <div className="flex-1 space-y-2.5">
                {summarySegments.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer"
                    style={{
                      backgroundColor: activeSegment === index ? `${item.color}10` : 'transparent',
                    }}
                    onMouseEnter={() => setActiveSegment(index)}
                    onMouseLeave={() => setActiveSegment(null)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-sm transition-all duration-200"
                        style={{
                          backgroundColor: item.color,
                          boxShadow: activeSegment === index ? `0 0 8px ${item.color}60` : 'none',
                          transform: activeSegment === index ? 'scale(1.2)' : 'scale(1)',
                        }}
                      />
                      <span
                        className="text-sm transition-colors duration-200"
                        style={{
                          color: activeSegment === index ? item.color : '#94a3b8',
                        }}
                      >
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#f0f0f0]">
                        {item.value.toLocaleString()}
                      </span>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: activeSegment === index ? `${item.color}20` : 'transparent',
                          color: activeSegment === index ? item.color : '#64748b',
                        }}
                      >
                        {item.subValue}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Sales vs Returns */}
        <FadeIn delay={0.3} direction="right">
          <div className="card-futuristic neon-border bg-[#0a0e17] border border-[#1e2a3a]/60 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-sm font-semibold text-[#f0f0f0]">Sales vs Returns</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6] animate-pulse-subtle"></div>
                  <span className="text-xs text-[#94a3b8]">Sales</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#a855f7] animate-pulse-subtle"></div>
                  <span className="text-xs text-[#94a3b8]">Returns</span>
                </div>
              </div>
            </div>
            <div className="h-56 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={displayChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 6" stroke="#1e2a3a" vertical={false} strokeOpacity={0.4} />
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e2a3a', strokeOpacity: 0.4 }} tickLine={false} />
                      
                      <YAxis
                        yAxisId="sales"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => value >= 1000 ? `${value/1000}K` : value}
                      />
                      
                      <YAxis
                        yAxisId="returns"
                        orientation="right"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      
                      <Tooltip
                        cursor={{ fill: 'rgba(59,130,246,0.05)' }}
                        contentStyle={{
                          backgroundColor: '#0f1525',
                          border: '1px solid #1e2a3a',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        itemStyle={{ color: '#f0f0f0' }}
                      />
                      
                      <Bar
                        yAxisId="sales"
                        dataKey="sales"
                        fill="url(#barGradient)"
                        radius={[4, 4, 0, 0]}
                        barSize={28}
                      />
                      
                      <Line
                        yAxisId="returns"
                        type="monotone"
                        dataKey="returns"
                        stroke="#a855f7"
                        strokeWidth={2.5}
                        dot={{ fill: '#a855f7', strokeWidth: 0, r: 4, fillOpacity: 1 }}
                        activeDot={{ r: 6, fill: '#a855f7', stroke: '#0a0e17', strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </FadeIn>
          </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Parties */}
        <FadeIn delay={0.4}>
          <div className="card-futuristic neon-border bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-5 relative overflow-hidden">
            <h3 className="text-sm font-semibold text-[#f0f0f0] mb-4 relative z-10">Top Parties by Sales</h3>
            <div className="space-y-3 relative z-10">
              {parties
                .map((party) => ({
                  ...party,
                  periodSales: filteredSales
                    .filter((s) => s.partyId === party.id)
                    .reduce((acc, s) => acc + s.totalAmount, 0),
                }))
                .sort((a, b) => b.periodSales - a.periodSales)
                .slice(0, 5)
                .map((party, index) => {
                  const maxSales = Math.max(
                    ...parties.map((p) =>
                      filteredSales.filter((s) => s.partyId === p.id).reduce((acc, s) => acc + s.totalAmount, 0)
                    )
                  ) || 1;
                  return (
                    <div key={party.id} className="table-row-futuristic flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer">
                      <span className="text-xs text-[#64748b] w-4 font-mono">{index + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#94a3b8]">{party.name}</span>
                          <span className="text-xs font-medium text-[#f0f0f0]">
                            {party.periodSales.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              backgroundColor: batchColors[index % batchColors.length],
                              width: `${(party.periodSales / maxSales) * 100}%`,
                              boxShadow: `0 0 8px ${batchColors[index % batchColors.length]}40`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="mt-4 pt-3 border-t border-[#1e2a3a] flex items-center justify-between relative z-10">
              <span className="text-xs text-[#64748b]">Total</span>
              <span className="text-sm font-semibold text-[#f0f0f0]">{filteredSales.reduce((acc, s) => acc + s.totalAmount, 0).toLocaleString()}</span>
            </div>
          </div>
        </FadeIn>

        {/* Recent Transactions */}
        <FadeIn delay={0.5}>
          <div className="card-futuristic neon-border bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-5 relative overflow-hidden">
            <h3 className="text-sm font-semibold text-[#f0f0f0] mb-4 relative z-10">Recent Transactions</h3>
            <div className="space-y-3 relative z-10">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="table-row-futuristic flex items-center justify-between py-2 px-2 rounded-lg cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded transition-all duration-300',
                          tx.type === 'out' && 'bg-[rgba(34,197,94,0.1)] text-[#22c55e] hover:bg-[rgba(34,197,94,0.2)]',
                          tx.type === 'in' && 'bg-[rgba(239,68,68,0.1)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.2)]',
                          tx.type === 'adjustment' && 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b] hover:bg-[rgba(245,158,11,0.2)]',
                          tx.type === 'transfer' && 'bg-[rgba(59,130,246,0.1)] text-[#3b82f6] hover:bg-[rgba(59,130,246,0.2)]'
                        )}
                      >
                        {tx.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-[#94a3b8] truncate">{tx.reference}</span>
                    </div>
                    <p className="text-xs text-[#64748b] mt-1">{tx.itemName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-[#f0f0f0]">{tx.quantity > 0 ? `+${tx.quantity}` : '-'}</span>
                    <p className="text-[10px] text-[#64748b] mt-0.5">{tx.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-3 text-xs text-[#c9a84c] hover:text-[#d4b76a] flex items-center gap-1 transition-all duration-300 hover:gap-2 relative z-10">
              View All Transactions
              <ChevronRight size={12} className="transition-transform duration-300" />
            </button>
          </div>
        </FadeIn>

        {/* Quick Actions */}
        <FadeIn delay={0.6}>
          <div className="card-futuristic neon-border bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-5 relative overflow-hidden">
            <h3 className="text-sm font-semibold text-[#f0f0f0] mb-4 relative z-10">Quick Actions</h3>
            <div className="space-y-2 relative z-10">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="btn-press w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#0d1321] border border-[#1e2a3a] hover:border-[#c9a84c]/30 transition-all duration-300 group text-left"
                >
                  <div className={cn('p-1.5 rounded-md bg-[rgba(201,168,76,0.08)] transition-all duration-300 group-hover:scale-110', action.color)}>
                    <action.icon size={16} />
                  </div>
                  <span className="text-sm text-[#94a3b8] group-hover:text-[#f0f0f0] transition-colors duration-300">
                    {action.label}
                  </span>
                  <ChevronRight
                    size={14}
                    className="ml-auto text-[#64748b] group-hover:text-[#c9a84c] transition-all duration-300 group-hover:translate-x-1"
                  />
                </button>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
