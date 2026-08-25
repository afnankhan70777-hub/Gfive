import { supabase } from './supabase';
import type {
  User, Role, Party, Product, Model, Batch, Component, IMEI,
  Sale, Return, QCInspection, RepairOrder, InventoryTransaction, Payment,
  DashboardStats, BOMItem
} from './types';

// ── Roles ─────────────────────────────────────────────────
export async function fetchRoles(): Promise<Role[]> {
  const { data, error } = await supabase.from('roles').select('*').order('name');
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    permissions: r.permissions || [],
  }));
}

export async function addRole(role: Omit<Role, 'id'>): Promise<Role> {
  const id = `ROLE-${Date.now()}`;
  const { data, error } = await supabase.from('roles').insert({ id, ...role }).select().single();
  if (error) throw error;
  return { id: data.id, name: data.name, permissions: data.permissions || [] };
}

export async function updateRole(id: string, updates: Partial<Role>): Promise<void> {
  const { error } = await supabase.from('roles').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteRole(id: string): Promise<void> {
  const { error } = await supabase.from('roles').delete().eq('id', id);
  if (error) throw error;
}

// ── Users ─────────────────────────────────────────────────
export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*, role:role_id(*)').order('name');
  if (error) throw error;
  return (data || []).map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    password: u.password,
    role: u.role ? { id: u.role.id, name: u.role.name, permissions: u.role.permissions || [] } : { id: '', name: '', permissions: [] },
    status: u.status,
    lastLogin: u.last_login,
    avatar: u.avatar,
  }));
}

export async function addUser(user: Omit<User, 'id'>): Promise<User> {
  const id = `USR-${Date.now()}`;
  const payload: any = {
    id,
    name: user.name,
    email: user.email,
    password: user.password,
    role_id: user.role?.id,
    status: user.status,
    avatar: user.avatar,
  };
  if (user.lastLogin && user.lastLogin !== '-') {
    payload.last_login = user.lastLogin;
  }
  const { data, error } = await supabase.from('users').insert(payload).select('*, role:role_id(*)').single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role ? { id: data.role.id, name: data.role.name, permissions: data.role.permissions || [] } : { id: '', name: '', permissions: [] },
    status: data.status,
    lastLogin: data.last_login,
    avatar: data.avatar,
  };
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.password !== undefined) payload.password = updates.password;
  if (updates.role?.id !== undefined) payload.role_id = updates.role.id;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.lastLogin !== undefined) payload.last_login = updates.lastLogin;
  if (updates.avatar !== undefined) payload.avatar = updates.avatar;
  const { error } = await supabase.from('users').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
}

export async function changeUserPassword(id: string, newPassword: string): Promise<void> {
  const { error } = await supabase.from('users').update({ password: newPassword }).eq('id', id);
  if (error) throw error;
}

// ── Parties ───────────────────────────────────────────────
export async function fetchParties(): Promise<Party[]> {
  const { data, error } = await supabase.from('parties').select('*').order('name');
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    contact: p.contact,
    phone: p.phone,
    email: p.email,
    address: p.address,
    creditLimit: Number(p.credit_limit),
    totalSales: Number(p.total_sales),
    paymentsReceived: Number(p.payments_received),
    outstanding: Number(p.outstanding),
    returnValue: Number(p.return_value),
    netReceivable: Number(p.net_receivable),
    phonesSold: p.phones_sold,
    phonesReturned: p.phones_returned,
    status: p.status,
  }));
}

export async function addParty(party: Omit<Party, 'id'>): Promise<Party> {
  const id = `PTY-${Date.now()}`;
  const { data, error } = await supabase.from('parties').insert({
    id,
    name: party.name,
    contact: party.contact,
    phone: party.phone,
    email: party.email,
    address: party.address,
    credit_limit: party.creditLimit,
    total_sales: party.totalSales,
    payments_received: party.paymentsReceived,
    outstanding: party.outstanding,
    return_value: party.returnValue,
    net_receivable: party.netReceivable,
    phones_sold: party.phonesSold,
    phones_returned: party.phonesReturned,
    status: party.status,
  }).select().single();
  if (error) throw error;
  return { ...party, id: data.id };
}

