'use client';

import { useState, useRef } from 'react';
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Database,
  Mail,
  Save,
  CheckCircle2,
  RotateCcw,
  Download,
  Cloud,
  Clock,
  Trash2,
  Moon,
  Sun,
  Monitor,
  Layout,
  AlignJustify,
  Server,
  Lock,
  KeyRound,
  Timer,
  Smartphone,
  Send,
  User,
  Building2,
  Globe,
  CalendarDays,
  Coins,
  Package,
  Upload,
  FileJson,
  AlertTriangle,
  HardDrive,
  Table2,
  History,
  MessageCircle,
  ShoppingCart,
  Wrench,
  Factory,
  X,
} from 'lucide-react';
import { useSettingsStore, useDataStore, useAuthStore } from '@/lib/store';
import { cn, hasPermission } from '@/lib/utils';

const allSettingSections = [
  {
    id: 'general',
    title: 'General Settings',
    icon: Settings,
    description: 'Configure basic application settings',
    permission: 'settings',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Manage alert and notification preferences',
    permission: '', // Available to all users
  },
  {
    id: 'security',
    title: 'Security',
    icon: Shield,
    description: 'Password policies and 2FA settings',
    permission: 'settings',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette,
    description: 'Theme and display preferences',
    permission: '', // Available to all users
  },
  {
    id: 'database',
    title: 'Database',
    icon: Database,
    description: 'Backup and data management',
    permission: 'settings',
  },
  {
    id: 'email',
    title: 'Email Configuration',
    icon: Mail,
    description: 'SMTP and email template settings',
    permission: 'settings',
  },
];

