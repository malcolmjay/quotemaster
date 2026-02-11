import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Package, Loader2, ArrowRightLeft, TrendingUp, RefreshCw, Link2, ShoppingBag, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RelatedItem {
  id: string;
  relationshipId: string;
  type: string;
  direction: 'from' | 'to';
  reciprocal: boolean;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  product: {
    id: string;
    sku: string;
    name: string;
    supplier: string;
    unit_cost: number;
    list_price: number;
    lead_time_days: number;
    lead_time_text: string | null;
    status: string;
    category: string;
    warehouse: string;
    stock: number;
  };
}

interface ItemRelationshipsModalProps {
  item: {
    id: string;
    sku: string;
    name: string;
    qty: number;
    cost: number;
    price: number;
    supplier: string;
    stock: number;
    product_id?: string | null;
  };
  products: any[];
  onClose: () => void;
  onSelectReplacement: (itemId: string, replacement: any) => void;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType; description: string }> = {
  'Superseded': {
    label: 'Superseded By',
    color: 'text-amber-800 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: RefreshCw,
    description: 'This item has been replaced by a newer version.'
  },
  'Substitute': {
    label: 'Substitute',
    color: 'text-sky-800 dark:text-sky-300',
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    border: 'border-sky-200 dark:border-sky-800',
    icon: ArrowRightLeft,
    description: 'Compatible substitute that can be used in place of this item.'
  },
  'Up-Sell': {
    label: 'Upgrade',
    color: 'text-emerald-800 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: TrendingUp,
    description: 'Premium alternative with enhanced features or performance.'
  },
  'Related': {
    label: 'Related',
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-200 dark:border-slate-700',
    icon: Link2,
    description: 'Related item that may be of interest.'
  },
  'Complementary': {
    label: 'Complementary',
    color: 'text-teal-800 dark:text-teal-300',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-800',
    icon: ShoppingBag,
    description: 'Often purchased together with this item.'
  },
  'Mandatory Charge': {
    label: 'Mandatory Charge',
    color: 'text-rose-800 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-800',
    icon: DollarSign,
    description: 'Required charge associated with this item.'
  }
};