export async function updateParty(id: string, updates: Partial<Party>): Promise<void> {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.contact !== undefined) payload.contact = updates.contact;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.address !== undefined) payload.address = updates.address;
  if (updates.creditLimit !== undefined) payload.credit_limit = updates.creditLimit;
  if (updates.totalSales !== undefined) payload.total_sales = updates.totalSales;
  if (updates.paymentsReceived !== undefined) payload.payments_received = updates.paymentsReceived;
  if (updates.outstanding !== undefined) payload.outstanding = updates.outstanding;
  if (updates.returnValue !== undefined) payload.return_value = updates.returnValue;
  if (updates.netReceivable !== undefined) payload.net_receivable = updates.netReceivable;
  if (updates.phonesSold !== undefined) payload.phones_sold = updates.phonesSold;
  if (updates.phonesReturned !== undefined) payload.phones_returned = updates.phonesReturned;
  if (updates.status !== undefined) payload.status = updates.status;
  const { error } = await supabase.from('parties').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteParty(id: string): Promise<void> {
  const { error } = await supabase.from('parties').delete().eq('id', id);
  if (error) throw error;
}

// ── Components ────────────────────────────────────────────
export async function fetchComponents(): Promise<Component[]> {
  const { data, error } = await supabase.from('components').select('*').order('name');
  if (error) throw error;
  return (data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    supplier: c.supplier,
    purchaseBatch: c.purchase_batch,
    quantityReceived: c.quantity_received,
    quantityConsumed: c.quantity_consumed,
    available: c.available,
    warehouse: c.warehouse,
    lowStockThreshold: c.low_stock_threshold,
    status: c.status,
  }));
}

export async function addComponent(component: Omit<Component, 'id' | 'available' | 'status'>): Promise<Component> {
  const id = `CMP-${Date.now()}`;
  const received = component.quantityReceived || 0;
  const consumed = component.quantityConsumed || 0;
  const available = Math.max(0, received - consumed);
  const threshold = component.lowStockThreshold || 100;
  let status: Component['status'] = 'in-stock';
  if (available <= 0) status = 'out-of-stock';
  else if (available <= threshold) status = 'low-stock';

  const { data, error } = await supabase.from('components').insert({
    id,
    name: component.name,
    supplier: component.supplier,
    purchase_batch: component.purchaseBatch,
    quantity_received: received,
    quantity_consumed: consumed,
    available,
    warehouse: component.warehouse || 'Main',
    low_stock_threshold: threshold,
    status,
  }).select().single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    supplier: data.supplier,
    purchaseBatch: data.purchase_batch,
    quantityReceived: data.quantity_received,
    quantityConsumed: data.quantity_consumed,
    available: data.available,
    warehouse: data.warehouse,
    lowStockThreshold: data.low_stock_threshold,
    status: data.status,
  };
}

export async function updateComponent(id: string, updates: Partial<Component>): Promise<void> {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.supplier !== undefined) payload.supplier = updates.supplier;
  if (updates.purchaseBatch !== undefined) payload.purchase_batch = updates.purchaseBatch;
  if (updates.quantityReceived !== undefined) payload.quantity_received = updates.quantityReceived;
  if (updates.quantityConsumed !== undefined) payload.quantity_consumed = updates.quantityConsumed;
  if (updates.warehouse !== undefined) payload.warehouse = updates.warehouse;
  if (updates.lowStockThreshold !== undefined) payload.low_stock_threshold = updates.lowStockThreshold;

  // Recalculate available and status if quantities changed
  if (updates.quantityReceived !== undefined || updates.quantityConsumed !== undefined) {
    const { data } = await supabase.from('components').select('quantity_received, quantity_consumed, low_stock_threshold').eq('id', id).single();
    if (data) {
      const received = updates.quantityReceived !== undefined ? updates.quantityReceived : data.quantity_received;
      const consumed = updates.quantityConsumed !== undefined ? updates.quantityConsumed : data.quantity_consumed;
      const available = Math.max(0, received - consumed);
      const threshold = updates.lowStockThreshold !== undefined ? updates.lowStockThreshold : data.low_stock_threshold;
      payload.available = available;
      if (available <= 0) payload.status = 'out-of-stock';
      else if (available <= threshold) payload.status = 'low-stock';
      else payload.status = 'in-stock';
    }
  }

  const { error } = await supabase.from('components').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteComponent(id: string): Promise<void> {
  const { error } = await supabase.from('components').delete().eq('id', id);
  if (error) throw error;
}

