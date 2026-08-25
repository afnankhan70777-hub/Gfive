'use client';

import { useEffect, useCallback } from 'react';
import { useDataStore } from './store';
import * as supabaseData from './supabase-data';

export function useSupabaseSync() {
  const setData = useDataStore((state) => state.setData);

  const syncAll = useCallback(async () => {
    try {
      const data = await supabaseData.fetchAllData();
      setData({
        users: data.users,
        roles: data.roles,
        parties: data.parties,
        products: data.products,
        models: data.models,
        batches: data.batches,
        components: data.components,
        bomItems: data.bomItems,
        imeis: data.imeis,
        sales: data.sales,
        returns: data.returns,
        repairOrders: data.repairOrders,
        transactions: data.transactions,
        payments: data.payments,
        dashboardStats: data.dashboardStats,
        auditLogs: data.auditLogs,
      });
    } catch (err) {
      console.error('Supabase sync failed:', err);
    }
  }, [setData]);

  useEffect(() => {
    syncAll();
  }, [syncAll]);

  return { syncAll };
}
