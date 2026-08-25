import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  User, Role, Party, Product, Model, Batch, Component, IMEI,
  Sale, Return, QCInspection, RepairOrder, InventoryTransaction, Payment,
  DashboardStats, BOMItem, AppSettings, AuditLog
} from '@/lib/types';
import {
  initialUsers, initialRoles, initialParties, initialProducts, initialModels,
  initialBatches, initialComponents, initialIMEIs, initialSales, initialReturns,
  initialQCInspections, initialRepairOrders, initialTransactions, initialPayments,
  initialDashboardStats, initialBOMItems
} from './initial-data';

// Build timestamp: 2026-08-25T15:20:00Z - cache bust v2

// Auth State
interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, allUsers?: User[]) => boolean;
  logout: () => void;
}

// Data State
interface DataState {
  users: User[];
  roles: Role[];
  parties: Party[];
  products: Product[];
  models: Model[];
  batches: Batch[];
  components: Component[];
  bomItems: BOMItem[];
  imeis: IMEI[];
  sales: Sale[];
  returns: Return[];
  qcInspections: QCInspection[];
  repairOrders: RepairOrder[];
  transactions: InventoryTransaction[];
  payments: Payment[];
  dashboardStats: DashboardStats;
  auditLogs: AuditLog[];

  // Hydration
  setData: (data: Partial<Omit<DataState, 'setData' | 'addAuditLog'>>) => void;

  // Audit Log
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;

  // User CRUD
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  changeUserPassword: (id: string, newPassword: string) => void;

  // Role CRUD
  addRole: (role: Omit<Role, 'id'>) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  deleteRole: (id: string) => void;

  // Party CRUD
  addParty: (party: Omit<Party, 'id'>) => void;
  updateParty: (id: string, updates: Partial<Party>) => void;
  deleteParty: (id: string) => void;

  // Component/Parts CRUD
  addComponent: (component: Omit<Component, 'id' | 'available' | 'status'>) => void;
  updateComponent: (id: string, updates: Partial<Component>) => void;
  deleteComponent: (id: string) => void;
  adjustStock: (id: string, quantity: number, reason: string) => void;
  consumePartsForBatch: (modelId: string, quantity: number) => void;

  // BOM CRUD
  addBOMItem: (item: Omit<BOMItem, 'id'>) => void;
  updateBOMItem: (id: string, updates: Partial<BOMItem>) => void;
  deleteBOMItem: (id: string) => void;

  // IMEI CRUD
  addIMEI: (imei: Omit<IMEI, 'id' | 'history'>) => void;
  updateIMEI: (id: string, updates: Partial<IMEI>) => void;
  deleteIMEI: (id: string) => void;
  addIMEIHistory: (imeiId: string, event: Omit<IMEI['history'][0], 'id'>) => void;

  // Model CRUD
  addModel: (model: Omit<Model, 'id'>) => void;
  updateModel: (id: string, updates: Partial<Model>) => void;
  deleteModel: (id: string) => void;

  // Batch CRUD
  addBatch: (batch: Omit<Batch, 'id' | 'createdAt'>) => void;
  updateBatch: (id: string, updates: Partial<Batch>) => void;
  deleteBatch: (id: string) => void;

  // Sale CRUD
  addSale: (sale: Omit<Sale, 'id'>) => void;
  updateSale: (id: string, updates: Partial<Sale>) => void;
  deleteSale: (id: string) => void;

  // Return CRUD
  addReturn: (ret: Omit<Return, 'id'>) => void;
  updateReturn: (id: string, updates: Partial<Return>) => void;
  deleteReturn: (id: string) => void;
  processQC: (returnId: string, qcData: { status: Return['qcStatus']; notes: string }) => void;

  // Repair CRUD
  addRepairOrder: (order: Omit<RepairOrder, 'id'>) => void;
  updateRepairOrder: (id: string, updates: Partial<RepairOrder>) => void;
  deleteRepairOrder: (id: string) => void;

  // Payment CRUD
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  deletePayment: (id: string) => void;

  // Transaction CRUD
  addTransaction: (transaction: Omit<InventoryTransaction, 'id'>) => void;

  // Dashboard
  recalculateDashboardStats: () => void;