export async function adjustStock(id: string, quantity: number, reason: string): Promise<void> {
  const { data } = await supabase.from('components').select('*').eq('id', id).single();
  if (!data) return;
  const newReceived = Math.max(0, data.quantity_received + quantity);
  const available = Math.max(0, newReceived - data.quantity_consumed);
  const threshold = data.low_stock_threshold || 100;
  let status: Component['status'] = 'in-stock';
  if (available <= 0) status = 'out-of-stock';
  else if (available <= threshold) status = 'low-stock';

  await supabase.from('components').update({
    quantity_received: newReceived,
    available,
    status,
  }).eq('id', id);

  await supabase.from('inventory_transactions').insert({
    id: `TXN-${Date.now()}`,
    type: quantity > 0 ? 'in' : 'out',
    item_type: 'component',
    item_id: id,
    item_name: data.name,
    quantity: Math.abs(quantity),
    reference: reason,
    date: new Date().toISOString().split('T')[0],
    user_name: 'System',
  });
}

// ── Models ────────────────────────────────────────────────
export async function fetchModels(): Promise<Model[]> {
  const { data, error } = await supabase.from('models').select('*').order('name');
  if (error) throw error;
  return (data || []).map((m: any) => ({ id: m.id, name: m.name, specifications: m.specifications }));
}

export async function addModel(model: Omit<Model, 'id'>): Promise<Model> {
  const id = `MDL-${Date.now()}`;
  const { data, error } = await supabase.from('models').insert({ id, ...model }).select().single();
  if (error) throw error;
  return { id: data.id, name: data.name, specifications: data.specifications };
}

