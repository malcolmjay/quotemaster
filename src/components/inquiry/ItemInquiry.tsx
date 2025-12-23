import React, { useState } from 'react';
import { Search, Package, Warehouse, TrendingUp, TrendingDown, Truck, CheckCircle, AlertCircle, Info, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

interface ProductData {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  supplier: string;
  supplier_email: string | null;
  list_price: number;
  unit_cost: number;
  category: string | null;
  category_set: string | null;
  item_type: string | null;
  warehouse: string | null;
  lead_time_days: number;
  lead_time_text: string | null;
  status: string;
  inventory_item_id: string | null;
  unit_of_measure: string | null;
  inventory_levels?: Array<{
    quantity_on_hand: number;
    warehouse: string;
  }>;
}

interface InventoryLevel {
  warehouse: string;
  onHand: number;
  min: number;
  max: number;
  available: number;
}

interface Order {
  orderNumber: string;
  orderDate: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  status: string;
  promisedDate?: string;
  shipDate?: string;
  customer?: string;
}

export const ItemInquiry: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [crossReference, setCrossReference] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [inventoryLevels, setInventoryLevels] = useState<InventoryLevel[]>([]);
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [shippedOrders, setShippedOrders] = useState<Order[]>([]);

  const handleSearch = React.useCallback(async (skuOverride?: string) => {
    const term = (skuOverride || searchTerm).trim();

    if (!term) {
      setError('Please enter a part number or cross reference');
      return;
    }

    setSearching(true);
    setError(null);
    setProduct(null);
    setCrossReference(null);
    setInventoryLevels([]);
    setOpenOrders([]);
    setShippedOrders([]);

    try {

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          inventory_levels (quantity_on_hand, warehouse)
        `)
        .eq('sku', term)
        .maybeSingle();

      if (productError && productError.code !== 'PGRST116') {
        throw productError;
      }

      if (productData) {
        setProduct(productData);
        logger.info('Product found', { sku: productData.sku });
        await fetchAdditionalData(productData.sku, productData.inventory_item_id);
      } else {
        const { data: crossRefData, error: crossRefError } = await supabase
          .from('cross_references')
          .select(`
            *,
            products (
              *,
              inventory_levels (quantity_on_hand, warehouse)
            )
          `)
          .or(`customer_part_number.eq.${term},supplier_part_number.eq.${term}`)
          .maybeSingle();

        if (crossRefError && crossRefError.code !== 'PGRST116') {
          throw crossRefError;
        }

        if (crossRefData && crossRefData.products) {
          setProduct(crossRefData.products);
          setCrossReference(crossRefData);
          logger.info('Product found via cross reference', {
            crossRef: term,
            sku: crossRefData.products.sku
          });
          await fetchAdditionalData(crossRefData.products.sku, crossRefData.products.inventory_item_id);
        } else {
          setError(`No product found for "${term}". Try searching by internal part number or cross reference.`);
        }
      }
    } catch (err) {
      logger.error('Item inquiry search failed', err);
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  }, [searchTerm]);

  React.useEffect(() => {
    const hashParts = window.location.hash.split('?');
    if (hashParts.length > 1) {
      const urlParams = new URLSearchParams(hashParts[1]);
      const skuParam = urlParams.get('sku');
      if (skuParam) {
        setSearchTerm(skuParam);
        handleSearch(skuParam);
      }
    }
  }, [handleSearch]);

  const fetchAdditionalData = async (sku: string, inventoryItemId: string) => {
    setInventoryLoading(true);
    setOrdersLoading(true);

    try {
      await Promise.all([
        fetchInventoryLevels(sku, inventoryItemId),
        fetchOrders(sku, inventoryItemId)
      ]);
    } catch (err) {
      logger.error('Failed to fetch additional data', err);
    } finally {
      setInventoryLoading(false);
      setOrdersLoading(false);
    }
  };

  const fetchInventoryLevels = async (sku: string, inventoryItemId: string) => {
    logger.info('Inventory REST API call placeholder', { sku, inventoryItemId });
    setInventoryLevels([]);
  };

  const fetchOrders = async (sku: string, inventoryItemId: string) => {
    logger.info('Orders REST API call placeholder', { sku, inventoryItemId });
    setOpenOrders([]);
    setShippedOrders([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <button
          onClick={() => window.location.hash = 'quote-builder'}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[#666] dark:text-slate-400 hover:text-[#428bca] dark:hover:text-blue-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Quote
        </button>

        <div className="bg-white dark:bg-slate-800 rounded border border-[#d4d4d4] dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#428bca] rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#333] dark:text-white">Item Inquiry</h1>
              <p className="text-sm text-[#666] dark:text-slate-400">Search by internal part number or cross reference</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#999]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter part number or cross reference..."
                className="w-full pl-10 pr-4 py-3 border border-[#d4d4d4] dark:border-slate-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#428bca] dark:bg-slate-700 dark:text-white"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className={`px-6 py-3 rounded text-sm font-medium transition-colors ${
                searching
                  ? 'bg-[#e8e8e8] text-[#999] cursor-not-allowed'
                  : 'bg-[#428bca] hover:bg-[#3276b1] text-white'
              }`}
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-[#f2dede] border border-[#ebccd1] rounded flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#a94442] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#a94442]">{error}</p>
            </div>
          )}
        </div>

        {product && (
          <>
            {crossReference && (
              <div className="bg-[#d9edf7] dark:bg-blue-900/20 border border-[#bce8f1] dark:border-blue-800 rounded p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#31708f] dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#31708f] dark:text-blue-300">
                    <p className="font-medium">Cross Reference Match</p>
                    <p className="mt-1">
                      Searched: <span className="font-mono">{searchTerm}</span>
                      {crossReference.customer_part_number === searchTerm && (
                        <> (Customer Part Number)</>
                      )}
                      {crossReference.supplier_part_number === searchTerm && (
                        <> (Supplier Part Number)</>
                      )}
                    </p>
                    <p>Internal Part Number: <span className="font-mono font-medium">{product.sku}</span></p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded border border-[#d4d4d4] dark:border-slate-700">
              <div className="px-6 py-4 border-b border-[#d4d4d4] dark:border-slate-700 bg-[#f0f0f0] dark:bg-slate-800">
                <h2 className="text-lg font-semibold text-[#333] dark:text-white">Product Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1">Internal Part Number</label>
                    <p className="text-sm font-mono font-medium text-[#333] dark:text-white">{product.sku}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1">Product Name</label>
                    <p className="text-sm text-[#333] dark:text-white">{product.name}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1">Status</label>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      product.status === 'active'
                        ? 'bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6]'
                        : 'bg-[#f2dede] text-[#a94442] border border-[#ebccd1]'
                    }`}>
                      {product.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1">Description</label>
                    <p className="text-sm text-[#333] dark:text-white">{product.description || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1">Supplier</label>
                    <p className="text-sm text-[#333] dark:text-white">{product.supplier}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1">Supplier Email</label>
                    <p className="text-sm text-[#333] dark:text-white">{product.supplier_email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1">Category</label>
                    <p className="text-sm text-[#333] dark:text-white">{product.category || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1">Category Set</label>
                    <p className="text-sm text-[#333] dark:text-white">{product.category_set || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1">Item Type</label>
                    <p className="text-sm text-[#333] dark:text-white">{product.item_type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1">UOM</label>
                    <p className="text-sm text-[#333] dark:text-white">{product.unit_of_measure || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1">List Price</label>
                    <p className="text-sm font-medium text-[#333] dark:text-white">
                      ${product.list_price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1">Unit Cost</label>
                    <p className="text-sm font-medium text-[#333] dark:text-white">
                      ${product.unit_cost.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1">Primary Warehouse</label>
                    <p className="text-sm text-[#333] dark:text-white">{product.warehouse || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1">Lead Time</label>
                    <p className="text-sm text-[#333] dark:text-white">
                      {product.lead_time_text || `${product.lead_time_days} days`}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1">Inventory Item ID</label>
                    <p className="text-sm font-mono text-[#333] dark:text-white">{product.inventory_item_id || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded border border-[#d4d4d4] dark:border-slate-700">
              <div className="px-6 py-4 border-b border-[#d4d4d4] dark:border-slate-700 bg-[#f0f0f0] dark:bg-slate-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#333] dark:text-white flex items-center gap-2">
                  <Warehouse className="w-5 h-5" />
                  Inventory Levels
                </h2>
                {inventoryLoading && (
                  <span className="text-xs text-[#666] dark:text-slate-400">Loading...</span>
                )}
              </div>
              <div className="p-6">
                {inventoryLevels.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f0f0f0] dark:bg-slate-700 rounded-full mb-4">
                      <Warehouse className="w-8 h-8 text-[#999]" />
                    </div>
                    <p className="text-sm text-[#666] dark:text-slate-400 mb-2">REST API Integration Required</p>
                    <p className="text-xs text-[#999] dark:text-slate-500">
                      Warehouse inventory levels will be displayed here once the ERP API is configured
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#d4d4d4] dark:border-slate-700">
                          <th className="text-left py-3 px-4 font-medium text-[#666] dark:text-slate-400">Warehouse</th>
                          <th className="text-right py-3 px-4 font-medium text-[#666] dark:text-slate-400">On Hand</th>
                          <th className="text-right py-3 px-4 font-medium text-[#666] dark:text-slate-400">Available</th>
                          <th className="text-right py-3 px-4 font-medium text-[#666] dark:text-slate-400">Min</th>
                          <th className="text-right py-3 px-4 font-medium text-[#666] dark:text-slate-400">Max</th>
                          <th className="text-center py-3 px-4 font-medium text-[#666] dark:text-slate-400">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryLevels.map((level, idx) => (
                          <tr key={idx} className="border-b border-[#eee] dark:border-slate-700/50">
                            <td className="py-3 px-4 font-medium text-[#333] dark:text-white">{level.warehouse}</td>
                            <td className="py-3 px-4 text-right text-[#333] dark:text-white">{level.onHand.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-[#333] dark:text-white">{level.available.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-[#666] dark:text-slate-400">{level.min.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-[#666] dark:text-slate-400">{level.max.toLocaleString()}</td>
                            <td className="py-3 px-4 text-center">
                              {level.onHand < level.min ? (
                                <span className="inline-flex items-center gap-1 text-[#a94442]">
                                  <TrendingDown className="w-4 h-4" />
                                  <span className="text-xs">Below Min</span>
                                </span>
                              ) : level.onHand > level.max ? (
                                <span className="inline-flex items-center gap-1 text-[#8a6d3b]">
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="text-xs">Above Max</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[#3c763d]">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-xs">Normal</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded border border-[#d4d4d4] dark:border-slate-700">
                <div className="px-6 py-4 border-b border-[#d4d4d4] dark:border-slate-700 bg-[#f0f0f0] dark:bg-slate-800 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[#333] dark:text-white flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Open Orders
                  </h2>
                  {ordersLoading && (
                    <span className="text-xs text-[#666] dark:text-slate-400">Loading...</span>
                  )}
                </div>
                <div className="p-6">
                  {openOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f0f0f0] dark:bg-slate-700 rounded-full mb-4">
                        <Truck className="w-8 h-8 text-[#999]" />
                      </div>
                      <p className="text-sm text-[#666] dark:text-slate-400 mb-2">REST API Integration Required</p>
                      <p className="text-xs text-[#999] dark:text-slate-500">
                        Open orders will be displayed here once the ERP API is configured
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {openOrders.map((order, idx) => (
                        <div key={idx} className="p-4 bg-[#f9f9f9] dark:bg-slate-700/50 rounded border border-[#e8e8e8] dark:border-slate-600">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium text-[#333] dark:text-white">{order.orderNumber}</p>
                              <p className="text-xs text-[#666] dark:text-slate-400">{order.customer}</p>
                            </div>
                            <span className="px-2 py-1 bg-[#d9edf7] text-[#31708f] rounded text-xs font-medium">
                              {order.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[#666] dark:text-slate-400">Qty:</span>
                              <span className="ml-1 text-[#333] dark:text-white font-medium">{order.quantity}</span>
                            </div>
                            <div>
                              <span className="text-[#666] dark:text-slate-400">Value:</span>
                              <span className="ml-1 text-[#333] dark:text-white font-medium">${order.totalValue.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[#666] dark:text-slate-400">Order Date:</span>
                              <span className="ml-1 text-[#333] dark:text-white">{order.orderDate}</span>
                            </div>
                            <div>
                              <span className="text-[#666] dark:text-slate-400">Promised:</span>
                              <span className="ml-1 text-[#333] dark:text-white">{order.promisedDate}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded border border-[#d4d4d4] dark:border-slate-700">
                <div className="px-6 py-4 border-b border-[#d4d4d4] dark:border-slate-700 bg-[#f0f0f0] dark:bg-slate-800 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[#333] dark:text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Shipped Orders
                  </h2>
                </div>
                <div className="p-6">
                  {shippedOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f0f0f0] dark:bg-slate-700 rounded-full mb-4">
                        <CheckCircle className="w-8 h-8 text-[#999]" />
                      </div>
                      <p className="text-sm text-[#666] dark:text-slate-400 mb-2">REST API Integration Required</p>
                      <p className="text-xs text-[#999] dark:text-slate-500">
                        Shipped orders will be displayed here once the ERP API is configured
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {shippedOrders.map((order, idx) => (
                        <div key={idx} className="p-4 bg-[#f9f9f9] dark:bg-slate-700/50 rounded border border-[#e8e8e8] dark:border-slate-600">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium text-[#333] dark:text-white">{order.orderNumber}</p>
                              <p className="text-xs text-[#666] dark:text-slate-400">{order.customer}</p>
                            </div>
                            <span className="px-2 py-1 bg-[#dff0d8] text-[#3c763d] rounded text-xs font-medium">
                              Shipped
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[#666] dark:text-slate-400">Qty:</span>
                              <span className="ml-1 text-[#333] dark:text-white font-medium">{order.quantity}</span>
                            </div>
                            <div>
                              <span className="text-[#666] dark:text-slate-400">Value:</span>
                              <span className="ml-1 text-[#333] dark:text-white font-medium">${order.totalValue.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[#666] dark:text-slate-400">Order Date:</span>
                              <span className="ml-1 text-[#333] dark:text-white">{order.orderDate}</span>
                            </div>
                            <div>
                              <span className="text-[#666] dark:text-slate-400">Ship Date:</span>
                              <span className="ml-1 text-[#333] dark:text-white">{order.shipDate}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