export const ItemRelationshipsModal: React.FC<ItemRelationshipsModalProps> = ({
  item,
  products,
  onClose,
  onSelectReplacement
}) => {
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string | null>(null);

  useEffect(() => {
    loadRelationships();
  }, [item.sku]);

  const loadRelationships = async () => {
    try {
      setLoading(true);
      const product = products.find(p => p.sku === item.sku);
      if (!product) {
        setRelatedItems([]);
        return;
      }

      const productId = product.id;

      const { data: fromRelationships, error: fromError } = await supabase
        .from('item_relationships')
        .select('*')
        .eq('from_item_id', productId);

      if (fromError) throw fromError;

      const { data: toRelationships, error: toError } = await supabase
        .from('item_relationships')
        .select('*')
        .eq('to_item_id', productId);

      if (toError) throw toError;

      const items: RelatedItem[] = [];

      for (const rel of (fromRelationships || [])) {
        const relatedProduct = products.find((p: any) => p.id === rel.to_item_id);
        if (relatedProduct) {
          items.push({
            id: relatedProduct.id,
            relationshipId: rel.id,
            type: rel.type,
            direction: 'from',
            reciprocal: rel.reciprocal,
            effectiveFrom: rel.effective_from,
            effectiveTo: rel.effective_to,
            product: {
              id: relatedProduct.id,
              sku: relatedProduct.sku,
              name: relatedProduct.name,
              supplier: relatedProduct.supplier,
              unit_cost: relatedProduct.unit_cost,
              list_price: relatedProduct.list_price,
              lead_time_days: relatedProduct.lead_time_days,
              lead_time_text: relatedProduct.lead_time_text,
              status: relatedProduct.status,
              category: relatedProduct.category,
              warehouse: relatedProduct.warehouse,
              stock: relatedProduct.inventory_levels?.[0]?.quantity_on_hand || 0
            }
          });
        }
      }

      for (const rel of (toRelationships || [])) {
        if (rel.reciprocal) {
          const relatedProduct = products.find((p: any) => p.id === rel.from_item_id);
          if (relatedProduct) {
            items.push({
              id: relatedProduct.id,
              relationshipId: rel.id,
              type: rel.type,
              direction: 'to',
              reciprocal: true,
              effectiveFrom: rel.effective_from,
              effectiveTo: rel.effective_to,
              product: {
                id: relatedProduct.id,
                sku: relatedProduct.sku,
                name: relatedProduct.name,
                supplier: relatedProduct.supplier,
                unit_cost: relatedProduct.unit_cost,
                list_price: relatedProduct.list_price,
                lead_time_days: relatedProduct.lead_time_days,
                lead_time_text: relatedProduct.lead_time_text,
                status: relatedProduct.status,
                category: relatedProduct.category,
                warehouse: relatedProduct.warehouse,
                stock: relatedProduct.inventory_levels?.[0]?.quantity_on_hand || 0
              }
            });
          }
        }
      }

      setRelatedItems(items);

      if (items.length > 0) {
        const types = [...new Set(items.map(i => i.type))];
        const priority = ['Superseded', 'Substitute', 'Up-Sell', 'Related', 'Complementary', 'Mandatory Charge'];
        const firstType = priority.find(t => types.includes(t)) || types[0];
        setActiveType(firstType);
      }
    } catch (error) {
      console.error('Error loading item relationships:', error);
      setRelatedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const groupedItems = relatedItems.reduce<Record<string, RelatedItem[]>>((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  const typeOrder = ['Superseded', 'Substitute', 'Up-Sell', 'Related', 'Complementary', 'Mandatory Charge'];
  const sortedTypes = Object.keys(groupedItems).sort((a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b));

  const activeItems = activeType ? groupedItems[activeType] || [] : [];

  const handleSelect = (related: RelatedItem) => {
    const replacement = {
      sku: related.product.sku,
      name: related.product.name,
      supplier: related.product.supplier,
      cost: related.product.unit_cost,
      price: related.product.list_price,
      stock: related.product.stock,
      leadTime: related.product.lead_time_text || `${related.product.lead_time_days} days`,
      relationshipType: related.type.toLowerCase(),
      reason: `${related.type} for ${item.sku}`
    };
    onSelectReplacement(item.id, replacement);
  };

  const costDiff = (cost: number) => {
    const diff = cost - item.cost;
    if (Math.abs(diff) < 0.01) return null;
    return diff;
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eef0f3] dark:border-slate-700 bg-[#f8f9fb] dark:bg-slate-800/80">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-[#1a1f36] dark:text-white">Related Items</h3>
            <p className="text-xs text-[#5f6672] dark:text-slate-400 mt-0.5 truncate">
              {item.sku} &mdash; {item.name}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#eef0f3] dark:hover:bg-slate-700 rounded-lg transition-colors ml-4">
            <X className="h-4 w-4 text-[#5f6672] dark:text-slate-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#1a6fb5] animate-spin" />
          </div>
        ) : relatedItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-6">
            <Package className="h-10 w-10 text-[#cdd1d9] dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-[#1a1f36] dark:text-white">No related items found</p>
            <p className="text-xs text-[#8c939d] dark:text-slate-400 mt-1">There are no configured relationships for this product.</p>
          </div>
        ) : (
          <>
            {sortedTypes.length > 1 && (
              <div className="px-6 pt-4 pb-0 flex gap-1.5 flex-wrap">
                {sortedTypes.map(type => {
                  const config = TYPE_CONFIG[type] || TYPE_CONFIG['Related'];
                  const count = groupedItems[type].length;
                  const isActive = activeType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setActiveType(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        isActive
                          ? `${config.bg} ${config.color} ${config.border}`
                          : 'bg-white dark:bg-slate-800 text-[#8c939d] dark:text-slate-400 border-[#eef0f3] dark:border-slate-700 hover:border-[#cdd1d9] dark:hover:border-slate-600'
                      }`}
                    >
                      {config.label} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {activeType && TYPE_CONFIG[activeType] && (
                <p className="text-xs text-[#8c939d] dark:text-slate-400 mb-4">
                  {TYPE_CONFIG[activeType].description}
                </p>
              )}

              <div className="space-y-3">
                {activeItems.map((related) => {
                  const diff = costDiff(related.product.unit_cost);
                  const Icon = TYPE_CONFIG[related.type]?.icon || Link2;

                  return (
                    <div
                      key={related.relationshipId + related.id}
                      className="border border-[#eef0f3] dark:border-slate-700 rounded-lg p-4 hover:border-[#cdd1d9] dark:hover:border-slate-600 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${TYPE_CONFIG[related.type]?.color || 'text-[#5f6672]'}`} />
                            <span className="font-semibold text-sm text-[#1a1f36] dark:text-white">{related.product.sku}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${TYPE_CONFIG[related.type]?.bg || 'bg-slate-50'} ${TYPE_CONFIG[related.type]?.color || 'text-slate-700'} ${TYPE_CONFIG[related.type]?.border || 'border-slate-200'}`}>
                              {TYPE_CONFIG[related.type]?.label || related.type}
                            </span>
                            {related.product.stock > 0 ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                                In Stock ({related.product.stock})
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800">
                                Out of Stock
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#5f6672] dark:text-slate-400 mb-3">{related.product.name}</p>

                          <div className="grid grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-[#8c939d] dark:text-slate-500">Cost</span>
                              <div className="font-semibold text-[#1a1f36] dark:text-white mt-0.5">
                                ${related.product.unit_cost.toFixed(2)}
                                {diff !== null && (
                                  <span className={`ml-1 text-[10px] font-medium ${diff < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                    ({diff > 0 ? '+' : ''}{diff.toFixed(2)})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="text-[#8c939d] dark:text-slate-500">List Price</span>
                              <div className="font-semibold text-[#1a1f36] dark:text-white mt-0.5">
                                ${related.product.list_price.toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <span className="text-[#8c939d] dark:text-slate-500">Lead Time</span>
                              <div className="font-semibold text-[#1a1f36] dark:text-white mt-0.5">
                                {related.product.lead_time_text || `${related.product.lead_time_days}d`}
                              </div>
                            </div>
                            <div>
                              <span className="text-[#8c939d] dark:text-slate-500">Supplier</span>
                              <div className="font-semibold text-[#1a6fb5] dark:text-blue-400 mt-0.5 truncate">
                                {related.product.supplier}
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelect(related)}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1a6fb5] dark:text-blue-400 bg-[#e8f0fe] dark:bg-blue-900/20 rounded-md hover:bg-[#d0e2f7] dark:hover:bg-blue-900/40 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Use this item instead"
                        >
                          Switch
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div className="px-6 py-3 border-t border-[#eef0f3] dark:border-slate-700 bg-[#f8f9fb] dark:bg-slate-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#5f6672] dark:text-slate-400 hover:bg-[#eef0f3] dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