export async function updateModel(id: string, updates: Partial<Model>): Promise<void> {
  const { error } = await supabase.from('models').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteModel(id: string): Promise<void> {
  const { error } = await supabase.from('models').delete().eq('id', id);
  if (error) throw error;
}

// ── BOM Items ─────────────────────────────────────────────
export async function fetchBOMItems(): Promise<BOMItem[]> {
  const { data, error } = await supabase.from('bom_items').select('*');
  if (error) throw error;
  return (data || []).map((b: any) => ({
    id: b.id,
    modelId: b.model_id,
    componentId: b.component_id,
    quantityPerUnit: b.quantity_per_unit,
  }));
}

export async function addBOMItem(item: Omit<BOMItem, 'id'>): Promise<BOMItem> {
  const id = `BOM-${Date.now()}`;
  const { data, error } = await supabase.from('bom_items').insert({
    id,
    model_id: item.modelId,
    component_id: item.componentId,
    quantity_per_unit: item.quantityPerUnit,
  }).select().single();
  if (error) throw error;
  return {
    id: data.id,
    modelId: data.model_id,
    componentId: data.component_id,
    quantityPerUnit: data.quantity_per_unit,
  };
}

export async function updateBOMItem(id: string, updates: Partial<BOMItem>): Promise<void> {
  const payload: any = {};
  if (updates.modelId !== undefined) payload.model_id = updates.modelId;
  if (updates.componentId !== undefined) payload.component_id = updates.componentId;
  if (updates.quantityPerUnit !== undefined) payload.quantity_per_unit = updates.quantityPerUnit;
  const { error } = await supabase.from('bom_items').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteBOMItem(id: string): Promise<void> {
  const { error } = await supabase.from('bom_items').delete().eq('id', id);
  if (error) throw error;
}

// ── Batches ───────────────────────────────────────────────
export async function fetchBatches(): Promise<Batch[]> {
  const { data, error } = await supabase.from('batches').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((b: any) => ({
    id: b.id,
    name: b.name,
    modelId: b.model_id,
    modelName: b.model_name,
    originalQuantity: b.original_quantity,
    produced: b.produced,
    packed: b.packed,
    dispatched: b.dispatched,
    returns: b.returns,
    goodReturns: b.good_returns,
    repair: b.repair,
    scrap: b.scrap,
    warehouse: b.warehouse,
    sellable: b.sellable,
    status: b.status,
    createdAt: b.created_at,
  }));
}

export async function addBatch(batch: Omit<Batch, 'id' | 'createdAt'>): Promise<Batch> {
  const id = `BATCH-${Date.now()}`;
  const { data, error } = await supabase.from('batches').insert({
    id,
    name: batch.name,
    model_id: batch.modelId,
    model_name: batch.modelName,
    original_quantity: batch.originalQuantity,
    produced: batch.produced,
    packed: batch.packed,
    dispatched: batch.dispatched,
    returns: batch.returns,
    good_returns: batch.goodReturns,
    repair: batch.repair,
    scrap: batch.scrap,
    warehouse: batch.warehouse,
    sellable: batch.sellable,
    status: batch.status,
    created_at: new Date().toISOString().split('T')[0],
  }).select().single();
  if (error) throw error;
  return { ...batch, id: data.id, createdAt: data.created_at };
}

export async function updateBatch(id: string, updates: Partial<Batch>): Promise<void> {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.modelId !== undefined) payload.model_id = updates.modelId;
  if (updates.modelName !== undefined) payload.model_name = updates.modelName;
  if (updates.originalQuantity !== undefined) payload.original_quantity = updates.originalQuantity;
  if (updates.produced !== undefined) payload.produced = updates.produced;
  if (updates.packed !== undefined) payload.packed = updates.packed;
  if (updates.dispatched !== undefined) payload.dispatched = updates.dispatched;
  if (updates.returns !== undefined) payload.returns = updates.returns;
  if (updates.goodReturns !== undefined) payload.good_returns = updates.goodReturns;
  if (updates.repair !== undefined) payload.repair = updates.repair;
  if (updates.scrap !== undefined) payload.scrap = updates.scrap;
  if (updates.warehouse !== undefined) payload.warehouse = updates.warehouse;
  if (updates.sellable !== undefined) payload.sellable = updates.sellable;
  if (updates.status !== undefined) payload.status = updates.status;
  const { error } = await supabase.from('batches').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteBatch(id: string): Promise<void> {
  const { error } = await supabase.from('batches').delete().eq('id', id);
  if (error) throw error;
}

// ── IMEIs ─────────────────────────────────────────────────
export async function fetchIMEIs(): Promise<IMEI[]> {
  const { data, error } = await supabase.from('imeis').select('*');
  if (error) throw error;
  return (data || []).map((i: any) => ({
    id: i.id,
    imei: i.imei,
    model: i.model,
    modelId: i.model_id,
    batch: i.batch,
    batchId: i.batch_id,
    party: i.party,
    partyId: i.party_id,
    invoice: i.invoice,
    saleDate: i.sale_date,
    location: i.location,
    status: i.status,
    history: [],
  }));
}

export async function addIMEI(imei: Omit<IMEI, 'id' | 'history'>): Promise<IMEI> {
  const id = `IMEI-${Date.now()}`;
  const { data, error } = await supabase.from('imeis').insert({
    id,
    imei: imei.imei,
    model: imei.model,
    model_id: imei.modelId,
    batch: imei.batch,
    batch_id: imei.batchId,
    party: imei.party,
    party_id: imei.partyId,
    invoice: imei.invoice,
    sale_date: imei.saleDate,
    location: imei.location,
    status: imei.status,
  }).select().single();
  if (error) throw error;
  return { ...imei, id: data.id, history: [] };
}

export async function updateIMEI(id: string, updates: Partial<IMEI>): Promise<void> {
  const payload: any = {};
  if (updates.imei !== undefined) payload.imei = updates.imei;
  if (updates.model !== undefined) payload.model = updates.model;
  if (updates.modelId !== undefined) payload.model_id = updates.modelId;
  if (updates.batch !== undefined) payload.batch = updates.batch;
  if (updates.batchId !== undefined) payload.batch_id = updates.batchId;
  if (updates.party !== undefined) payload.party = updates.party;
  if (updates.partyId !== undefined) payload.party_id = updates.partyId;
  if (updates.invoice !== undefined) payload.invoice = updates.invoice;
  if (updates.saleDate !== undefined) payload.sale_date = updates.saleDate;
  if (updates.location !== undefined) payload.location = updates.location;
  if (updates.status !== undefined) payload.status = updates.status;
  const { error } = await supabase.from('imeis').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteIMEI(id: string): Promise<void> {
  const { error } = await supabase.from('imeis').delete().eq('id', id);
  if (error) throw error;
}

// ── Sales ─────────────────────────────────────────────────
export async function fetchSales(): Promise<Sale[]> {
  const { data, error } = await supabase.from('sales').select('*, sale_items(*)').order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map((s: any) => ({
    id: s.id,
    invoice: s.invoice,
    partyId: s.party_id,
    partyName: s.party_name,
    date: s.date,
    items: (s.sale_items || []).map((item: any) => ({
      id: item.id,
      imei: item.imei,
      model: item.model,
      batch: item.batch,
      price: Number(item.price),
    })),
    totalAmount: Number(s.total_amount),
    status: s.status,
  }));
}

export async function addSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
  const id = `SALE-${Date.now()}`;
  const { data, error } = await supabase.from('sales').insert({
    id,
    invoice: sale.invoice,
    party_id: sale.partyId,
    party_name: sale.partyName,
    date: sale.date,
    total_amount: sale.totalAmount,
    status: sale.status,
  }).select().single();
  if (error) throw error;

  if (sale.items?.length) {
    const items = sale.items.map((item) => ({
      id: item.id || `${Date.now()}-${Math.random()}`,
      sale_id: id,
      imei: item.imei,
      model: item.model,
      batch: item.batch,
      price: item.price,
    }));
    await supabase.from('sale_items').insert(items);
  }

  return { ...sale, id: data.id };
}

export async function updateSale(id: string, updates: Partial<Sale>): Promise<void> {
  const payload: any = {};
  if (updates.invoice !== undefined) payload.invoice = updates.invoice;
  if (updates.partyId !== undefined) payload.party_id = updates.partyId;
  if (updates.partyName !== undefined) payload.party_name = updates.partyName;
  if (updates.date !== undefined) payload.date = updates.date;
  if (updates.totalAmount !== undefined) payload.total_amount = updates.totalAmount;
  if (updates.status !== undefined) payload.status = updates.status;
  const { error } = await supabase.from('sales').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteSale(id: string): Promise<void> {
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) throw error;
}

// ── Returns ───────────────────────────────────────────────
export async function fetchReturns(): Promise<Return[]> {
  const { data, error } = await supabase.from('returns').select('*').order('return_date', { ascending: false });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    returnNumber: r.return_number || r.return_id || '',
    imei: r.imei || '',
    model: r.model || '',
    partyId: r.party_id,
    partyName: r.party_name,
    originalInvoice: r.original_invoice || r.sale_id || '',
    returnDate: r.return_date,
    reason: r.reason,
    qcStatus: r.qc_status,
    qcNotes: r.qc_notes,
    refundAmount: Number(r.refund_amount),
    returnId: r.return_id,
    saleId: r.sale_id,
    condition: r.condition,
    status: r.status,
  }));
}

