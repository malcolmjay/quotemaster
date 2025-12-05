/**
 * Example Component: Real-time Inventory Display
 * Shows how to use ERP inventory integration in your components
 */

import React from 'react';
import { Package, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useERPInventory } from '../../hooks/useERPInventory';

interface InventoryDisplayProps {
  sku: string;
  warehouse?: string;
  showDetails?: boolean;
  minQuantity?: number;
}

export const InventoryDisplay: React.FC<InventoryDisplayProps> = ({
  sku,
  warehouse,
  showDetails = true,
  minQuantity = 0
}) => {
  const { inventory, loading, error, lastSynced, refresh, isStale } = useERPInventory({
    sku,
    warehouse,
    autoSync: true,
    syncInterval: 5, // Auto-refresh every 5 minutes
    useCache: true
  });

  if (loading && !inventory) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Loading inventory...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Unable to fetch inventory: {error}</span>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="text-gray-500 text-sm">
        No inventory data available
      </div>
    );
  }

  const isInStock = inventory.quantityAvailable >= minQuantity;
  const isLowStock = inventory.quantityAvailable <= (inventory.reorderPoint || 10);

  return (
    <div className="inventory-display">
      {/* Compact View */}
      <div className="flex items-center space-x-2">
        <Package className={`h-4 w-4 ${isInStock ? 'text-green-600' : 'text-red-600'}`} />

        <div className="flex items-center space-x-2">
          <span className="font-medium">
            {inventory.quantityAvailable} available
          </span>

          {isLowStock && (
            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
              Low Stock
            </span>
          )}

          {isStale && (
            <button
              onClick={refresh}
              className="p-1 hover:bg-gray-100 rounded"
              title="Data may be stale - click to refresh"
            >
              <Clock className="h-3 w-3 text-orange-500" />
            </button>
          )}

          {!isStale && lastSynced && (
            <CheckCircle className="h-3 w-3 text-green-500" title="Data is fresh" />
          )}
        </div>
      </div>

      {/* Detailed View */}
      {showDetails && (
        <div className="mt-2 space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>On Hand:</span>
            <span className="font-medium">{inventory.quantityOnHand}</span>
          </div>

          <div className="flex justify-between">
            <span>Reserved:</span>
            <span className="font-medium">{inventory.quantityReserved}</span>
          </div>

          <div className="flex justify-between">
            <span>Available:</span>
            <span className="font-medium text-green-600">
              {inventory.quantityAvailable}
            </span>
          </div>

          {inventory.reorderPoint && (
            <div className="flex justify-between">
              <span>Reorder Point:</span>
              <span className="font-medium">{inventory.reorderPoint}</span>
            </div>
          )}

          {inventory.leadTimeDays && (
            <div className="flex justify-between">
              <span>Lead Time:</span>
              <span className="font-medium">{inventory.leadTimeDays} days</span>
            </div>
          )}

          {inventory.location && (
            <div className="flex justify-between">
              <span>Location:</span>
              <span className="font-medium">{inventory.location}</span>
            </div>
          )}

          {lastSynced && (
            <div className="flex justify-between text-xs pt-1 border-t">
              <span>Last Updated:</span>
              <span>{lastSynced.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={refresh}
        disabled={loading}
        className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        <span>Refresh</span>
      </button>
    </div>
  );
};

/**
 * Example: Inventory Badge (minimal display)
 */
export const InventoryBadge: React.FC<{ sku: string; minQuantity?: number }> = ({
  sku,
  minQuantity = 1
}) => {
  const { inventory, loading, error } = useERPInventory({
    sku,
    autoSync: true,
    useCache: true
  });

  if (loading) {
    return <span className="badge badge-gray">Checking...</span>;
  }

  if (error || !inventory) {
    return <span className="badge badge-gray">Unknown</span>;
  }

  const isInStock = inventory.quantityAvailable >= minQuantity;

  return (
    <span className={`badge ${isInStock ? 'badge-green' : 'badge-red'}`}>
      {isInStock ? `In Stock (${inventory.quantityAvailable})` : 'Out of Stock'}
    </span>
  );
};

/**
 * Example: Inventory Status Indicator
 */
export const InventoryStatus: React.FC<{
  sku: string;
  requiredQuantity: number;
}> = ({ sku, requiredQuantity }) => {
  const { inventory, loading } = useERPInventory({ sku });

  if (loading || !inventory) {
    return <span className="text-gray-500">•••</span>;
  }

  const available = inventory.quantityAvailable;
  const canFulfill = available >= requiredQuantity;

  if (canFulfill) {
    return (
      <div className="flex items-center space-x-1 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>Available ({available})</span>
      </div>
    );
  }

  const shortage = requiredQuantity - available;

  return (
    <div className="flex items-center space-x-1 text-red-600">
      <AlertCircle className="h-4 w-4" />
      <span>Short {shortage} units</span>
      {available > 0 && <span className="text-gray-500">({available} available)</span>}
    </div>
  );
};