export default function SettingsPage() {
  const { currentUser } = useAuthStore();
  const userPerms = currentUser?.role?.permissions || [];

  // Filter sections based on user permissions
  const settingSections = allSettingSections.filter((s) =>
    !s.permission || hasPermission(userPerms, s.permission)
  );

  const [activeSection, setActiveSection] = useState(() => {
    // Default to first accessible section
    return settingSections[0]?.id || 'notifications';
  });
  const [saved, setSaved] = useState(false);

  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const updateNotification = useSettingsStore((s) => s.updateNotification);
  const updateSecurity = useSettingsStore((s) => s.updateSecurity);
  const updateAppearance = useSettingsStore((s) => s.updateAppearance);
  const updateDatabase = useSettingsStore((s) => s.updateDatabase);
  const updateEmail = useSettingsStore((s) => s.updateEmail);
  const resetSettings = useSettingsStore((s) => s.resetSettings);

  const exportAllData = useDataStore((s) => s.exportAllData);
  const importAllData = useDataStore((s) => s.importAllData);
  const clearAllData = useDataStore((s) => s.clearAllData);

  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [backupNote, setBackupNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      resetSettings();
      handleSave();
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobiis-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f0]">Settings</h1>
          <p className="text-sm text-[#94a3b8] mt-1">Configure your application preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-[#f0f0f0] hover:bg-[#1e2a3a] transition-colors flex items-center gap-2"
            title="Export Settings"
          >
            <Download size={16} />
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors flex items-center gap-2"
            title="Reset to Defaults"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handleSave}
            className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-1">
          {settingSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                activeSection === section.id
                  ? 'bg-[rgba(201,168,76,0.12)] text-[#c9a84c]'
                  : 'text-[#94a3b8] hover:bg-[rgba(201,168,76,0.08)] hover:text-[#c9a84c]'
              )}
            >
              <section.icon size={18} />
              <div>
                <span className="text-sm font-medium block">{section.title}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#f0f0f0]">
                {settingSections.find((s) => s.id === activeSection)?.title}
              </h2>
              <p className="text-sm text-[#94a3b8] mt-1">
                {settingSections.find((s) => s.id === activeSection)?.description}
              </p>
            </div>

            {activeSection === 'general' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2 flex items-center gap-2">
                      <Building2 size={14} /> Company Name
                    </label>
                    <input
                      type="text"
                      value={settings.companyName}
                      onChange={(e) => updateSettings({ companyName: e.target.value })}
                      className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0] input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2 flex items-center gap-2">
                      <Coins size={14} /> Default Currency
                    </label>
                    <select
                      value={settings.currency}
                      onChange={(e) => updateSettings({ currency: e.target.value as 'PKR' | 'USD' | 'EUR' })}
                      className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0]"
                    >
                      <option value="PKR">PKR - Pakistani Rupee</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2 flex items-center gap-2">
                      <Globe size={14} /> Time Zone
                    </label>
                    <select
                      value={settings.timeZone}
                      onChange={(e) => updateSettings({ timeZone: e.target.value })}
                      className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0]"
                    >
                      <option value="Asia/Karachi">Asia/Karachi (GMT+5)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                      <option value="UTC">UTC</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                      <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2 flex items-center gap-2">
                      <CalendarDays size={14} /> Date Format
                    </label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) => updateSettings({ dateFormat: e.target.value })}
                      className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0]"
                    >
                      <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                      <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-3">
                {[...([
                  { key: 'lowStock' as const, label: 'Low Stock Alerts', desc: 'Get notified when inventory is running low', icon: Package, perm: 'inventory' },
                  { key: 'outOfStock' as const, label: 'Out of Stock Alerts', desc: 'Get notified when inventory reaches zero', icon: Package, perm: 'inventory' },
                  { key: 'returns' as const, label: 'Return Notifications', desc: 'Alert when a return is received', icon: RotateCcw, perm: 'returns' },
                  { key: 'payments' as const, label: 'Payment Reminders', desc: 'Remind about outstanding payments', icon: Coins, perm: 'parties' },
                  { key: 'qcCompletion' as const, label: 'QC Completion', desc: 'Notify when QC inspection is complete', icon: CheckCircle2, perm: 'returns' },
                  { key: 'newSales' as const, label: 'New Sales', desc: 'Notify when new sales are created', icon: ShoppingCart, perm: 'sales' },
                  { key: 'repairOrders' as const, label: 'Repair Orders', desc: 'Notify about new and completed repairs', icon: Wrench, perm: 'repair' },
                  { key: 'batchStatus' as const, label: 'Batch Status', desc: 'Notify when production batches complete', icon: Factory, perm: 'production' },
                  { key: 'messages' as const, label: 'Chat Messages', desc: 'Notify when you receive new chat messages', icon: MessageCircle, perm: '' },
                ].filter((item) => !item.perm || hasPermission(userPerms, item.perm)))]
                  .map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-[#0d1321] border border-[#1e2a3a]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[rgba(201,168,76,0.1)] flex items-center justify-center">
                        <item.icon size={14} className="text-[#c9a84c]" />
                      </div>
                      <div>
                        <span className="text-sm text-[#f0f0f0] font-medium">{item.label}</span>
                        <p className="text-xs text-[#64748b]">{item.desc}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications[item.key]}
                        onChange={(e) => updateNotification(item.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#1e2a3a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c9a84c]"></div>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2 flex items-center gap-2">
                      <Lock size={14} /> Minimum Password Length
                    </label>
                    <input
                      type="number"
                      min={4}
                      max={32}
                      value={settings.security.minPasswordLength}
                      onChange={(e) => updateSecurity('minPasswordLength', parseInt(e.target.value) || 8)}
                      className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0] input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2 flex items-center gap-2">
                      <Timer size={14} /> Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={240}
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSecurity('sessionTimeout', parseInt(e.target.value) || 30)}
                      className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0] input-field"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { key: 'requireSpecialChar' as const, label: 'Require Special Characters', desc: 'Passwords must contain at least one special character' },
                    { key: 'requireNumber' as const, label: 'Require Numbers', desc: 'Passwords must contain at least one number' },
                    { key: 'twoFactorEnabled' as const, label: 'Two-Factor Authentication', desc: 'Enable 2FA for all admin users' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-[#0d1321] border border-[#1e2a3a]">
                      <div>
                        <span className="text-sm text-[#f0f0f0] font-medium">{item.label}</span>
                        <p className="text-xs text-[#64748b]">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security[item.key]}
                          onChange={(e) => updateSecurity(item.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[#1e2a3a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c9a84c]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'system', label: 'System', icon: Monitor },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => updateAppearance('theme', theme.value)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all',
                          settings.appearance.theme === theme.value
                            ? 'border-[#c9a84c] bg-[rgba(201,168,76,0.1)] text-[#c9a84c]'
                            : 'border-[#1e2a3a] bg-[#0d1321] text-[#94a3b8] hover:border-[#2a3a50]'
                        )}
                      >
                        <theme.icon size={20} />
                        <span className="text-sm font-medium">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { key: 'sidebarCollapsed' as const, label: 'Collapsed Sidebar', desc: 'Start with sidebar collapsed by default', icon: Layout },
                    { key: 'denseMode' as const, label: 'Dense Mode', desc: 'Reduce padding and spacing for more content', icon: AlignJustify },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-[#0d1321] border border-[#1e2a3a]">
                      <div className="flex items-center gap-3">
                        <item.icon size={14} className="text-[#64748b]" />
                        <div>
                          <span className="text-sm text-[#f0f0f0] font-medium">{item.label}</span>
                          <p className="text-xs text-[#64748b]">{item.desc}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.appearance[item.key]}
                          onChange={(e) => updateAppearance(item.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[#1e2a3a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c9a84c]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'database' && (
              <div className="space-y-6">
                {/* Storage Overview */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-[#0d1321] border border-[#1e2a3a]">
                    <div className="flex items-center gap-2 mb-2">
                      <HardDrive size={16} className="text-[#c9a84c]" />
                      <span className="text-sm text-[#94a3b8]">Total Records</span>
                    </div>
                    <span className="text-2xl font-bold text-[#f0f0f0]">
                      {useDataStore.getState().users.length +
                        useDataStore.getState().parties.length +
                        useDataStore.getState().imeis.length +
                        useDataStore.getState().sales.length +
                        useDataStore.getState().components.length}
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-[#0d1321] border border-[#1e2a3a]">
                    <div className="flex items-center gap-2 mb-2">
                      <Table2 size={16} className="text-[#c9a84c]" />
                      <span className="text-sm text-[#94a3b8]">Tables</span>
                    </div>
                    <span className="text-2xl font-bold text-[#f0f0f0]">15</span>
                  </div>
                  <div className="p-4 rounded-lg bg-[#0d1321] border border-[#1e2a3a]">
                    <div className="flex items-center gap-2 mb-2">
                      <History size={16} className="text-[#c9a84c]" />
                      <span className="text-sm text-[#94a3b8]">Backups</span>
                    </div>
                    <span className="text-2xl font-bold text-[#f0f0f0]">
                      {settings.database.backupHistory?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Auto Backup Settings */}
                <div className="p-4 rounded-lg bg-[#0d1321] border border-[#1e2a3a] space-y-4">
                  <h3 className="text-sm font-semibold text-[#f0f0f0] flex items-center gap-2">
                    <Cloud size={16} className="text-[#c9a84c]" />
                    Auto Backup Settings
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#94a3b8] mb-2 flex items-center gap-2">
                        <Clock size={14} /> Backup Frequency
                      </label>
                      <select
                        value={settings.database.backupFrequency}
                        onChange={(e) => updateDatabase('backupFrequency', e.target.value)}
                        className="w-full bg-[#0a0e17] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0]"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#94a3b8] mb-2 flex items-center gap-2">
                        <Trash2 size={14} /> Retention (days)
                      </label>
                      <input
                        type="number"
                        min={7}
                        max={365}
                        value={settings.database.retentionDays}
                        onChange={(e) => updateDatabase('retentionDays', parseInt(e.target.value) || 30)}
                        className="w-full bg-[#0a0e17] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0] input-field"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-sm text-[#f0f0f0] font-medium">Auto Backup</span>
                        <p className="text-xs text-[#64748b]">Automatically backup data on schedule</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.database.autoBackup}
                        onChange={(e) => updateDatabase('autoBackup', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#1e2a3a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c9a84c]"></div>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Export */}
                  <div className="p-4 rounded-lg bg-[#0d1321] border border-[#1e2a3a]">
                    <div className="flex items-center gap-2 mb-3">
                      <Download size={16} className="text-[#22c55e]" />
                      <span className="text-sm font-medium text-[#f0f0f0]">Export All Data</span>
                    </div>
                    <p className="text-xs text-[#64748b] mb-3">Download a complete JSON backup of all tables including users, inventory, sales, and IMEIs.</p>
                    <button
                      onClick={() => {
                        const { json, size, tables } = exportAllData();
                        const blob = new Blob([json], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `mobiis-backup-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        const newRecord = {
                          id: `BK-${Date.now()}`,
                          timestamp: new Date().toISOString(),
                          size,
                          tables,
                          note: backupNote || 'Manual export',
                        };
                        updateDatabase('backupHistory', [newRecord, ...(settings.database.backupHistory || [])].slice(0, 20));
                        updateDatabase('lastBackup', newRecord.timestamp);
                        setBackupNote('');
                        handleSave();
                      }}
                      className="btn-primary btn-press w-full px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                    >
                      <FileJson size={16} />
                      Export JSON Backup
                    </button>
                  </div>

                  {/* Import */}
                  <div className="p-4 rounded-lg bg-[#0d1321] border border-[#1e2a3a]">
                    <div className="flex items-center gap-2 mb-3">
                      <Upload size={16} className="text-[#3b82f6]" />
                      <span className="text-sm font-medium text-[#f0f0f0]">Import Data</span>
                    </div>
                    <p className="text-xs text-[#64748b] mb-3">Restore from a previously exported JSON backup file. This will overwrite current data.</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const text = ev.target?.result as string;
                          const result = importAllData(text);
                          if (result.success) {
                            setImportStatus({ success: true, message: `Restored ${result.imported} tables successfully` });
                          } else {
                            setImportStatus({ success: false, message: result.errors.join(', ') });
                          }
                          handleSave();
                        };
                        reader.readAsText(file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 bg-[#1e2a3a] hover:bg-[#2a3a4f] text-[#f0f0f0] transition-colors"
                    >
                      <Upload size={16} />
                      Select Backup File
                    </button>
                    {importStatus && (
                      <div className={`mt-2 p-2 rounded text-xs flex items-center gap-2 ${importStatus.success ? 'bg-[rgba(34,197,94,0.1)] text-[#22c55e]' : 'bg-[rgba(239,68,68,0.1)] text-[#ef4444]'}`}>
                        {importStatus.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                        {importStatus.message}
                      </div>
                    )}
                  </div>
                </div>

                {/* Backup History */}
                <div className="p-4 rounded-lg bg-[#0d1321] border border-[#1e2a3a]">
                  <h3 className="text-sm font-semibold text-[#f0f0f0] flex items-center gap-2 mb-3">
                    <History size={16} className="text-[#c9a84c]" />
                    Backup History
                  </h3>
                  {(settings.database.backupHistory || []).length === 0 ? (
                    <p className="text-sm text-[#64748b] text-center py-4">No backups yet. Export your data to create the first backup.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {(settings.database.backupHistory || []).map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0e17] border border-[#1e2a3a]">
                          <div className="flex items-center gap-3">
                            <FileJson size={16} className="text-[#c9a84c]" />
                            <div>
                              <span className="text-sm text-[#f0f0f0]">{new Date(record.timestamp).toLocaleString()}</span>
                              <p className="text-xs text-[#64748b]">{record.tables?.length || 0} tables • {(record.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <span className="text-xs text-[#94a3b8] bg-[#1e2a3a] px-2 py-1 rounded">{record.note || 'Manual'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="p-4 rounded-lg bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)]">
                  <h3 className="text-sm font-semibold text-[#ef4444] flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} />
                    Danger Zone
                  </h3>
                  <p className="text-xs text-[#94a3b8] mb-3">Clear all application data. This action cannot be undone. Make sure to export a backup first.</p>
                  {!showClearConfirm ? (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="px-4 py-2 rounded-lg text-sm flex items-center gap-2 bg-[rgba(239,68,68,0.15)] hover:bg-[rgba(239,68,68,0.25)] text-[#ef4444] transition-colors"
                    >
                      <Trash2 size={16} />
                      Clear All Data
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          clearAllData();
                          setShowClearConfirm(false);
                          handleSave();
                        }}
                        className="px-4 py-2 rounded-lg text-sm flex items-center gap-2 bg-[#ef4444] hover:bg-[#dc2626] text-white transition-colors"
                      >
                        <Trash2 size={16} />
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-[#f0f0f0] transition-colors"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'email' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2 flex items-center gap-2">
                      <Server size={14} /> SMTP Host
                    </label>
                    <input
                      type="text"
                      value={settings.email.smtpHost}
                      onChange={(e) => updateEmail('smtpHost', e.target.value)}
                      className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0] input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2 flex items-center gap-2">
                      <KeyRound size={14} /> SMTP Port
                    </label>
                    <input
                      type="number"
                      value={settings.email.smtpPort}
                      onChange={(e) => updateEmail('smtpPort', parseInt(e.target.value) || 587)}
                      className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0] input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2 flex items-center gap-2">
                      <User size={14} /> SMTP Username
                    </label>
                    <input
                      type="text"
                      value={settings.email.smtpUser}
                      onChange={(e) => updateEmail('smtpUser', e.target.value)}
                      className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0] input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2 flex items-center gap-2">
                      <Lock size={14} /> SMTP Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0] input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2 flex items-center gap-2">
                      <Send size={14} /> From Name
                    </label>
                    <input
                      type="text"
                      value={settings.email.fromName}
                      onChange={(e) => updateEmail('fromName', e.target.value)}
                      className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0] input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2 flex items-center gap-2">
                      <Mail size={14} /> From Email
                    </label>
                    <input
                      type="email"
                      value={settings.email.fromEmail}
                      onChange={(e) => updateEmail('fromEmail', e.target.value)}
                      className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0] input-field"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d1321] border border-[#1e2a3a]">
                  <div className="flex items-center gap-3">
                    <Shield size={14} className="text-[#64748b]" />
                    <div>
                      <span className="text-sm text-[#f0f0f0] font-medium">Use TLS/SSL</span>
                      <p className="text-xs text-[#64748b]">Encrypt email communication</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email.smtpSecure}
                      onChange={(e) => updateEmail('smtpSecure', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#1e2a3a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c9a84c]"></div>
                  </label>
                </div>
                <button
                  onClick={() => alert('Test email sent!')}
                  className="btn-outline btn-press w-full px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Send Test Email
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
