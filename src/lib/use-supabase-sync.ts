'use client';

import { useEffect, useCallback } from 'react';
import { useDataStore } from './store';
import * as supabaseData from './supabase-data';

export function useSupabaseSync() {
  const setData = useDataStore((state) => state.setData);

  const syncAll = useCallback(async () => {
    try {
      const data = await supabaseData.fetchAllData();

      // Before merging, push any local-only audit logs to Supabase
      const localLogs = useDataStore.getState().auditLogs;
      const supabaseIds = new Set((data.auditLogs || []).map((l: any) => l.id));
      const localOnlyLogs = localLogs.filter((l) => !supabaseIds.has(l.id));
      if (localOnlyLogs.length > 0) {
        await Promise.all(
          localOnlyLogs.map((l) =>
            supabaseData.addAuditLogToSupabase(l).catch(() => {})
          )
        );
      }

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
    // Re-sync every 30 seconds to pick up audit logs from other users
    const interval = setInterval(syncAll, 30000);
    return () => clearInterval(interval);
  }, [syncAll]);

  return { syncAll };
}
