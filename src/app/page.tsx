'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Scan,
  Search,
  Bell,
  ChevronRight,
  ArrowRight,
  Shield,
  BarChart3,
  RotateCcw,
  Smartphone,
  Package,
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
  Activity,
  Menu,
  X,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem, MagneticButton } from '@/components/motion';
import { dashboardStats } from '@/lib/data';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Modules', href: '#modules' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Reports', href: '#reports' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About Us', href: '#about' },
];

const features = [
  {
    icon: Scan,
    title: 'Complete Traceability',
    description: 'Track every IMEI from production to customer and beyond. Full lifecycle visibility at your fingertips.',
  },
  {
    icon: Package,
    title: 'Real-Time Inventory',
    description: 'Know your exact stock position across all locations. Never guess, always know.',
  },
  {
    icon: RotateCcw,
    title: 'Smart Returns & QC',
    description: 'Automate returns, QC and move good units back to inventory seamlessly.',
  },
  {
    icon: Users,
    title: 'Party-Wise Ledger',
    description: 'Financial and quantity ledger connected in one place. Complete party intelligence.',
  },
  {
    icon: BarChart3,
    title: 'Powerful Reports',
    description: 'Batch reports, IMEI reports, party reports and more. Export in any format.',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Role-based access, secure data and complete audit trail for compliance.',
  },
];

const workflowSteps = [
  { label: 'Components', desc: 'Import & track parts' },
  { label: 'Production', desc: 'Assemble & produce' },
  { label: 'Batch', desc: 'Group & manage' },
  { label: 'IMEI', desc: 'Unique tracking' },
  { label: 'Warehouse', desc: 'Stock management' },
  { label: 'Sales', desc: 'Dispatch to parties' },
  { label: 'Party', desc: 'Customer management' },
  { label: 'Returns', desc: 'Handle returns' },
  { label: 'QC', desc: 'Quality control' },
  { label: 'Final', desc: 'Sellable inventory' },
];