  // Data Management
  exportAllData: () => { json: string; size: number; tables: string[] };
  importAllData: (json: string) => { success: boolean; imported: number; errors: string[] };
  clearAllData: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      login: (username, password, allUsers) => {
        const userPool = allUsers && allUsers.length > 0 ? allUsers : initialUsers;
        const normalizedUsername = username.trim().toLowerCase();
        const user = userPool.find(u => {
          const matchName = u.name?.toLowerCase() === normalizedUsername;
          const matchAdminShorthand = normalizedUsername === 'admin' && u.email?.toLowerCase() === 'admin@mobiis.com';
          return matchName || matchAdminShorthand;
        });
        if (user) {
          const isAdmin = user.email?.toLowerCase() === 'admin@mobiis.com';
          const userPassword = user.password || (isAdmin ? 'admin123' : 'password');
          if (userPassword === password) {
            const now = new Date().toISOString();
            const updatedUser = { ...user, lastLogin: now };
            set({ currentUser: updatedUser, isAuthenticated: true });
            // Update lastLogin in users array
            try {
              const dataStore = useDataStore.getState();
              const userIdx = dataStore.users.findIndex(u => u.id === user.id);
              if (userIdx !== -1) {
                dataStore.updateUser(user.id, { lastLogin: now });
              }
            } catch {}
            // Log login
            try {
              const dataStore = useDataStore.getState();
              dataStore.addAuditLog({
                userId: user.id,
                userName: user.name,
                action: 'login',
                entity: 'auth',
                details: 'User logged in',
              });
            } catch {}
            return true;
          }
        }
        return false;
      },
      logout: () => {
        const currentUser = useAuthStore.getState().currentUser;
        set({ currentUser: null, isAuthenticated: false });
        // Log logout
        try {
          const dataStore = useDataStore.getState();
          dataStore.addAuditLog({
            userId: currentUser?.id || 'unknown',
            userName: currentUser?.name || 'Unknown',
            action: 'logout',
            entity: 'auth',
            details: 'User logged out',
          });
        } catch {}
      },
    }),
    {
      name: 'mobiis-auth',
    }
  )
);

