import {
  User, Role, Party, Product, Model, Batch, Component, IMEI,
  Sale, Return, QCInspection, RepairOrder, InventoryTransaction, Payment,
  DashboardStats, BOMItem
} from './types';

export const initialUsers: User[] = [
  {
    id: 'USR-001',
    name: 'admin',
    email: 'admin@mobiis.com',
    password: 'admin123',
    role: { id: 'ROLE-001', name: 'Administrator', permissions: ['*'] },
    status: 'active',
    lastLogin: '-',
    avatar: '',
  },
];

export const initialRoles: Role[] = [
  { id: 'ROLE-001', name: 'Administrator', permissions: ['*'] },
];

export const initialProducts: Product[] = [];
export const initialModels: Model[] = [];
export const initialBOMItems: BOMItem[] = [];
export const initialParties: Party[] = [];
export const initialBatches: Batch[] = [];
export const initialComponents: Component[] = [];
export const initialIMEIs: IMEI[] = [];
export const initialSales: Sale[] = [];
export const initialReturns: Return[] = [];
export const initialQCInspections: QCInspection[] = [];
export const initialRepairOrders: RepairOrder[] = [];
export const initialTransactions: InventoryTransaction[] = [];
export const initialPayments: Payment[] = [];

export const initialDashboardStats: DashboardStats = {
  produced: 0,
  dispatched: 0,
  customerReturns: 0,
  sellableStock: 0,
  repairStock: 0,
  scrapRejected: 0,
};