function FloatingDashboard() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.getElementById('hero-dashboard')?.getBoundingClientRect();
      if (rect) {
        setMousePosition({
          x: (e.clientX - rect.left - rect.width / 2) / 50,
          y: (e.clientY - rect.top - rect.height / 2) / 50,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      id="hero-dashboard"
      initial={{ opacity: 0, x: 100, rotateY: 8, scale: 0.94 }}
      animate={{
        opacity: 1,
        x: 0,
        rotateY: 2,
        scale: 1,
        translateY: [0, -6, 0],
      }}
      transition={{
        opacity: { duration: 1, delay: 0.8 },
        x: { duration: 1, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] },
        rotateY: { duration: 1.2, delay: 0.8 },
        scale: { duration: 1, delay: 0.8 },
        translateY: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
      }}
      style={{
        perspective: 1000,
        transform: `rotateX(${-mousePosition.y}deg) rotateY(${mousePosition.x}deg)`,
      }}
      className="relative w-full max-w-2xl"
    >
      {/* Ambient Glow */}
      <div className="absolute -inset-20 ambient-glow opacity-60 pointer-events-none" />

      {/* Dashboard Card */}
      <div className="relative bg-[#0d1321]/90 backdrop-blur-xl border border-[#1e2a3a] rounded-2xl overflow-hidden shadow-2xl">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2a3a]">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[#c9a84c] to-[#a88a3a] flex items-center justify-center">
              <span className="text-[#0a0e1a] font-bold text-[10px]">M</span>
            </div>
            <span className="text-xs font-semibold text-[#f0f0f0]">MOBIIS ERP</span>
          </div>
          <div className="flex items-center gap-2">
            <Search size={12} className="text-[#64748b]" />
            <Bell size={12} className="text-[#64748b]" />
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#a88a3a]"></div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-3 gap-2 p-4">
          {[
            { label: 'PRODUCED', value: '25,000', color: 'text-[#3b82f6]' },
            { label: 'DISPATCHED', value: '24,000', color: 'text-[#22c55e]' },
            { label: 'RETURNS', value: '500', color: 'text-[#ef4444]' },
            { label: 'SELLABLE', value: '1,300', color: 'text-[#c9a84c]' },
            { label: 'REPAIR', value: '150', color: 'text-[#f59e0b]' },
            { label: 'SCRAP', value: '50', color: 'text-[#64748b]' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#0f1525] rounded-lg p-2.5 border border-[#1e2a3a]">
              <span className="text-[8px] text-[#64748b] uppercase tracking-wider">{stat.label}</span>
              <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Mini Chart */}
        <div className="px-4 pb-4">
          <div className="bg-[#0f1525] rounded-lg p-3 border border-[#1e2a3a]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[#94a3b8]">Sales vs Returns</span>
              <span className="text-[10px] text-[#22c55e]">+12%</span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {[40, 55, 45, 70, 60, 80, 65, 90, 75, 85, 70, 95].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.8, delay: 1.2 + i * 0.05 }}
                  className="flex-1 rounded-sm"
                  style={{
                    backgroundColor: i % 3 === 0 ? '#ef4444' : '#22c55e',
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.05], [0, 1]);
  const headerY = useTransform(scrollYProgress, [0, 0.05], [-20, 0]);

  return (
    <div className="min-h-screen bg-[#0a0e1a] overflow-x-hidden">
      {/* Fixed Header on Scroll */}
      <motion.header
        style={{ opacity: headerOpacity, y: headerY }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-md border-b border-[#1e2a3a]/50"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c9a84c] to-[#a88a3a] flex items-center justify-center">
              <span className="text-[#0a0e1a] font-bold text-sm">M</span>
            </div>
            <span className="text-sm font-bold text-[#f0f0f0]">MOBIIS ERP</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-[#94a3b8] hover:text-[#c9a84c] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-[#94a3b8] hover:text-[#c9a84c] transition-colors"
            >
              Request Demo
            </Link>
            <Link
              href="/dashboard"
              className="btn-primary px-4 py-2 rounded-lg text-sm"
            >
              Book a Demo
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#94a3b8]"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-[#0a0e1a] pt-20 px-6 md:hidden"
          >
            <nav className="space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-lg text-[#94a3b8] hover:text-[#c9a84c] py-2"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-8 space-y-3">
              <Link
                href="/dashboard"
                className="block w-full text-center py-3 border border-[#1e2a3a] rounded-lg text-[#94a3b8]"
              >
                Request Demo
              </Link>
              <Link
                href="/dashboard"
                className="block w-full text-center btn-primary py-3 rounded-lg"
              >
                Book a Demo
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#c9a84c]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3b82f6]/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%231e2a3a\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] text-xs font-medium text-[#c9a84c]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse"></span>
                COMPLETE IMEI + INVENTORY + LEDGER SYSTEM
              </span>
            </motion.div>

            {/* Headline */}
            <div className="space-y-2">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#f0f0f0] leading-tight"
              >
                Every IMEI.
              </motion.h1>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#f0f0f0] leading-tight"
              >
                Every Transaction.
              </motion.h1>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
              >
                <span className="text-gradient-gold gold-text-glow">Complete Visibility.</span>
              </motion.h1>
            </div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-lg text-[#94a3b8] max-w-lg leading-relaxed"
            >
              From China Parts to 100 Parties. Track every IMEI, manage inventory,
              handle returns, QC, repairs, and keep your accounts 100% connected.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="flex flex-wrap gap-4"
            >
              <MagneticButton className="btn-primary px-8 py-3.5 rounded-xl text-sm flex items-center gap-2">
                EXPLORE PLATFORM
                <ArrowRight size={16} />
              </MagneticButton>
              <MagneticButton className="btn-outline px-8 py-3.5 rounded-xl text-sm flex items-center gap-2">
                VIEW LIVE DEMO
                <PlayIcon />
              </MagneticButton>
            </motion.div>

            {/* Trust Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="pt-6 border-t border-[#1e2a3a]"
            >
              <p className="text-xs text-[#64748b] mb-3">Trusted by 250+ Manufacturers & Distributors</p>
              <div className="flex items-center gap-6 opacity-50">
                {['TechCorp', 'MobileX', 'PhonePro', 'DeviceHub', 'SmartTech'].map((name) => (
                  <span key={name} className="text-sm font-semibold text-[#64748b]">
                    {name}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Content - Floating Dashboard */}
          <div className="hidden lg:flex justify-center items-center">
            <FloatingDashboard />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="text-xs font-semibold tracking-wider text-[#c9a84c] uppercase">Features</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#f0f0f0] mt-3">
                Everything You Need
              </h2>
              <p className="text-[#94a3b8] mt-4 max-w-2xl mx-auto">
                A complete enterprise platform designed for mobile phone manufacturers and distributors.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <StaggerItem key={feature.title}>
                <motion.div
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-6 hover:border-[#2a3a50] transition-colors"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[rgba(201,168,76,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-lg bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center mb-4 group-hover:gold-glow transition-all">
                      <feature.icon size={22} className="text-[#c9a84c]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#f0f0f0] mb-2">{feature.title}</h3>
                    <p className="text-sm text-[#94a3b8] leading-relaxed">{feature.description}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs text-[#c9a84c] opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Learn more</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* How It Works */}
      <section id="modules" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d1321]/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="text-xs font-semibold tracking-wider text-[#c9a84c] uppercase">How It Works</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#f0f0f0] mt-3">
                One Connected Intelligence Layer
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {workflowSteps.map((step, index) => (
              <StaggerItem key={step.label}>
                <div className="relative text-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-4 hover:border-[#c9a84c]/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a84c]/20 to-[#a88a3a]/20 flex items-center justify-center mx-auto mb-2">
                      <span className="text-sm font-bold text-[#c9a84c]">{index + 1}</span>
                    </div>
                    <span className="text-xs font-medium text-[#f0f0f0] block">{step.label}</span>
                    <span className="text-[10px] text-[#64748b] block mt-1">{step.desc}</span>
                  </motion.div>
                  {index < workflowSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2">
                      <ChevronRight size={14} className="text-[#1e2a3a]" />
                    </div>
                  )}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FadeIn>
            <div className="relative bg-gradient-to-br from-[#0f1525] to-[#0d1321] border border-[#1e2a3a] rounded-2xl p-12 overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#c9a84c]/5 rounded-full blur-3xl" />
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-bold text-[#f0f0f0] mb-4">
                  Know Where Every Device Is.
                </h2>
                <p className="text-[#94a3b8] mb-8 max-w-xl mx-auto">
                  Join 250+ manufacturers and distributors who have transformed their operations with MOBIIS ERP.
                </p>
                <MagneticButton className="btn-primary px-10 py-4 rounded-xl text-base">
                  BOOK A PRIVATE DEMO
                </MagneticButton>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e2a3a] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c9a84c] to-[#a88a3a] flex items-center justify-center">
                <span className="text-[#0a0e1a] font-bold text-sm">M</span>
              </div>
              <div>
                <span className="text-sm font-bold text-[#f0f0f0]">MOBIIS ERP</span>
                <span className="text-xs text-[#64748b] ml-2">Inventory. IMEI. Intelligence.</span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-[#64748b]">
              <a href="#" className="hover:text-[#c9a84c] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#c9a84c] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#c9a84c] transition-colors">Support</a>
            </div>

            <p className="text-xs text-[#64748b]">© 2026 MOBIIS ERP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 2L13 8L3 14V2Z" fill="currentColor" />
    </svg>
  );
}