export async function addReturn(ret: Omit<Return, 'id'>): Promise<Return> {
  const id = `RET-${Date.now()}`;
  const { data, error } = await supabase.from('returns').insert({
    id,
    return_number: ret.returnNumber,
    imei: ret.imei,
    model: ret.model,
    party_id: ret.partyId,
    party_name: ret.partyName,
    original_invoice: ret.originalInvoice,
    return_date: ret.returnDate,
    reason: ret.reason,
    qc_status: ret.qcStatus,
    qc_notes: ret.qcNotes,
    refund_amount: ret.refundAmount,
    return_id: ret.returnId,
    sale_id: ret.saleId,
    condition: ret.condition,
    status: ret.status,
  }).select().single();
  if (error) throw error;
  return { ...ret, id: data.id };
}

export async function updateReturn(id: string, updates: Partial<Return>): Promise<void> {
  const payload: any = {};
  if (updates.returnNumber !== undefined) payload.return_number = updates.returnNumber;
  if (updates.imei !== undefined) payload.imei = updates.imei;
  if (updates.model !== undefined) payload.model = updates.model;
  if (updates.partyId !== undefined) payload.party_id = updates.partyId;
  if (updates.partyName !== undefined) payload.party_name = updates.partyName;
  if (updates.originalInvoice !== undefined) payload.original_invoice = updates.originalInvoice;
  if (updates.returnDate !== undefined) payload.return_date = updates.returnDate;
  if (updates.reason !== undefined) payload.reason = updates.reason;
  if (updates.qcStatus !== undefined) payload.qc_status = updates.qcStatus;
  if (updates.qcNotes !== undefined) payload.qc_notes = updates.qcNotes;
  if (updates.refundAmount !== undefined) payload.refund_amount = updates.refundAmount;
  if (updates.returnId !== undefined) payload.return_id = updates.returnId;
  if (updates.saleId !== undefined) payload.sale_id = updates.saleId;
  if (updates.condition !== undefined) payload.condition = updates.condition;
  if (updates.status !== undefined) payload.status = updates.status;
  const { error } = await supabase.from('returns').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteReturn(id: string): Promise<void> {
  const { error } = await supabase.from('returns').delete().eq('id', id);
  if (error) throw error;
}

// ── Repair Orders ─────────────────────────────────────────
export async function fetchRepairOrders(): Promise<RepairOrder[]> {
  const { data, error } = await supabase.from('repair_orders').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    imei: r.imei,
    model: r.model,
    batch: r.batch,
    issue: r.issue,
    diagnosis: r.diagnosis,
    partsUsed: r.parts_used,
    technician: r.technician,
    startDate: r.start_date,
    completionDate: r.completion_date,
    cost: Number(r.cost),
    status: r.status,
    notes: r.notes || '',
  }));
}

