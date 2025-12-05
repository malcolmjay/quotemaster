/**
 * React Hook for ERP Inventory Integration
 * Provides easy access to real-time inventory data from ERP
 */

import { useState, useEffect, useCallback } from 'react';
import { getERPApiService, ERPInventoryItem } from '../services/erpApiService';
import { getInventorySyncService } from '../services/inventorySyncService';
import { logger } from '../utils/logger';

export interface UseERPInventoryOptions {
  sku?: string;
  warehouse?: string;
  autoSync?: boolean;
  syncInterval?: number; // minutes
  useCache?: boolean;
}

export interface UseERPInventoryResult {
  inventory: ERPInventoryItem | null;
  loading: boolean;
  error: string | null;
  lastSynced: Date | null;
  refresh: () => Promise<void>;
  isStale: boolean;
}

/**
 * Hook to fetch and manage inventory data for a single SKU
 */
export function useERPInventory(options: UseERPInventoryOptions): UseERPInventoryResult {
  const { sku, warehouse, autoSync = true, syncInterval = 5, useCache = true } = options;

  const [inventory, setInventory] = useState<ERPInventoryItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  const erpService = getERPApiService();
  const syncService = getInventorySyncService();

  /**
   * Fetch inventory data
   */
  const fetchInventory = useCallback(async (forceRefresh = false) => {
    if (!sku) {
      logger.warn('useERPInventory: No SKU provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('Fetching inventory', { sku, warehouse, forceRefresh });

      let inventoryData: ERPInventoryItem | null = null;

      if (useCache && !forceRefresh) {
        // Try auto-sync (uses cache if fresh, syncs if stale)
        inventoryData = await syncService.getInventoryWithAutoSync(sku, warehouse);
      } else {
        // Direct ERP fetch
        const response = await erpService.getInventoryBySKU(sku, warehouse, !forceRefresh);

        if (response.success && response.data) {
          inventoryData = response.data;

          // Sync to Supabase in background
          if (useCache) {
            syncService.syncInventoryBySKU(sku, warehouse).catch(err =>
              logger.error('Background sync failed', err)
            );
          }
        } else {
          setError(response.error || 'Failed to fetch inventory');
        }
      }

      if (inventoryData) {
        setInventory(inventoryData);
        setLastSynced(new Date());
        setIsStale(false);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to fetch inventory', err, { sku });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sku, warehouse, useCache, erpService, syncService]);

  /**
   * Manual refresh
   */
  const refresh = useCallback(async () => {
    await fetchInventory(true);
  }, [fetchInventory]);

  /**
   * Initial fetch
   */
  useEffect(() => {
    if (sku) {
      fetchInventory(false);
    }
  }, [sku, fetchInventory]);

  /**
   * Auto-sync interval
   */
  useEffect(() => {
    if (!autoSync || !sku) return;

    const intervalId = setInterval(() => {
      logger.debug('Auto-sync interval triggered', { sku });
      setIsStale(true);
      fetchInventory(false);
    }, syncInterval * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [autoSync, sku, syncInterval, fetchInventory]);

  /**
   * Check if data is stale
   */
  useEffect(() => {
    if (!lastSynced) return;

    const checkStale = setInterval(() => {
      const now = Date.now();
      const lastSyncTime = lastSynced.getTime();
      const staleThreshold = syncInterval * 60 * 1000;

      setIsStale((now - lastSyncTime) > staleThreshold);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkStale);
  }, [lastSynced, syncInterval]);

  return {
    inventory,
    loading,
    error,
    lastSynced,
    refresh,
    isStale
  };
}

/**
 * Hook to fetch inventory for multiple SKUs
 */
export function useERPInventoryBatch(
  skus: string[],
  warehouse?: string,
  useCache = true
): {
  inventories: Map<string, ERPInventoryItem>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [inventories, setInventories] = useState<Map<string, ERPInventoryItem>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const erpService = getERPApiService();
  const syncService = getInventorySyncService();

  const fetchInventories = useCallback(async () => {
    if (skus.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      logger.debug('Fetching batch inventory', { count: skus.length, warehouse });

      if (useCache) {
        // Use sync service with cache
        const result = await syncService.syncInventoryBatch(skus, warehouse);

        if (result.success) {
          // Fetch from cache
          const inventoryMap = new Map<string, ERPInventoryItem>();

          for (const sku of skus) {
            const cached = await syncService.getInventoryFromCache(sku, warehouse);
            if (cached) {
              inventoryMap.set(sku, {
                sku,
                warehouseCode: cached.warehouse,
                quantityOnHand: cached.quantity_on_hand,
                quantityReserved: cached.quantity_reserved,
                quantityAvailable: cached.quantity_available,
                reorderPoint: cached.reorder_point,
                reorderQuantity: cached.reorder_quantity
              });
            }
          }

          setInventories(inventoryMap);
        } else {
          setError(result.errors.join(', '));
        }
      } else {
        // Direct ERP fetch
        const response = await erpService.getInventoryBatch(skus, warehouse);

        if (response.success && response.data) {
          const inventoryMap = new Map<string, ERPInventoryItem>();
          response.data.forEach(item => inventoryMap.set(item.sku, item));
          setInventories(inventoryMap);
        } else {
          setError(response.error || 'Failed to fetch inventories');
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to fetch batch inventory', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [skus, warehouse, useCache, erpService, syncService]);

  const refresh = useCallback(async () => {
    await fetchInventories();
  }, [fetchInventories]);

  useEffect(() => {
    fetchInventories();
  }, [fetchInventories]);

  return {
    inventories,
    loading,
    error,
    refresh
  };
}

/**
 * Hook to check ERP API health
 */
export function useERPHealth(): {
  isHealthy: boolean;
  checking: boolean;
  lastCheck: Date | null;
  checkHealth: () => Promise<void>;
} {
  const [isHealthy, setIsHealthy] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const erpService = getERPApiService();

  const checkHealth = useCallback(async () => {
    setChecking(true);

    try {
      const healthy = await erpService.healthCheck();
      setIsHealthy(healthy);
      setLastCheck(new Date());

      logger.info('ERP health check completed', { healthy });
    } catch (err) {
      logger.error('ERP health check failed', err);
      setIsHealthy(false);
    } finally {
      setChecking(false);
    }
  }, [erpService]);

  // Check health on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Periodic health check every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [checkHealth]);

  return {
    isHealthy,
    checking,
    lastCheck,
    checkHealth
  };
}
