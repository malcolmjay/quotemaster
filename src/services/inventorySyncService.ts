/**
 * Inventory Sync Service
 * Syncs inventory data from ERP API to Supabase for caching and offline access
 */

import { supabase } from '../lib/supabase';
import { getERPApiService, ERPInventoryItem } from './erpApiService';
import { logger } from '../utils/logger';

export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  errors: string[];
  timestamp: string;
}

export interface InventoryRecord {
  id?: string;
  product_id?: string;
  sku: string;
  warehouse: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  reorder_point: number;
  reorder_quantity: number;
  last_restock_date?: string;
  last_synced_at: string;
  erp_last_updated?: string;
}

export class InventorySyncService {
  private erpService = getERPApiService();
  private syncInProgress = false;

  /**
   * Sync inventory for a single SKU from ERP to Supabase
   */
  async syncInventoryBySKU(sku: string, warehouseCode?: string): Promise<SyncResult> {
    logger.operation('syncInventoryBySKU', 'start', { sku, warehouseCode });

    const errors: string[] = [];

    try {
      // Fetch from ERP
      const erpResponse = await this.erpService.getInventoryBySKU(sku, warehouseCode, false);

      if (!erpResponse.success || !erpResponse.data) {
        errors.push(`Failed to fetch inventory for SKU ${sku}: ${erpResponse.error}`);
        return {
          success: false,
          itemsSynced: 0,
          errors,
          timestamp: new Date().toISOString()
        };
      }

      // Sync to Supabase
      await this.upsertInventoryToSupabase(erpResponse.data);

      logger.operation('syncInventoryBySKU', 'success', { sku });

      return {
        success: true,
        itemsSynced: 1,
        errors: [],
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Sync failed for SKU', error, { sku });
      errors.push(`Sync error for ${sku}: ${errorMessage}`);

      return {
        success: false,
        itemsSynced: 0,
        errors,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Sync inventory for multiple SKUs
   */
  async syncInventoryBatch(skus: string[], warehouseCode?: string): Promise<SyncResult> {
    logger.operation('syncInventoryBatch', 'start', { count: skus.length, warehouseCode });

    const errors: string[] = [];
    let itemsSynced = 0;

    try {
      // Try batch fetch first
      const erpResponse = await this.erpService.getInventoryBatch(skus, warehouseCode, false);

      if (erpResponse.success && erpResponse.data) {
        // Sync all items to Supabase
        for (const item of erpResponse.data) {
          try {
            await this.upsertInventoryToSupabase(item);
            itemsSynced++;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Failed to sync ${item.sku}: ${errorMessage}`);
          }
        }
      } else {
        // Fallback to individual requests if batch fails
        logger.warn('Batch sync failed, falling back to individual requests');

        for (const sku of skus) {
          const result = await this.syncInventoryBySKU(sku, warehouseCode);
          if (result.success) {
            itemsSynced++;
          } else {
            errors.push(...result.errors);
          }
        }
      }

      logger.operation('syncInventoryBatch', 'success', { itemsSynced, errors: errors.length });

      return {
        success: errors.length === 0,
        itemsSynced,
        errors,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Batch sync failed', error, { count: skus.length });
      errors.push(`Batch sync error: ${errorMessage}`);

      return {
        success: false,
        itemsSynced,
        errors,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Sync all inventory for a warehouse
   */
  async syncWarehouseInventory(warehouseCode: string): Promise<SyncResult> {
    if (this.syncInProgress) {
      logger.warn('Sync already in progress');
      return {
        success: false,
        itemsSynced: 0,
        errors: ['Sync already in progress'],
        timestamp: new Date().toISOString()
      };
    }

    this.syncInProgress = true;
    logger.operation('syncWarehouseInventory', 'start', { warehouseCode });

    const errors: string[] = [];
    let itemsSynced = 0;

    try {
      // Fetch all inventory from ERP
      const erpResponse = await this.erpService.getWarehouseInventory(warehouseCode, false);

      if (!erpResponse.success || !erpResponse.data) {
        errors.push(`Failed to fetch warehouse inventory: ${erpResponse.error}`);
        return {
          success: false,
          itemsSynced: 0,
          errors,
          timestamp: new Date().toISOString()
        };
      }

      // Sync each item to Supabase
      for (const item of erpResponse.data) {
        try {
          await this.upsertInventoryToSupabase(item);
          itemsSynced++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to sync ${item.sku}: ${errorMessage}`);
        }
      }

      logger.operation('syncWarehouseInventory', 'success', {
        warehouseCode,
        itemsSynced,
        errors: errors.length
      });

      return {
        success: errors.length === 0,
        itemsSynced,
        errors,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Warehouse sync failed', error, { warehouseCode });
      errors.push(`Warehouse sync error: ${errorMessage}`);

      return {
        success: false,
        itemsSynced,
        errors,
        timestamp: new Date().toISOString()
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Upsert inventory item to Supabase
   */
  private async upsertInventoryToSupabase(erpItem: ERPInventoryItem): Promise<void> {
    logger.debug('Upserting inventory to Supabase', { sku: erpItem.sku });

    // First, try to find the product by SKU
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('sku', erpItem.sku)
      .maybeSingle();

    const inventoryRecord: Partial<InventoryRecord> = {
      warehouse: erpItem.warehouseCode || 'main',
      quantity_on_hand: erpItem.quantityOnHand,
      quantity_reserved: erpItem.quantityReserved,
      quantity_available: erpItem.quantityAvailable,
      reorder_point: erpItem.reorderPoint || 0,
      reorder_quantity: erpItem.reorderQuantity || 0,
      last_restock_date: erpItem.lastRestockDate,
      last_synced_at: new Date().toISOString()
    };

    if (product?.id) {
      inventoryRecord.product_id = product.id;
    }

    // Upsert to inventory_levels table
    const { error } = await supabase
      .from('inventory_levels')
      .upsert(
        {
          ...inventoryRecord,
          product_id: product?.id
        },
        {
          onConflict: 'product_id,warehouse'
        }
      );

    if (error) {
      logger.error('Failed to upsert inventory', error, { sku: erpItem.sku });
      throw error;
    }

    logger.debug('Inventory upserted successfully', { sku: erpItem.sku });
  }

  /**
   * Get inventory from Supabase (cached data)
   */
  async getInventoryFromCache(sku: string, warehouse?: string): Promise<InventoryRecord | null> {
    try {
      let query = supabase
        .from('inventory_levels')
        .select(`
          *,
          products!inventory_levels_product_id_fkey (sku)
        `)
        .eq('products.sku', sku);

      if (warehouse) {
        query = query.eq('warehouse', warehouse);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        logger.error('Failed to get cached inventory', error, { sku });
        return null;
      }

      return data as InventoryRecord;

    } catch (error) {
      logger.error('Error getting cached inventory', error, { sku });
      return null;
    }
  }

  /**
   * Check if cached data is stale (older than threshold)
   */
  isCacheStale(lastSyncedAt: string, thresholdMinutes = 5): boolean {
    const lastSync = new Date(lastSyncedAt).getTime();
    const now = Date.now();
    const thresholdMs = thresholdMinutes * 60 * 1000;

    return (now - lastSync) > thresholdMs;
  }

  /**
   * Get inventory with auto-sync if stale
   */
  async getInventoryWithAutoSync(
    sku: string,
    warehouse?: string,
    forceSync = false
  ): Promise<ERPInventoryItem | null> {
    logger.debug('Getting inventory with auto-sync', { sku, warehouse, forceSync });

    // Check cache first
    if (!forceSync) {
      const cached = await this.getInventoryFromCache(sku, warehouse);

      if (cached && !this.isCacheStale(cached.last_synced_at)) {
        logger.debug('Using cached inventory', { sku, age: cached.last_synced_at });

        return {
          sku,
          warehouseCode: cached.warehouse,
          quantityOnHand: cached.quantity_on_hand,
          quantityReserved: cached.quantity_reserved,
          quantityAvailable: cached.quantity_available,
          reorderPoint: cached.reorder_point,
          reorderQuantity: cached.reorder_quantity,
          lastRestockDate: cached.last_restock_date || undefined
        };
      }
    }

    // Cache miss or stale - sync from ERP
    logger.debug('Cache miss or stale, fetching from ERP', { sku });

    const syncResult = await this.syncInventoryBySKU(sku, warehouse);

    if (!syncResult.success) {
      logger.warn('Failed to sync inventory, using stale cache if available', { sku });

      // Return stale cache as fallback
      const cached = await this.getInventoryFromCache(sku, warehouse);
      if (cached) {
        return {
          sku,
          warehouseCode: cached.warehouse,
          quantityOnHand: cached.quantity_on_hand,
          quantityReserved: cached.quantity_reserved,
          quantityAvailable: cached.quantity_available,
          reorderPoint: cached.reorder_point,
          reorderQuantity: cached.reorder_quantity,
          lastRestockDate: cached.last_restock_date || undefined
        };
      }

      return null;
    }

    // Fetch fresh data from cache
    const fresh = await this.getInventoryFromCache(sku, warehouse);

    if (fresh) {
      return {
        sku,
        warehouseCode: fresh.warehouse,
        quantityOnHand: fresh.quantity_on_hand,
        quantityReserved: fresh.quantity_reserved,
        quantityAvailable: fresh.quantity_available,
        reorderPoint: fresh.reorder_point,
        reorderQuantity: fresh.reorder_quantity,
        lastRestockDate: fresh.last_restock_date || undefined
      };
    }

    return null;
  }

  /**
   * Schedule periodic sync (call this on app startup)
   */
  startPeriodicSync(intervalMinutes = 15, warehouseCode = 'main'): NodeJS.Timeout {
    logger.info('Starting periodic inventory sync', { intervalMinutes, warehouseCode });

    return setInterval(async () => {
      logger.info('Running scheduled inventory sync');
      const result = await this.syncWarehouseInventory(warehouseCode);

      if (result.success) {
        logger.info('Scheduled sync completed', {
          itemsSynced: result.itemsSynced
        });
      } else {
        logger.error('Scheduled sync failed', undefined, {
          errors: result.errors
        });
      }
    }, intervalMinutes * 60 * 1000);
  }
}

// Singleton instance
let inventorySyncServiceInstance: InventorySyncService | null = null;

export function getInventorySyncService(): InventorySyncService {
  if (!inventorySyncServiceInstance) {
    inventorySyncServiceInstance = new InventorySyncService();
  }
  return inventorySyncServiceInstance;
}