export const useDataStore = create<DataState>()(
  persist(
    immer((set, get) => {
      const currentUser = () => {
        try { return useAuthStore.getState().currentUser; } catch { return null; }
      };

      const logAudit = (state: any, log: Omit<AuditLog, 'id' | 'timestamp'>) => {
        const id = `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        state.auditLogs.unshift({
          ...log,
          id,
          timestamp: new Date().toISOString(),
        });
        if (state.auditLogs.length > 5000) {
          state.auditLogs = state.auditLogs.slice(0, 5000);
        }
      };

      return {
    users: initialUsers,
    roles: initialRoles,
    parties: initialParties,
    products: initialProducts,
    models: initialModels,
    batches: initialBatches,
    components: initialComponents,
    bomItems: initialBOMItems,
    imeis: initialIMEIs,
    sales: initialSales,
    returns: initialReturns,
    qcInspections: initialQCInspections,
    repairOrders: initialRepairOrders,
    transactions: initialTransactions,
    payments: initialPayments,
    dashboardStats: initialDashboardStats,
    auditLogs: [],

    // Hydration — overwrite store with Supabase data (preserve auditLogs and lastLogin)
    setData: (data) => set((state) => {
      if (data.users !== undefined) {
        // Preserve lastLogin from existing local users if Supabase data lacks it
        const existingUsers = state.users;
        state.users = (data.users as User[]).map((incoming) => {
          const existing = existingUsers.find((u) => u.id === incoming.id);
          if (existing && (!incoming.lastLogin || incoming.lastLogin === '-')) {
            return { ...incoming, lastLogin: existing.lastLogin };
          }
          return incoming;
        });
      }
      if (data.roles !== undefined) state.roles = data.roles as Role[];
      if (data.parties !== undefined) state.parties = data.parties as Party[];
      if (data.products !== undefined) state.products = data.products as Product[];
      if (data.models !== undefined) state.models = data.models as Model[];
      if (data.batches !== undefined) state.batches = data.batches as Batch[];
      if (data.components !== undefined) state.components = data.components as Component[];
      if (data.bomItems !== undefined) state.bomItems = data.bomItems as BOMItem[];
      if (data.imeis !== undefined) state.imeis = data.imeis as IMEI[];
      if (data.sales !== undefined) state.sales = data.sales as Sale[];
      if (data.returns !== undefined) state.returns = data.returns as Return[];
      if (data.qcInspections !== undefined) state.qcInspections = data.qcInspections as QCInspection[];
      if (data.repairOrders !== undefined) state.repairOrders = data.repairOrders as RepairOrder[];
      if (data.transactions !== undefined) state.transactions = data.transactions as InventoryTransaction[];
      if (data.payments !== undefined) state.payments = data.payments as Payment[];
      if (data.dashboardStats !== undefined) state.dashboardStats = data.dashboardStats as DashboardStats;
      // NOTE: auditLogs is intentionally NOT overwritten by setData
      // so persisted audit logs survive Supabase sync
    }),

    // Audit Log
    addAuditLog: (log) => set((state) => {
      logAudit(state, log);
    }),

    // User CRUD
    addUser: (user) => set((state) => {
      const id = (user as any).id || `USR-${Date.now()}`;
      state.users.push({ ...user, id } as User);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'create',
        entity: 'user',
        entityId: id,
        entityName: (user as any).name || id,
        details: `Created user ${(user as any).name || id}`,
      });
    }),
    updateUser: (id, updates) => set((state) => {
      const idx = state.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        Object.assign(state.users[idx], updates);
        const u = currentUser();
        logAudit(state, {
          userId: u?.id || 'system',
          userName: u?.name || 'System',
          action: 'update',
          entity: 'user',
          entityId: id,
          entityName: state.users[idx].name || id,
          details: `Updated user ${state.users[idx].name || id}`,
        });
      }
    }),
    deleteUser: (id) => set((state) => {
      const target = state.users.find(u => u.id === id);
      state.users = state.users.filter(u => u.id !== id);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'delete',
        entity: 'user',
        entityId: id,
        entityName: target?.name || id,
        details: `Deleted user ${target?.name || id}`,
      });
    }),
    changeUserPassword: (id, newPassword) => set((state) => {
      const idx = state.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        state.users[idx].password = newPassword;
        const u = currentUser();
        logAudit(state, {
          userId: u?.id || 'system',
          userName: u?.name || 'System',
          action: 'update',
          entity: 'user',
          entityId: id,
          entityName: state.users[idx].name || id,
          details: `Changed password for user ${state.users[idx].name || id}`,
        });
      }
    }),

    // Role CRUD
    addRole: (role) => set((state) => {
      const id = (role as any).id || `ROLE-${Date.now()}`;
      state.roles.push({ ...role, id } as Role);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'create',
        entity: 'role',
        entityId: id,
        entityName: (role as any).name || id,
        details: `Created role ${(role as any).name || id}`,
      });
    }),
    updateRole: (id, updates) => set((state) => {
      const idx = state.roles.findIndex(r => r.id === id);
      if (idx !== -1) {
        const oldRole = state.roles[idx];
        Object.assign(state.roles[idx], updates);
        const updatedRole = state.roles[idx];
        state.users.forEach(u => {
          if (u.role.id === id || u.role.name === oldRole.name) {
            u.role = {
              id: updatedRole.id,
              name: updatedRole.name,
              permissions: updatedRole.permissions,
            };
          }
        });
        const u = currentUser();
        logAudit(state, {
          userId: u?.id || 'system',
          userName: u?.name || 'System',
          action: 'update',
          entity: 'role',
          entityId: id,
          entityName: updatedRole.name || id,
          details: `Updated role ${updatedRole.name || id}`,
        });
      }
    }),
    deleteRole: (id) => set((state) => {
      const role = state.roles.find(r => r.id === id);
      if (role) {
        state.users.forEach(u => {
          if (u.role.id === id || u.role.name === role.name) {
            u.role = { id: 'ROLE-001', name: 'Administrator', permissions: ['*'] };
          }
        });
      }
      state.roles = state.roles.filter(r => r.id !== id);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'delete',
        entity: 'role',
        entityId: id,
        entityName: role?.name || id,
        details: `Deleted role ${role?.name || id}`,
      });
    }),

    // Party CRUD
    addParty: (party) => set((state) => {
      const id = (party as any).id || `PTY-${Date.now()}`;
      state.parties.push({ ...party, id } as Party);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'create',
        entity: 'party',
        entityId: id,
        entityName: (party as any).name || id,
        details: `Created party ${(party as any).name || id}`,
      });
    }),
    updateParty: (id, updates) => set((state) => {
      const idx = state.parties.findIndex(p => p.id === id);
      if (idx !== -1) {
        Object.assign(state.parties[idx], updates);
        const u = currentUser();
        logAudit(state, {
          userId: u?.id || 'system',
          userName: u?.name || 'System',
          action: 'update',
          entity: 'party',
          entityId: id,
          entityName: state.parties[idx].name || id,
          details: `Updated party ${state.parties[idx].name || id}`,
        });
      }
    }),
    deleteParty: (id) => set((state) => {
      const target = state.parties.find(p => p.id === id);
      state.parties = state.parties.filter(p => p.id !== id);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'delete',
        entity: 'party',
        entityId: id,
        entityName: target?.name || id,
        details: `Deleted party ${target?.name || id}`,
      });
    }),

    // Component CRUD
    addComponent: (component) => set((state) => {
      const received = component.quantityReceived || 0;
      const consumed = component.quantityConsumed || 0;
      const available = Math.max(0, received - consumed);
      const threshold = component.lowStockThreshold || 100;
      let status: Component['status'] = 'in-stock';
      if (available <= 0) status = 'out-of-stock';
      else if (available <= threshold) status = 'low-stock';
      const id = (component as any).id || `CMP-${Date.now()}`;
      state.components.push({
        ...component,
        id,
        available,
        status,
      } as Component);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'create',
        entity: 'component',
        entityId: id,
        entityName: (component as any).name || id,
        details: `Created component ${(component as any).name || id}`,
      });
    }),
    updateComponent: (id, updates) => set((state) => {
      const idx = state.components.findIndex(c => c.id === id);
      if (idx !== -1) {
        Object.assign(state.components[idx], updates);
        const received = state.components[idx].quantityReceived;
        const consumed = state.components[idx].quantityConsumed;
        state.components[idx].available = Math.max(0, received - consumed);
        const threshold = state.components[idx].lowStockThreshold || 100;
        if (state.components[idx].available <= 0) state.components[idx].status = 'out-of-stock';
        else if (state.components[idx].available <= threshold) state.components[idx].status = 'low-stock';
        else state.components[idx].status = 'in-stock';
        const u = currentUser();
        logAudit(state, {
          userId: u?.id || 'system',
          userName: u?.name || 'System',
          action: 'update',
          entity: 'component',
          entityId: id,
          entityName: state.components[idx].name || id,
          details: `Updated component ${state.components[idx].name || id}`,
        });
      }
    }),
    deleteComponent: (id) => set((state) => {
      const target = state.components.find(c => c.id === id);
      state.components = state.components.filter(c => c.id !== id);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'delete',
        entity: 'component',
        entityId: id,
        entityName: target?.name || id,
        details: `Deleted component ${target?.name || id}`,
      });
    }),
    adjustStock: (id, quantity, reason) => set((state) => {
      const idx = state.components.findIndex(c => c.id === id);
      if (idx !== -1) {
        state.components[idx].quantityReceived = Math.max(0, state.components[idx].quantityReceived + quantity);
        const received = state.components[idx].quantityReceived;
        const consumed = state.components[idx].quantityConsumed;
        state.components[idx].available = Math.max(0, received - consumed);
        const threshold = state.components[idx].lowStockThreshold || 100;
        if (state.components[idx].available <= 0) state.components[idx].status = 'out-of-stock';
        else if (state.components[idx].available <= threshold) state.components[idx].status = 'low-stock';
        else state.components[idx].status = 'in-stock';
        state.transactions.push({
          id: `TXN-${Date.now()}`,
          type: quantity > 0 ? 'in' : 'out',
          itemType: 'component',
          itemId: id,
          itemName: state.components[idx].name,
          quantity: Math.abs(quantity),
          reference: reason,
          date: new Date().toISOString().split('T')[0],
          user: 'System',
        });
        const u = currentUser();
        logAudit(state, {
          userId: u?.id || 'system',
          userName: u?.name || 'System',
          action: 'update',
          entity: 'component',
          entityId: id,
          entityName: state.components[idx].name || id,
          details: `Adjusted stock for ${state.components[idx].name || id} by ${quantity} (${reason})`,
        });
      }
    }),
    consumePartsForBatch: (modelId: string, quantity: number) => set((state) => {
      const bom = state.bomItems.filter(b => b.modelId === modelId);
      const consumedParts: string[] = [];
      bom.forEach(item => {
        const idx = state.components.findIndex(c => c.id === item.componentId);
        if (idx !== -1) {
          const consumeQty = item.quantityPerUnit * quantity;
          state.components[idx].quantityConsumed += consumeQty;
          const received = state.components[idx].quantityReceived;
          const consumed = state.components[idx].quantityConsumed;
          state.components[idx].available = Math.max(0, received - consumed);
          const threshold = state.components[idx].lowStockThreshold || 100;
          if (state.components[idx].available <= 0) state.components[idx].status = 'out-of-stock';
          else if (state.components[idx].available <= threshold) state.components[idx].status = 'low-stock';
          else state.components[idx].status = 'in-stock';
          state.transactions.push({
            id: `TXN-${Date.now()}`,
            type: 'out',
            itemType: 'component',
            itemId: item.componentId,
            itemName: state.components[idx].name,
            quantity: consumeQty,
            reference: `Production batch consumption for model ${modelId}`,
            date: new Date().toISOString().split('T')[0],
            user: 'System',
          });
          consumedParts.push(state.components[idx].name);
        }
      });
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'update',
        entity: 'component',
        entityId: modelId,
        details: `Consumed parts for batch model ${modelId}: ${consumedParts.join(', ')}`,
      });
    }),

    // IMEI CRUD
    addIMEI: (imei) => set((state) => {
      const id = (imei as any).id || `IMEI-${Date.now()}`;
      state.imeis.push({
        ...imei,
        id,
        history: [{
          id: `EVT-${Date.now()}`,
          event: 'Created',
          date: new Date().toISOString().split('T')[0],
          location: imei.location,
          notes: 'IMEI added to system',
        }],
      } as IMEI);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'create',
        entity: 'imei',
        entityId: id,
        entityName: (imei as any).imei || id,
        details: `Created IMEI ${(imei as any).imei || id}`,
      });
    }),
    updateIMEI: (id, updates) => set((state) => {
      const idx = state.imeis.findIndex(i => i.id === id);
      if (idx !== -1) {
        Object.assign(state.imeis[idx], updates);
        const u = currentUser();
        logAudit(state, {
          userId: u?.id || 'system',
          userName: u?.name || 'System',
          action: 'update',
          entity: 'imei',
          entityId: id,
          entityName: state.imeis[idx].imei || id,
          details: `Updated IMEI ${state.imeis[idx].imei || id}`,
        });
      }
    }),
    deleteIMEI: (id) => set((state) => {
      const target = state.imeis.find(i => i.id === id);
      state.imeis = state.imeis.filter(i => i.id !== id);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'delete',
        entity: 'imei',
        entityId: id,
        entityName: target?.imei || id,
        details: `Deleted IMEI ${target?.imei || id}`,
      });
    }),
    addIMEIHistory: (imeiId, event) => set((state) => {
      const idx = state.imeis.findIndex(i => i.id === imeiId);
      if (idx !== -1) {
        state.imeis[idx].history.push({ ...event, id: `EVT-${Date.now()}` });
      }
    }),

    // Model CRUD
    addModel: (model) => set((state) => {
      const id = (model as any).id || `MDL-${Date.now()}`;
      state.models.push({ ...model, id } as Model);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'create',
        entity: 'model',
        entityId: id,
        entityName: (model as any).name || id,
        details: `Created model ${(model as any).name || id}`,
      });
    }),
    updateModel: (id, updates) => set((state) => {
      const idx = state.models.findIndex(m => m.id === id);
      if (idx !== -1) {
        Object.assign(state.models[idx], updates);
        const u = currentUser();
        logAudit(state, {
          userId: u?.id || 'system',
          userName: u?.name || 'System',
          action: 'update',
          entity: 'model',
          entityId: id,
          entityName: state.models[idx].name || id,
          details: `Updated model ${state.models[idx].name || id}`,
        });
      }
    }),
    deleteModel: (id) => set((state) => {
      const target = state.models.find(m => m.id === id);
      state.models = state.models.filter(m => m.id !== id);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'delete',
        entity: 'model',
        entityId: id,
        entityName: target?.name || id,
        details: `Deleted model ${target?.name || id}`,
      });
    }),

    // Batch CRUD
    addBatch: (batch) => set((state) => {
      const id = (batch as any).id || `BCH-${Date.now()}`;
      state.batches.push({
        ...batch,
        id,
        createdAt: new Date().toISOString().split('T')[0],
      } as Batch);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'create',
        entity: 'batch',
        entityId: id,
        entityName: (batch as any).name || id,
        details: `Created batch ${(batch as any).name || id}`,
      });
    }),
    updateBatch: (id, updates) => set((state) => {
      const idx = state.batches.findIndex(b => b.id === id);
      if (idx !== -1) {
        Object.assign(state.batches[idx], updates);
        const u = currentUser();
        logAudit(state, {
          userId: u?.id || 'system',
          userName: u?.name || 'System',
          action: 'update',
          entity: 'batch',
          entityId: id,
          entityName: state.batches[idx].name || id,
          details: `Updated batch ${state.batches[idx].name || id}`,
        });
      }
    }),
    deleteBatch: (id) => set((state) => {
      const target = state.batches.find(b => b.id === id);
      state.batches = state.batches.filter(b => b.id !== id);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'delete',
        entity: 'batch',
        entityId: id,
        entityName: target?.name || id,
        details: `Deleted batch ${target?.name || id}`,
      });
    }),

    // BOM CRUD
    addBOMItem: (item) => set((state) => {
      const id = (item as any).id || `BOM-${Date.now()}`;
      state.bomItems.push({ ...item, id } as BOMItem);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'create',
        entity: 'bom',
        entityId: id,
        details: `Created BOM item`,
      });
    }),
    updateBOMItem: (id, updates) => set((state) => {
      const idx = state.bomItems.findIndex(b => b.id === id);
      if (idx !== -1) {
        Object.assign(state.bomItems[idx], updates);
        const u = currentUser();
        logAudit(state, {
          userId: u?.id || 'system',
          userName: u?.name || 'System',
          action: 'update',
          entity: 'bom',
          entityId: id,
          details: `Updated BOM item`,
        });
      }
    }),
    deleteBOMItem: (id) => set((state) => {
      state.bomItems = state.bomItems.filter(b => b.id !== id);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'delete',
        entity: 'bom',
        entityId: id,
        details: `Deleted BOM item`,
      });
    }),

    // Sale CRUD
    addSale: (sale) => set((state) => {
      const id = (sale as any).id || `SAL-${Date.now()}`;
      state.sales.push({ ...sale, id } as Sale);
      const partyIdx = state.parties.findIndex(p => p.id === sale.partyId);
      if (partyIdx !== -1) {
        state.parties[partyIdx].totalSales += sale.totalAmount;
        state.parties[partyIdx].outstanding += sale.totalAmount;
        state.parties[partyIdx].phonesSold += sale.items.length;
      }
      sale.items.forEach(item => {
        const imeiIdx = state.imeis.findIndex(i => i.imei === item.imei);
        if (imeiIdx !== -1) {
          state.imeis[imeiIdx].status = 'sold';
          state.imeis[imeiIdx].partyId = sale.partyId;
          state.imeis[imeiIdx].party = sale.partyName;
          state.imeis[imeiIdx].invoice = sale.invoice;
          state.imeis[imeiIdx].saleDate = sale.date;
          state.imeis[imeiIdx].history.push({
            id: `EVT-${Date.now()}`,
            event: 'Sold',
            date: sale.date,
            location: 'Dispatch',
            notes: `Invoice: ${sale.invoice}`,
          });
        }
      });
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'create',
        entity: 'sale',
        entityId: id,
        entityName: (sale as any).invoice || id,
        details: `Created sale invoice ${(sale as any).invoice || id} for ${sale.partyName}`,
      });
    }),
    updateSale: (id, updates) => set((state) => {
      const idx = state.sales.findIndex(s => s.id === id);
      if (idx !== -1) {
        Object.assign(state.sales[idx], updates);
        const u = currentUser();
        logAudit(state, {
          userId: u?.id || 'system',
          userName: u?.name || 'System',
          action: 'update',
          entity: 'sale',
          entityId: id,
          entityName: state.sales[idx].invoice || id,
          details: `Updated sale ${state.sales[idx].invoice || id}`,
        });
      }
    }),
    deleteSale: (id) => set((state) => {
      const target = state.sales.find(s => s.id === id);
      state.sales = state.sales.filter(s => s.id !== id);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'delete',
        entity: 'sale',
        entityId: id,
        entityName: target?.invoice || id,
        details: `Deleted sale ${target?.invoice || id}`,
      });
    }),

    // Return CRUD
    addReturn: (ret) => set((state) => {
      const id = (ret as any).id || `RET-${Date.now()}`;
      state.returns.push({ ...ret, id } as Return);
      const imeiIdx = state.imeis.findIndex(i => i.imei === ret.imei);
      if (imeiIdx !== -1) {
        state.imeis[imeiIdx].status = 'returned';
        state.imeis[imeiIdx].history.push({
          id: `EVT-${Date.now()}`,
          event: 'Returned',
          date: ret.returnDate,
          location: 'QC',
          notes: ret.reason,
        });
      }
      const partyIdx = state.parties.findIndex(p => p.id === ret.partyId);
      if (partyIdx !== -1) {
        state.parties[partyIdx].phonesReturned += 1;
        state.parties[partyIdx].returnValue += ret.refundAmount;
      }
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'create',
        entity: 'return',
        entityId: id,
        entityName: ret.imei || id,
        details: `Created return for IMEI ${ret.imei} — ${ret.reason}`,
      });
    }),
    updateReturn: (id, updates) => set((state) => {
      const idx = state.returns.findIndex(r => r.id === id);
      if (idx !== -1) {
        Object.assign(state.returns[idx], updates);
        const u = currentUser();
        logAudit(state, {
          userId: u?.id || 'system',
          userName: u?.name || 'System',
          action: 'update',
          entity: 'return',
          entityId: id,
          entityName: state.returns[idx].imei || id,
          details: `Updated return ${state.returns[idx].imei || id}`,
        });
      }
    }),
    deleteReturn: (id) => set((state) => {
      const target = state.returns.find(r => r.id === id);
      state.returns = state.returns.filter(r => r.id !== id);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'delete',
        entity: 'return',
        entityId: id,
        entityName: target?.imei || id,
        details: `Deleted return ${target?.imei || id}`,
      });
    }),
    processQC: (returnId, qcData) => set((state) => {
      const retIdx = state.returns.findIndex(r => r.id === returnId);
      if (retIdx !== -1) {
        state.returns[retIdx].qcStatus = qcData.status;
        state.returns[retIdx].qcNotes = qcData.notes;
        const retImei = state.returns[retIdx].imei || '';
        const imeiIdx = state.imeis.findIndex(i => i.imei === retImei);
        if (imeiIdx !== -1) {
          const newStatus = qcData.status === 'good' ? 'sellable' :
            qcData.status === 'repair' ? 'repair' : 'scrap';
          state.imeis[imeiIdx].status = newStatus;
          state.imeis[imeiIdx].history.push({
            id: `EVT-${Date.now()}`,
            event: `QC: ${qcData.status}`,
            date: new Date().toISOString().split('T')[0],
            location: 'QC',
            notes: qcData.notes,
          });
        }
        state.qcInspections.push({
          id: `QC-${Date.now()}`,
          returnId: returnId,
          imei: retImei,
          inspector: 'QC Team',
          date: new Date().toISOString().split('T')[0],
          status: qcData.status === 'good' ? 'good' : qcData.status === 'repair' ? 'repair' : 'scrap',
          notes: qcData.notes,
        });
        const u = currentUser();
        logAudit(state, {
          userId: u?.id || 'system',
          userName: u?.name || 'System',
          action: 'update',
          entity: 'return',
          entityId: returnId,
          entityName: retImei,
          details: `QC processed for ${retImei}: ${qcData.status}`,
        });
      }
    }),

    // Repair CRUD
    addRepairOrder: (order) => set((state) => {
      const id = (order as any).id || `REP-${Date.now()}`;
      state.repairOrders.push({ ...order, id } as RepairOrder);
      const imeiIdx = state.imeis.findIndex(i => i.imei === order.imei);
      if (imeiIdx !== -1) {
        state.imeis[imeiIdx].status = 'repair';
        state.imeis[imeiIdx].history.push({
          id: `EVT-${Date.now()}`,
          event: 'Repair Started',
          date: order.startDate,
          location: 'Repair Center',
          notes: order.issue,
        });
      }
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'create',
        entity: 'repair',
        entityId: id,
        entityName: order.imei || id,
        details: `Created repair order for IMEI ${order.imei}: ${order.issue}`,
      });
    }),
    updateRepairOrder: (id, updates) => set((state) => {
      const idx = state.repairOrders.findIndex(r => r.id === id);
      if (idx !== -1) {
        const oldStatus = state.repairOrders[idx].status;
        Object.assign(state.repairOrders[idx], updates);
        const imeiIdx = state.imeis.findIndex(i => i.imei === state.repairOrders[idx].imei);
        const imei = imeiIdx !== -1 ? state.imeis[imeiIdx] : null;
        const batchIdx = imei ? state.batches.findIndex(b => b.id === imei.batchId) : -1;
        const batch = batchIdx !== -1 ? state.batches[batchIdx] : null;
        if (updates.status === 'completed' && oldStatus !== 'completed') {
          if (imeiIdx !== -1) {
            state.imeis[imeiIdx].status = 'sellable';
            state.imeis[imeiIdx].location = 'Warehouse';
            state.imeis[imeiIdx].history.push({
              id: `EVT-${Date.now()}`,
              event: 'Repair Completed → Sellable',
              date: updates.completionDate || new Date().toISOString().split('T')[0],
              location: 'Warehouse',
              notes: updates.notes || 'Ready for resale',
            });
          }
          if (batch) {
            state.batches[batchIdx].repair = Math.max(0, batch.repair - 1);
            state.batches[batchIdx].sellable = (batch.sellable || 0) + 1;
          }
        }
        if (updates.status === 'failed' && oldStatus !== 'failed') {
          if (imeiIdx !== -1) {
            state.imeis[imeiIdx].status = 'scrap';
            state.imeis[imeiIdx].location = 'Scrap Yard';
            state.imeis[imeiIdx].history.push({
              id: `EVT-${Date.now()}`,
              event: 'Repair Failed → Scrap',
              date: updates.completionDate || new Date().toISOString().split('T')[0],
              location: 'Scrap Yard',
              notes: updates.notes || 'Repair failed, moved to scrap',
            });
          }
          if (batch) {
            state.batches[batchIdx].repair = Math.max(0, batch.repair - 1);
            state.batches[batchIdx].scrap = (batch.scrap || 0) + 1;
          }
        }
        const u = currentUser();
        logAudit(state, {
          userId: u?.id || 'system',
          userName: u?.name || 'System',
          action: 'update',
          entity: 'repair',
          entityId: id,
          entityName: state.repairOrders[idx].imei || id,
          details: `Updated repair order ${state.repairOrders[idx].imei || id} → ${updates.status || 'updated'}`,
        });
      }
    }),
    deleteRepairOrder: (id) => set((state) => {
      const target = state.repairOrders.find(r => r.id === id);
      state.repairOrders = state.repairOrders.filter(r => r.id !== id);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'delete',
        entity: 'repair',
        entityId: id,
        entityName: target?.imei || id,
        details: `Deleted repair order ${target?.imei || id}`,
      });
    }),

    // Payment CRUD
    addPayment: (payment) => set((state) => {
      const id = (payment as any).id || `PAY-${Date.now()}`;
      state.payments.push({ ...payment, id } as Payment);
      const partyIdx = state.parties.findIndex(p => p.id === payment.partyId);
      if (partyIdx !== -1) {
        state.parties[partyIdx].paymentsReceived += payment.amount;
        state.parties[partyIdx].outstanding = Math.max(0,
          state.parties[partyIdx].totalSales -
          state.parties[partyIdx].paymentsReceived -
          state.parties[partyIdx].returnValue
        );
        state.parties[partyIdx].netReceivable = state.parties[partyIdx].outstanding;
      }
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'create',
        entity: 'payment',
        entityId: id,
        entityName: payment.partyName || id,
        details: `Recorded payment ${payment.amount} from ${payment.partyName}`,
      });
    }),
    deletePayment: (id) => set((state) => {
      const target = state.payments.find(p => p.id === id);
      state.payments = state.payments.filter(p => p.id !== id);
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'delete',
        entity: 'payment',
        entityId: id,
        entityName: target?.partyName || id,
        details: `Deleted payment ${target?.amount || ''} from ${target?.partyName || id}`,
      });
    }),

    // Transaction CRUD
    addTransaction: (transaction) => set((state) => {
      const id = (transaction as any).id || `TXN-${Date.now()}`;
      state.transactions.push({ ...transaction, id } as InventoryTransaction);
    }),

    // Dashboard
    recalculateDashboardStats: () => set((state) => {
      state.dashboardStats = {
        produced: state.imeis.filter(i => i.status !== 'scrap').length,
        dispatched: state.imeis.filter(i => i.status === 'sold' || i.status === 'in-transit').length,
        customerReturns: state.returns.length,
        sellableStock: state.imeis.filter(i => i.status === 'sellable' || i.status === 'packed').length,
        repairStock: state.imeis.filter(i => i.status === 'repair').length,
        scrapRejected: state.imeis.filter(i => i.status === 'scrap').length,
      };
    }),

    // Data Management
    exportAllData: () => {
      const state = get();
      const payload = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        tables: {
          users: state.users,
          roles: state.roles,
          parties: state.parties,
          products: state.products,
          models: state.models,
          batches: state.batches,
          components: state.components,
          bomItems: state.bomItems,
          imeis: state.imeis,
          sales: state.sales,
          returns: state.returns,
          qcInspections: state.qcInspections,
          repairOrders: state.repairOrders,
          transactions: state.transactions,
          payments: state.payments,
          dashboardStats: state.dashboardStats,
        },
      };
      const json = JSON.stringify(payload, null, 2);
      return {
        json,
        size: new Blob([json]).size,
        tables: Object.keys(payload.tables),
      };
    },

    importAllData: (json: string) => {
      const result = { success: false, imported: 0, errors: [] as string[] };
      try {
        const data = JSON.parse(json);
        if (!data.tables) throw new Error('Invalid backup file: missing tables');
        const tables = data.tables;
        set((state) => {
          if (tables.users) { state.users = tables.users; result.imported++; }
          if (tables.roles) { state.roles = tables.roles; result.imported++; }
          if (tables.parties) { state.parties = tables.parties; result.imported++; }
          if (tables.products) { state.products = tables.products; result.imported++; }
          if (tables.models) { state.models = tables.models; result.imported++; }
          if (tables.batches) { state.batches = tables.batches; result.imported++; }
          if (tables.components) { state.components = tables.components; result.imported++; }
          if (tables.bomItems) { state.bomItems = tables.bomItems; result.imported++; }
          if (tables.imeis) { state.imeis = tables.imeis; result.imported++; }
          if (tables.sales) { state.sales = tables.sales; result.imported++; }
          if (tables.returns) { state.returns = tables.returns; result.imported++; }
          if (tables.qcInspections) { state.qcInspections = tables.qcInspections; result.imported++; }
          if (tables.repairOrders) { state.repairOrders = tables.repairOrders; result.imported++; }
          if (tables.transactions) { state.transactions = tables.transactions; result.imported++; }
          if (tables.payments) { state.payments = tables.payments; result.imported++; }
          if (tables.dashboardStats) { state.dashboardStats = tables.dashboardStats; result.imported++; }
        });
        result.success = true;
      } catch (e: any) {
        result.errors.push(e.message || 'Unknown error');
      }
      return result;
    },

    clearAllData: () => set((state) => {
      state.users = [];
      state.roles = [];
      state.parties = [];
      state.products = [];
      state.models = [];
      state.batches = [];
      state.components = [];
      state.bomItems = [];
      state.imeis = [];
      state.sales = [];
      state.returns = [];
      state.qcInspections = [];
      state.repairOrders = [];
      state.transactions = [];
      state.payments = [];
      state.dashboardStats = initialDashboardStats;
      const u = currentUser();
      logAudit(state, {
        userId: u?.id || 'system',
        userName: u?.name || 'System',
        action: 'clear',
        entity: 'database',
        details: 'All data cleared',
      });
    }),
  }
}),
    {
      name: 'mobiis-data',
      partialize: (state) => ({ auditLogs: state.auditLogs }),
    }
  )
);

const defaultSettings: AppSettings = {
  companyName: 'MOBIIS Technologies',
  currency: 'PKR',
  timeZone: 'Asia/Karachi',
  dateFormat: 'DD-MM-YYYY',
  notifications: {
    lowStock: true,
    outOfStock: true,
    returns: true,
    payments: true,
    qcCompletion: true,
    newSales: true,
    repairOrders: true,
    batchStatus: true,
    messages: true,
  },
  security: {
    minPasswordLength: 8,
    requireSpecialChar: true,
    requireNumber: true,
    sessionTimeout: 30,
    twoFactorEnabled: false,
  },
  appearance: {
    theme: 'dark',
    sidebarCollapsed: false,
    denseMode: false,
  },
  database: {
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    lastBackup: null,
    backupHistory: [],
  },
  email: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpSecure: true,
    fromName: 'MOBIIS ERP',
    fromEmail: 'noreply@mobiis.com',
  },
};

interface SettingsState {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateNotification: (key: keyof AppSettings['notifications'], value: boolean) => void;
  updateSecurity: (key: keyof AppSettings['security'], value: any) => void;
  updateAppearance: (key: keyof AppSettings['appearance'], value: any) => void;
  updateDatabase: (key: keyof AppSettings['database'], value: any) => void;
  updateEmail: (key: keyof AppSettings['email'], value: any) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),
      updateNotification: (key, value) => set((state) => ({
        settings: {
          ...state.settings,
          notifications: { ...state.settings.notifications, [key]: value },
        },
      })),
      updateSecurity: (key, value) => set((state) => ({
        settings: {
          ...state.settings,
          security: { ...state.settings.security, [key]: value },
        },
      })),
      updateAppearance: (key, value) => set((state) => ({
        settings: {
          ...state.settings,
          appearance: { ...state.settings.appearance, [key]: value },
        },
      })),
      updateDatabase: (key, value) => set((state) => ({
        settings: {
          ...state.settings,
          database: { ...state.settings.database, [key]: value },
        },
      })),
      updateEmail: (key, value) => set((state) => ({
        settings: {
          ...state.settings,
          email: { ...state.settings.email, [key]: value },
        },
      })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'mobiis-settings',
    }
  )
);