export async function addRepairOrder(order: Omit<RepairOrder, 'id'>): Promise<RepairOrder> {
  const id = `REP-${Date.now()}`;
  const { data, error } = await supabase.from('repair_orders').insert({
    id,
    imei: order.imei,
    model: order.model,
    batch: order.batch,
    issue: order.issue,
    diagnosis: order.diagnosis,
    parts_used: order.partsUsed,
    technician: order.technician,
    start_date: order.startDate,
    completion_date: order.completionDate,
    cost: order.cost,
    status: order.status,
    notes: order.notes || '',
  }).select().single();
  if (error) throw error;
  return { ...order, id: data.id };
}

export async function updateRepairOrder(id: string, updates: Partial<RepairOrder>): Promise<void> {
  const payload: any = {};
  if (updates.imei !== undefined) payload.imei = updates.imei;
  if (updates.model !== undefined) payload.model = updates.model;
  if (updates.batch !== undefined) payload.batch = updates.batch;
  if (updates.issue !== undefined) payload.issue = updates.issue;
  if (updates.diagnosis !== undefined) payload.diagnosis = updates.diagnosis;
  if (updates.partsUsed !== undefined) payload.parts_used = updates.partsUsed;
  if (updates.technician !== undefined) payload.technician = updates.technician;
  if (updates.startDate !== undefined) payload.start_date = updates.startDate;
  if (updates.completionDate !== undefined) payload.completion_date = updates.completionDate;
  if (updates.cost !== undefined) payload.cost = updates.cost;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  const { error } = await supabase.from('repair_orders').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteRepairOrder(id: string): Promise<void> {
  const { error } = await supabase.from('repair_orders').delete().eq('id', id);
  if (error) throw error;
}

// ── Payments ──────────────────────────────────────────────
export async function fetchPayments(): Promise<Payment[]> {
  const { data, error } = await supabase.from('payments').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    partyId: p.party_id,
    partyName: p.party_name,
    amount: Number(p.amount),
    date: p.date,
    method: p.method,
    reference: p.reference,
    notes: p.notes,
  }));
}

export async function addPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
  const id = `PAY-${Date.now()}`;
  const { data, error } = await supabase.from('payments').insert({
    id,
    party_id: payment.partyId,
    party_name: payment.partyName,
    amount: payment.amount,
    date: payment.date,
    method: payment.method,
    reference: payment.reference,
    notes: payment.notes,
  }).select().single();
  if (error) throw error;
  return { ...payment, id: data.id };
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) throw error;
}

