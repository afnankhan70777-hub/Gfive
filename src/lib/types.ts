export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  status: 'active' | 'inactive';
  lastLogin?: string;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface Party {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  totalSales: number;
  paymentsReceived: number;
  outstanding: number;
  returnValue: number;
  netReceivable: number;
  phonesSold: number;
  phonesReturned: number;
  status: 'active' | 'inactive';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
}

export interface Model {
  id: string;
  name: string;
  specifications: string;
}

export interface Batch {
  id: string;
  name: string;
  modelId: string;
  modelName: string;
  originalQuantity: number;
  produced: number;
  packed: number;
  dispatched: number;
  returns: number;
  goodReturns: number;
  repair: number;
  scrap: number;
  warehouse: number;
  sellable: number;
  status: 'active' | 'completed' | 'in-production';
  createdAt: string;
}

export interface Component {
  id: string;
  name: string;
  supplier: string;
  purchaseBatch: string;
  quantityReceived: number;
  quantityConsumed: number;
  available: number;
  warehouse: string;
  lowStockThreshold: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

export interface BOMItem {
  id: string;
  modelId: string;
  componentId: string;
  quantityPerUnit: number;
}

export interface IMEI {
  id: string;
  imei: string;
  model: string;
  modelId: string;
  batch: string;
  batchId: string;
  party?: string;
  partyId?: string;
  invoice?: string;
  saleDate?: string;
  location: string;
  status: 'produced' | 'packed' | 'sold' | 'returned' | 'qc' | 'repair' | 'scrap' | 'sellable' | 'in-transit' | 'warehouse';
  history: IMEIHistoryEvent[];
}

export interface IMEIHistoryEvent {
  id: string;
  event: string;
  date: string;
  location: string;
  notes?: string;
  user?: string;
}

export interface Sale {
  id: string;
  invoice: string;
  partyId: string;
  partyName: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface SaleItem {
  id: string;
  imei: string;
  model: string;
  batch: string;
  price: number;
}

export interface Return {
  id: string;
  returnNumber?: string;
  imei?: string;
  model?: string;
  partyId: string;
  partyName: string;
  originalInvoice?: string;
  returnDate: string;
  reason: string;
  qcStatus: 'pending' | 'good' | 'repair' | 'scrap';
  qcNotes?: string;
  refundAmount: number;
  // DB-mapped fields (optional for backward compat)
  returnId?: string;
  saleId?: string;
  condition?: string;
  status?: string;
}

export interface QCInspection {
  id: string;
  returnId: string;
  imei: string;
  inspector: string;
  date: string;
  status: 'good' | 'repair' | 'scrap';
  notes: string;
  defects?: string[];
}

export interface RepairOrder {
  id: string;
  imei: string;
  model: string;
  issue: string;
  technician: string;
  startDate: string;
  completionDate?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  cost: number;
  notes?: string;
  // DB-mapped fields (optional for backward compat)
  batch?: string;
  diagnosis?: string;
  partsUsed?: string[];
}

export interface InventoryTransaction {
  id: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  itemType: 'component' | 'imei' | 'product';
  itemId: string;
  itemName: string;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  reference?: string;
  date: string;
  user: string;
}

export interface Payment {
  id: string;
  partyId: string;
  partyName: string;
  amount: number;
  date: string;
  method: 'cash' | 'bank' | 'cheque';
  reference: string;
  notes?: string;
}

export interface DashboardStats {
  produced: number;
  dispatched: number;
  customerReturns: number;
  sellableStock: number;
  repairStock: number;
  scrapRejected: number;
  // Extended fields for Supabase compatibility
  totalProduction?: number;
  totalDispatched?: number;
  totalReturns?: number;
  scrapStock?: number;
  totalRevenue?: number;
  totalReceivable?: number;
  activeParties?: number;
  lowStockItems?: number;
}

export interface ChartData {
  name: string;
  value?: number;
  sales?: number;
  returns?: number;
}

export interface Transaction {
  id: string;
  type: string;
  reference: string;
  party: string;
  imei: string;
  qty: number;
  date: string;
}

export interface AppSettings {
  companyName: string;
  currency: 'PKR' | 'USD' | 'EUR';
  timeZone: string;
  dateFormat: string;
  notifications: {
    lowStock: boolean;
    outOfStock: boolean;
    returns: boolean;
    payments: boolean;
    qcCompletion: boolean;
    newSales: boolean;
    repairOrders: boolean;
    batchStatus: boolean;
    messages: boolean;
  };
  security: {
    minPasswordLength: number;
    requireSpecialChar: boolean;
    requireNumber: boolean;
    sessionTimeout: number;
    twoFactorEnabled: boolean;
  };
  appearance: {
    theme: 'dark' | 'light' | 'system';
    sidebarCollapsed: boolean;
    denseMode: boolean;
  };
  database: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    retentionDays: number;
    lastBackup: string | null;
    backupHistory: BackupRecord[];
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpSecure: boolean;
    fromName: string;
    fromEmail: string;
  };
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  size: number;
  tables: string[];
  note?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import' | 'backup' | 'clear' | 'settings' | 'other';
  entity: string;
  entityId?: string;
  entityName?: string;
  details?: string;
  ip?: string;
}
