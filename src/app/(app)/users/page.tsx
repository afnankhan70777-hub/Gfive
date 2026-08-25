'use client';

import { useState, useMemo } from 'react';
import {
  Shield,
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  ChevronDown,
  Save,
  Eye,
  EyeOff,
  Lock,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Factory,
  RotateCcw,
  Wrench,
  Smartphone,
  BookOpen,
  BarChart3,
  Settings,
  Check,
  Minus,
} from 'lucide-react';
import { useDataStore, useAuthStore } from '@/lib/store';
import { cn, hasPermission, canDoAction } from '@/lib/utils';
import * as supabaseData from '@/lib/supabase-data';

interface CrudPerm {
  key: string;
  label: string;
  icon: React.ElementType;
  desc: string;
  actions: { key: string; label: string }[];
}

const CRUD_PERMISSIONS: CrudPerm[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    desc: 'View main dashboard and KPIs',
    actions: [],
  },
  {
    key: 'sales',
    label: 'Sales / Dispatch',
    icon: ShoppingCart,
    desc: 'Manage sales and dispatches',
    actions: [
      { key: 'create', label: 'Add' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'inventory',
    label: 'Parts Inventory',
    icon: Package,
    desc: 'Manage parts and stock',
    actions: [
      { key: 'create', label: 'Add' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'production',
    label: 'Production',
    icon: Factory,
    desc: 'Manage production batches',
    actions: [
      { key: 'create', label: 'Add' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'returns',
    label: 'Returns & QC',
    icon: RotateCcw,
    desc: 'Process returns and QC',
    actions: [
      { key: 'create', label: 'Add' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'repair',
    label: 'Repair Management',
    icon: Wrench,
    desc: 'Manage repair orders',
    actions: [
      { key: 'create', label: 'Add' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'imei',
    label: 'IMEI Management',
    icon: Smartphone,
    desc: 'Track IMEI and batches',
    actions: [
      { key: 'create', label: 'Add' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'parties',
    label: 'Party Ledger',
    icon: BookOpen,
    desc: 'Manage customers and ledgers',
    actions: [
      { key: 'create', label: 'Add' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports & Analytics',
    icon: BarChart3,
    desc: 'Access reports and analytics',
    actions: [],
  },
  {
    key: 'users',
    label: 'Users & Roles',
    icon: Users,
    desc: 'Manage users and permissions',
    actions: [
      { key: 'create', label: 'Add' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    desc: 'Configure system settings',
    actions: [],
  },
  {
    key: '*',
    label: 'All Access (Super Admin)',
    icon: Shield,
    desc: 'Full unrestricted access to everything',
    actions: [],
  },
];

const ALL_PERMS_FLAT = CRUD_PERMISSIONS.flatMap(p => [
  { key: p.key, label: p.label },
  ...p.actions.map(a => ({ key: `${p.key}:${a.key}`, label: `${p.label} — ${a.label}` })),
]);

export default function UsersPage() {
  const users = useDataStore((s) => s.users);
  const roles = useDataStore((s) => s.roles);
  const addUser = useDataStore((s) => s.addUser);
  const updateUser = useDataStore((s) => s.updateUser);
  const deleteUser = useDataStore((s) => s.deleteUser);
  const addRole = useDataStore((s) => s.addRole);
  const updateRole = useDataStore((s) => s.updateRole);
  const deleteRole = useDataStore((s) => s.deleteRole);
  const changeUserPassword = useDataStore((s) => s.changeUserPassword);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  const currentUser = useAuthStore((s) => s.currentUser);
  const canManageUsers = hasPermission(currentUser?.role?.permissions || [], 'users');

  // Modals
  const [userModal, setUserModal] = useState<{ open: boolean; user?: any }>({ open: false });
  const [roleModal, setRoleModal] = useState<{ open: boolean; role?: any }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: 'user' | 'role'; id: string } | null>(null);
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; userId?: string; userName?: string }>({ open: false });
  const [showPassword, setShowPassword] = useState(false);
  const [rolePerms, setRolePerms] = useState<string[]>([]);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rolesWithCounts = useMemo(() => {
    return roles.map((role) => ({
      ...role,
      users: users.filter((u) => u.role.name === role.name).length,
    }));
  }, [roles, users]);

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get('name')).trim();
    const email = String(formData.get('email') || name).trim();
    const password = String(formData.get('password') || '').trim();
    const roleName = String(formData.get('role'));
    const status = String(formData.get('status')) as 'active' | 'inactive';

    if (!name || !roleName) return;

    const roleObj = roles.find((r) => r.name === roleName);
    if (!roleObj) return;

    try {
      if (userModal.user) {
        await supabaseData.updateUser(userModal.user.id, { name, email: email || name, role: roleObj, status });
        updateUser(userModal.user.id, { name, email: email || name, role: roleObj, status });
      } else {
        const newUser = await supabaseData.addUser({ name, email: email || name, password: password || 'password', role: roleObj, status, lastLogin: '-', avatar: '' });
        addUser(newUser);
      }
      setUserModal({ open: false });
    } catch (err) {
      console.error('Failed to save user:', err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await supabaseData.deleteUser(id);
      deleteUser(id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await supabaseData.updateUser(id, { status: newStatus });
      updateUser(id, { status: newStatus });
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleSaveRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get('name')).trim();
    const perms = rolePerms;

    if (!name) return;

    try {
      if (roleModal.role) {
        await supabaseData.updateRole(roleModal.role.id, { name, permissions: perms });
        updateRole(roleModal.role.id, { name, permissions: perms });
      } else {
        const newRole = await supabaseData.addRole({ name, permissions: perms });
        addRole(newRole);
      }
      setRoleModal({ open: false });
      setRolePerms([]);
    } catch (err) {
      console.error('Failed to save role:', err);
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await supabaseData.deleteRole(id);
      deleteRole(id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete role:', err);
    }
  };

  const openUserModal = (user?: any) => setUserModal({ open: true, user });
  const openRoleModal = (role?: any) => {
    setRolePerms(role?.permissions || []);
    setRoleModal({ open: true, role });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f0]">Users & Roles</h1>
          <p className="text-sm text-[#94a3b8] mt-1">Manage users and role-based access control</p>
        </div>
        {canManageUsers && (
          <button
            onClick={() => openUserModal()}
            className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Add User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#0f1525] border border-[#1e2a3a] rounded-lg p-1 w-fit">
        {[
          { id: 'users', label: 'Users', icon: Users },
          { id: 'roles', label: 'Roles', icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors',
              activeTab === tab.id
                ? 'bg-[rgba(201,168,76,0.15)] text-[#c9a84c]'
                : 'text-[#94a3b8] hover:text-[#f0f0f0]'
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f1525] border border-[#1e2a3a] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#f0f0f0] placeholder-[#64748b] input-field"
            />
          </div>

          <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e2a3a]">
                    {['User', 'Role', 'Status', 'Last Login', 'Password', 'Actions'].map((header) => (
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
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-[#1e2a3a]/50 table-row-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#a88a3a] flex items-center justify-center">
                            <span className="text-[#0a0e1a] font-semibold text-xs">{(user.name || '?')[0]}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-[#f0f0f0]">{user.name}</span>
                            <p className="text-xs text-[#64748b]">ID: {user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#94a3b8]">{user.role.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors',
                            user.status === 'active' && 'badge-success',
                            user.status === 'inactive' && 'badge-danger'
                          )}
                        >
                          {user.status === 'active' && <CheckCircle2 size={10} />}
                          {user.status === 'inactive' && <XCircle size={10} />}
                          {(user.status || 'inactive').toUpperCase()}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#94a3b8]">{user.lastLogin || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {canManageUsers ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-[#94a3b8]">{user.password || '—'}</span>
                            <button
                              onClick={() => setPasswordModal({ open: true, userId: user.id, userName: user.name })}
                              className="p-1 rounded hover:bg-[rgba(201,168,76,0.1)] text-[#64748b] hover:text-[#c9a84c] transition-colors"
                              title="Change password"
                            >
                              <Lock size={12} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#64748b]">••••••••</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canManageUsers ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openUserModal(user)}
                              className="p-1.5 rounded hover:bg-[rgba(201,168,76,0.1)] text-[#64748b] hover:text-[#c9a84c] transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ open: true, type: 'user', id: user.id })}
                              className="p-1.5 rounded hover:bg-[rgba(239,68,68,0.1)] text-[#64748b] hover:text-[#ef4444] transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#64748b]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64748b]">
                        No users found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'roles' && (
        <>
          {canManageUsers && (
            <div className="flex justify-end">
              <button
                onClick={() => openRoleModal()}
                className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <Plus size={16} />
                Add Role
              </button>
            </div>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rolesWithCounts.map((role) => (
              <div
                key={role.id}
                className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl p-5 hover:border-[#2a3a50] transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center">
                      <Shield size={18} className="text-[#c9a84c]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#f0f0f0]">{role.name}</h3>
                      <p className="text-xs text-[#64748b]">
                        {role.users} user{role.users !== 1 && 's'}
                      </p>
                    </div>
                  </div>
                  {canManageUsers && (
                    <div className="relative">
                      <button
                        onClick={() => setRoleDropdown(roleDropdown === role.id ? null : role.id)}
                        className="p-1.5 rounded hover:bg-[#1e2a3a] text-[#64748b]"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {roleDropdown === role.id && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-[#0f1525] border border-[#1e2a3a] rounded-lg shadow-lg z-20 py-1">
                          <button
                            onClick={() => {
                              openRoleModal(role);
                              setRoleDropdown(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-[#94a3b8] hover:bg-[rgba(201,168,76,0.1)] hover:text-[#c9a84c] flex items-center gap-2"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirm({ open: true, type: 'role', id: role.id });
                              setRoleDropdown(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-[#94a3b8] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444] flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-[#64748b] uppercase">Permissions</span>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((perm: string) => {
                      const permLabel = ALL_PERMS_FLAT.find(p => p.key === perm)?.label || perm;
                      return (
                        <span
                          key={perm}
                          className="px-2 py-1 rounded-md bg-[#0d1321] border border-[#1e2a3a] text-xs text-[#94a3b8]"
                        >
                          {permLabel}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* User Modal */}
      {userModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#f0f0f0]">
                {userModal.user ? 'Edit User' : 'Add User'}
              </h2>
              <button
                onClick={() => setUserModal({ open: false })}
                className="p-1 rounded hover:bg-[#1e2a3a] text-[#64748b]"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">Username</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={userModal.user?.name || ''}
                  required
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0] input-field"
                  placeholder="e.g. john_doe"
                />
              </div>
              {!userModal.user && (
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-1">Password <span className="text-[#ef4444]">*</span></label>
                  <input
                    name="password"
                    type="text"
                    defaultValue=""
                    required
                    minLength={4}
                    placeholder="Enter login password"
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0] placeholder-[#64748b] input-field"
                  />
                </div>
              )}
              {userModal.user && (
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-1">Email / Login ID</label>
                  <input
                    name="email"
                    type="text"
                    defaultValue={userModal.user?.email || ''}
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0] input-field"
                    placeholder="e.g. john@mobiis.com"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">Role</label>
                <div className="relative">
                  <select
                    name="role"
                    defaultValue={userModal.user?.role?.name || roles[0]?.name}
                    required
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0] appearance-none"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">Status</label>
                <div className="relative">
                  <select
                    name="status"
                    defaultValue={userModal.user?.status || 'active'}
                    required
                    className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0] appearance-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserModal({ open: false })}
                  className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-[#f0f0f0] hover:bg-[#1e2a3a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  <Save size={14} />
                  {userModal.user ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {roleModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#f0f0f0]">
                {roleModal.role ? 'Edit Role' : 'Add Role'}
              </h2>
              <button
                onClick={() => setRoleModal({ open: false })}
                className="p-1 rounded hover:bg-[#1e2a3a] text-[#64748b]"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveRole} className="space-y-5">
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">Role Name</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={roleModal.role?.name || ''}
                  required
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0f0] input-field"
                  placeholder="e.g. Sales Manager"
                />
              </div>

              {/* Permission Groups */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-[#94a3b8]">Access Permissions</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const all = CRUD_PERMISSIONS.flatMap(p => [
                          p.key,
                          ...p.actions.map(a => `${p.key}:${a.key}`),
                        ]);
                        setRolePerms(all);
                      }}
                      className="text-xs px-2 py-1 rounded bg-[#1e2a3a] text-[#94a3b8] hover:text-[#f0f0f0] transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setRolePerms([])}
                      className="text-xs px-2 py-1 rounded bg-[#1e2a3a] text-[#94a3b8] hover:text-[#f0f0f0] transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {CRUD_PERMISSIONS.map((mod) => {
                    const Icon = mod.icon;
                    const isView = rolePerms.includes(mod.key);
                    const actionKeys = mod.actions.map(a => `${mod.key}:${a.key}`);
                    const actionSelected = actionKeys.filter(k => rolePerms.includes(k));
                    const allActions = actionSelected.length === actionKeys.length;

                    return (
                      <div key={mod.key} className="bg-[#0d1321] border border-[#1e2a3a] rounded-lg p-3">
                        {/* Module header with view toggle */}
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setRolePerms(prev =>
                                isView
                                  ? prev.filter(k => k !== mod.key && !actionKeys.includes(k))
                                  : [...prev, mod.key]
                              );
                            }}
                            className="flex items-center gap-3 text-left flex-1"
                          >
                            <div className={cn(
                              'w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                              isView
                                ? 'bg-[#c9a84c] border-[#c9a84c]'
                                : 'border-[#1e2a3a] bg-[#0f1525]'
                            )}>
                              {isView && <Check size={12} className="text-[#0a0e1a]" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Icon size={14} className={isView ? 'text-[#c9a84c]' : 'text-[#64748b]'} />
                                <span className={cn('text-sm font-medium', isView ? 'text-[#f0f0f0]' : 'text-[#94a3b8]')}>
                                  {mod.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#64748b]">{mod.desc}</p>
                            </div>
                          </button>

                          {/* Action toggles */}
                          {mod.actions.length > 0 && (
                            <div className="flex items-center gap-1">
                              {mod.actions.map((act) => {
                                const actKey = `${mod.key}:${act.key}`;
                                const actOn = rolePerms.includes(actKey);
                                return (
                                  <button
                                    key={actKey}
                                    type="button"
                                    onClick={() => {
                                      setRolePerms(prev => {
                                        const next = actOn
                                          ? prev.filter(k => k !== actKey)
                                          : [...prev, actKey];
                                        // Auto-enable view if any action is selected
                                        if (!actOn && !next.includes(mod.key)) {
                                          return [...next, mod.key];
                                        }
                                        return next;
                                      });
                                    }}
                                    className={cn(
                                      'px-2 py-1 rounded text-[11px] font-medium border transition-colors',
                                      actOn
                                        ? 'bg-[rgba(201,168,76,0.12)] border-[#c9a84c]/30 text-[#c9a84c]'
                                        : 'bg-[#0f1525] border-[#1e2a3a] text-[#64748b] hover:text-[#94a3b8]'
                                    )}
                                  >
                                    {act.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Hidden inputs to submit permissions with form */}
                {rolePerms.map((p) => (
                  <input key={p} type="hidden" name="permissions" value={p} />
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleModal({ open: false })}
                  className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-[#f0f0f0] hover:bg-[#1e2a3a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  <Save size={14} />
                  {roleModal.role ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {passwordModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#f0f0f0]">Change Password</h2>
              <button
                onClick={() => setPasswordModal({ open: false })}
                className="p-1 rounded hover:bg-[#1e2a3a] text-[#64748b]"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-[#94a3b8] mb-4">
              Updating password for <span className="text-[#f0f0f0] font-medium">{passwordModal.userName}</span>
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                const newPassword = String(formData.get('newPassword')).trim();
                if (!newPassword || !passwordModal.userId) return;
                try {
                  await supabaseData.changeUserPassword(passwordModal.userId, newPassword);
                  changeUserPassword(passwordModal.userId, newPassword);
                  setPasswordModal({ open: false });
                } catch (err) {
                  console.error('Failed to change password:', err);
                }
              }}
              className="space-y-4"
            >
              <div className="relative">
                <input
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Enter new password"
                  className="w-full bg-[#0d1321] border border-[#1e2a3a] rounded-lg px-4 py-2.5 pr-10 text-sm text-[#f0f0f0] placeholder-[#64748b] input-field"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModal({ open: false })}
                  className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-[#f0f0f0] hover:bg-[#1e2a3a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  <Save size={14} />
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#0f1525] border border-[#1e2a3a] rounded-xl w-full max-w-sm p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-[#f0f0f0] mb-2">Confirm Delete</h2>
            <p className="text-sm text-[#94a3b8] mb-6">
              {deleteConfirm.type === 'user'
                ? 'Are you sure you want to delete this user? This action cannot be undone.'
                : 'Are you sure you want to delete this role? Users assigned to this role will be reassigned to Administrator.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-[#f0f0f0] hover:bg-[#1e2a3a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteConfirm.type === 'user'
                    ? handleDeleteUser(deleteConfirm.id)
                    : handleDeleteRole(deleteConfirm.id)
                }
                className="px-4 py-2 rounded-lg text-sm bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
