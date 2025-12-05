import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface InventoryItem {
  sku: string;
  productName: string;
  category: string;
  supplier: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  unitCost: number;
  leadTime: string;
  leadTimeDays: number;
  warehouse: string;
  lastRestockDate: string;
  reorderPoint: number;
  reorderQuantity: number;
}

interface ReservationRequest {
  id: string;
  quoteId: string;
  lineItemId: string;
  sku: string;
  quantityRequested: number;
  quantityReserved: number;
  reservedDate: string;
  expirationDate: string;
  status: 'active' | 'expired' | 'released' | 'converted';
}

interface InventoryContextType {
  inventory: InventoryItem[];
  products: InventoryItem[];
  reservations: ReservationRequest[];
  getInventoryItem: (sku: string) => InventoryItem | null;
  getAvailableQuantity: (sku: string) => number;
  getNextAvailableDate: (sku: string, requestedQuantity: number) => string;
  reserveInventory: (sku: string, quantity: number, quoteId: string, lineItemId: string) => boolean;
  releaseReservation: (reservationId: string) => boolean;
  updateInventory: (sku: string, updates: Partial<InventoryItem>) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

interface InventoryProviderProps {
  children: ReactNode;
}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const fetchInventory = async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          inventory_levels (
            quantity_on_hand,
            quantity_reserved,
            quantity_available,
            reorder_point,
            reorder_quantity,
            last_restock_date,
            warehouse
          )
        `)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching inventory:', error);
        return;
      }

      const inventoryItems: InventoryItem[] = (data || []).map((product: any) => {
        const invLevel = product.inventory_levels?.[0] || {};
        return {
          sku: product.sku,
          productName: product.name,
          category: product.category,
          supplier: product.supplier,
          quantityOnHand: invLevel.quantity_on_hand || 0,
          quantityReserved: invLevel.quantity_reserved || 0,
          quantityAvailable: invLevel.quantity_available || 0,
          unitCost: parseFloat(product.unit_cost || 0),
          leadTime: product.lead_time_text || `${product.lead_time_days} days`,
          leadTimeDays: product.lead_time_days || 0,
          warehouse: invLevel.warehouse || product.warehouse || 'Main',
          lastRestockDate: invLevel.last_restock_date || new Date().toISOString().split('T')[0],
          reorderPoint: invLevel.reorder_point || 0,
          reorderQuantity: invLevel.reorder_quantity || 0,
        };
      });

      setInventory(inventoryItems);
    };

    fetchInventory();
  }, []);

  const [reservations, setReservations] = useState<ReservationRequest[]>([]);

  const getInventoryItem = (sku: string): InventoryItem | null => {
    return inventory.find(item => item.sku === sku) || null;
  };

  const getAvailableQuantity = (sku: string): number => {
    const item = getInventoryItem(sku);
    return item ? item.quantityAvailable : 0;
  };

  const getNextAvailableDate = (sku: string, requestedQuantity: number): string => {
    const item = getInventoryItem(sku);
    if (!item) return new Date().toISOString().split('T')[0];

    if (item.quantityAvailable >= requestedQuantity) {
      return new Date().toISOString().split('T')[0];
    }

    // Calculate next available date based on lead time
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + item.leadTimeDays);
    return nextDate.toISOString().split('T')[0];
  };

  const reserveInventory = (
    sku: string,
    quantity: number,
    quoteId: string,
    lineItemId: string
  ): boolean => {
    const item = getInventoryItem(sku);
    if (!item || item.quantityAvailable < quantity) {
      return false;
    }

    const reservation: ReservationRequest = {
      id: `RES-${Date.now()}`,
      quoteId,
      lineItemId,
      sku,
      quantityRequested: quantity,
      quantityReserved: quantity,
      reservedDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    };

    setReservations(prev => [...prev, reservation]);

    return true;
  };

  const releaseReservation = (reservationId: string): boolean => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation || reservation.status !== 'active') {
      return false;
    }

    setReservations(prev =>
      prev.map(r =>
        r.id === reservationId
          ? { ...r, status: 'released' as const }
          : r
      )
    );

    return true;
  };

  const updateInventory = (sku: string, updates: Partial<InventoryItem>) => {
    // In a real application, this would make an API call to update inventory
    console.log('Updating inventory:', sku, updates);
  };

  const value: InventoryContextType = {
    inventory,
    products: inventory,
    reservations,
    getInventoryItem,
    getAvailableQuantity,
    getNextAvailableDate,
    reserveInventory,
    releaseReservation,
    updateInventory
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};