// ── Inventory Transactions ──────────────────────────────────
export async function fetchTransactions(): Promise<InventoryTransaction[]> {
  const { data, error } = await supabase.from('inventory_transactions').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map((t: any) => ({
    id: t.id,
    type: t.type,
    itemType: t.item_type,
    itemId: t.item_id,
    itemName: t.item_name,
    quantity: t.quantity,
    reference: t.reference,
    date: t.date,
    user: t.user_name,
  }));
}

export async function addTransaction(transaction: Omit<InventoryTransaction, 'id'>): Promise<InventoryTransaction> {
  const id = `TXN-${Date.now()}`;
  const { data, error } = await supabase.from('inventory_transactions').insert({
    id,
    type: transaction.type,
    item_type: transaction.itemType,
    item_id: transaction.itemId,
    item_name: transaction.itemName,
    quantity: transaction.quantity,
    reference: transaction.reference,
    date: transaction.date,
    user_name: transaction.user,
  }).select().single();
  if (error) throw error;
  return {
    id: data.id,
    type: data.type,
    itemType: data.item_type,
    itemId: data.item_id,
    itemName: data.item_name,
    quantity: data.quantity,
    reference: data.reference,
    date: data.date,
    user: data.user_name,
  };
}

// ── Dashboard Stats ───────────────────────────────────────
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.from('dashboard_stats').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  if (!data) {
    return {
      produced: 0,
      dispatched: 0,
      customerReturns: 0,
      sellableStock: 0,
      repairStock: 0,
      scrapRejected: 0,
    };
  }
  return {
    produced: data.total_production || 0,
    dispatched: data.total_dispatched || 0,
    customerReturns: data.total_returns || 0,
    sellableStock: data.sellable_stock || 0,
    repairStock: data.repair_stock || 0,
    scrapRejected: data.scrap_stock || 0,
    totalProduction: data.total_production,
    totalDispatched: data.total_dispatched,
    totalReturns: data.total_returns,
    scrapStock: data.scrap_stock,
    totalRevenue: Number(data.total_revenue),
    totalReceivable: Number(data.total_receivable),
    activeParties: data.active_parties,
    lowStockItems: data.low_stock_items,
  };
}

export async function updateDashboardStats(stats: Partial<DashboardStats>): Promise<void> {
  const payload: any = { updated_at: new Date().toISOString() };
  if (stats.produced !== undefined) payload.total_production = stats.produced;
  if (stats.dispatched !== undefined) payload.total_dispatched = stats.dispatched;
  if (stats.customerReturns !== undefined) payload.total_returns = stats.customerReturns;
  if (stats.sellableStock !== undefined) payload.sellable_stock = stats.sellableStock;
  if (stats.repairStock !== undefined) payload.repair_stock = stats.repairStock;
  if (stats.scrapRejected !== undefined) payload.scrap_stock = stats.scrapRejected;
  if (stats.totalRevenue !== undefined) payload.total_revenue = stats.totalRevenue;
  if (stats.totalReceivable !== undefined) payload.total_receivable = stats.totalReceivable;
  if (stats.activeParties !== undefined) payload.active_parties = stats.activeParties;
  if (stats.lowStockItems !== undefined) payload.low_stock_items = stats.lowStockItems;
  const { error } = await supabase.from('dashboard_stats').update(payload).eq('id', 1);
  if (error) throw error;
}

// ── Bulk Fetch All ────────────────────────────────────────
export async function fetchAllData() {
  const [
    users,
    roles,
    parties,
    products,
    models,
    batches,
    components,
    bomItems,
    imeis,
    sales,
    returns,
    repairOrders,
    transactions,
    payments,
    dashboardStats,
  ] = await Promise.all([
    fetchUsers(),
    fetchRoles(),
    fetchParties(),
    supabase.from('products').select('*').then(({ data }: { data: any[] | null }) => data || []),
    fetchModels(),
    fetchBatches(),
    fetchComponents(),
    fetchBOMItems(),
    fetchIMEIs(),
    fetchSales(),
    fetchReturns(),
    fetchRepairOrders(),
    fetchTransactions(),
    fetchPayments(),
    fetchDashboardStats(),
  ]);

  return {
    users,
    roles,
    parties,
    products,
    models,
    batches,
    components,
    bomItems,
    imeis,
    sales,
    returns,
    repairOrders,
    transactions,
    payments,
    dashboardStats,
  };
}
