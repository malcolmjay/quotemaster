import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];

interface ProductEditModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
}

export default function ProductEditModal({ product, onClose, onSave }: ProductEditModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'dimensions' | 'logistics' | 'pricing'>('basic');
  const [priceBreaks, setPriceBreaks] = useState<any[]>([]);
  const [loadingPriceBreaks, setLoadingPriceBreaks] = useState(false);

  const [formData, setFormData] = useState<Partial<ProductInsert>>({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    long_description: product?.long_description || '',
    category: product?.category || '',
    category_set: product?.category_set || '',
    supplier: product?.supplier || '',
    supplier_email: product?.supplier_email || '',
    unit_cost: product?.unit_cost || 0,
    list_price: product?.list_price || 0,
    lead_time_days: product?.lead_time_days || 0,
    lead_time_text: product?.lead_time_text || '',
    average_lead_time: product?.average_lead_time || null,
    warehouse: product?.warehouse || 'main',
    status: product?.status || 'active',
    item_type: product?.item_type || '',
    assignment: product?.assignment || '',
    unit_of_measure: product?.unit_of_measure || 'EA',
    moq: product?.moq || 1,
    min_quantity: product?.min_quantity || 0,
    max_quantity: product?.max_quantity || null,
    weight: product?.weight || null,
    length: product?.length || null,
    width: product?.width || null,
    height: product?.height || null,
    fleet: product?.fleet || '',
    country_of_origin: product?.country_of_origin || '',
    tariff_amount: product?.tariff_amount || null,
    cs_notes: product?.cs_notes || '',
    rep_code: product?.rep_code || '',
    rep_by: product?.rep_by || '',
    revision: product?.revision || '',
    buyer: product?.buyer || '',
    cost_effective_from: product?.cost_effective_from || null,
    cost_effective_to: product?.cost_effective_to || null
  });

  useEffect(() => {
    if (product?.id) {
      loadPriceBreaks();
    }
  }, [product?.id]);

  const isCostExpired = useMemo(() => {
    if (!formData.cost_effective_to) return false;
    const endDate = new Date(formData.cost_effective_to);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
  }, [formData.cost_effective_to]);

  const loadPriceBreaks = async () => {
    if (!product?.id) return;

    setLoadingPriceBreaks(true);
    try {
      const { data, error } = await supabase
        .from('price_breaks')
        .select('*')
        .eq('product_id', product.id)
        .order('min_quantity');

      if (error) throw error;
      setPriceBreaks(data || []);
    } catch (err) {
      console.error('Error loading price breaks:', err);
    } finally {
      setLoadingPriceBreaks(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      let productId = product?.id;

      if (product) {
        const { error: updateError } = await supabase
          .from('products')
          .update(formData)
          .eq('id', product.id);

        if (updateError) throw updateError;
      } else {
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert([formData])
          .select()
          .single();

        if (insertError) throw insertError;
        productId = newProduct?.id;
      }

      if (productId) {
        await savePriceBreaks(productId);
      }

      onSave();
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const savePriceBreaks = async (productId: string) => {
    const existingIds = priceBreaks.filter(pb => pb.id).map(pb => pb.id);

    const { error: deleteError } = await supabase
      .from('price_breaks')
      .delete()
      .eq('product_id', productId)
      .not('id', 'in', `(${existingIds.join(',') || 'null'})`);

    if (deleteError) throw deleteError;

    for (const priceBreak of priceBreaks) {
      const priceBreakData = {
        product_id: productId,
        min_quantity: priceBreak.min_quantity,
        max_quantity: priceBreak.max_quantity,
        unit_cost: priceBreak.unit_cost,
        description: priceBreak.description || null,
        discount_percent: priceBreak.discount_percent || null,
        effective_date: priceBreak.effective_date || null
      };

      if (priceBreak.id) {
        const { error: updateError } = await supabase
          .from('price_breaks')
          .update(priceBreakData)
          .eq('id', priceBreak.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('price_breaks')
          .insert([priceBreakData]);

        if (insertError) throw insertError;
      }
    }
  };

  const updateField = (field: keyof ProductInsert, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addPriceBreak = () => {
    setPriceBreaks(prev => [...prev, {
      min_quantity: prev.length > 0 ? prev[prev.length - 1].max_quantity + 1 : 1,
      max_quantity: 999,
      unit_cost: 0,
      description: '',
      discount_percent: null,
      effective_date: null
    }]);
  };

  const removePriceBreak = (index: number) => {
    setPriceBreaks(prev => prev.filter((_, i) => i !== index));
  };

  const updatePriceBreak = (index: number, field: string, value: any) => {
    setPriceBreaks(prev => prev.map((pb, i) =>
      i === index ? { ...pb, [field]: value } : pb
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {isCostExpired && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 mb-1">Product Cost Has Expired</h3>
              <p className="text-sm text-red-700">
                The cost effective end date for this product has passed. Please update the cost and effective dates to reflect current pricing.
              </p>
            </div>
          </div>
        )}

        <div className="border-b">
          <div className="flex gap-4 px-6">
            {[
              { id: 'basic', label: 'Basic Info' },
              { id: 'details', label: 'Details' },
              { id: 'dimensions', label: 'Dimensions' },
              { id: 'logistics', label: 'Logistics' },
              { id: 'pricing', label: 'Price Breaks' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {activeTab === 'basic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => updateField('sku', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Long Description</label>
                  <textarea
                    value={formData.long_description || ''}
                    onChange={(e) => updateField('long_description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Set</label>
                  <input
                    type="text"
                    value={formData.category_set || ''}
                    onChange={(e) => updateField('category_set', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.supplier}
                    onChange={(e) => updateField('supplier', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Email
                  </label>
                  <input
                    type="email"
                    value={formData.supplier_email || ''}
                    onChange={(e) => updateField('supplier_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="supplier@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => updateField('unit_cost', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">List Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.list_price}
                    onChange={(e) => updateField('list_price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isCostExpired ? 'text-red-600' : 'text-gray-700'
                  }`}>
                    Cost Effective From
                    {isCostExpired && <span className="ml-2 text-xs">(EXPIRED)</span>}
                  </label>
                  <input
                    type="date"
                    value={formData.cost_effective_from || ''}
                    onChange={(e) => updateField('cost_effective_from', e.target.value || null)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${
                      isCostExpired
                        ? 'border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isCostExpired ? 'text-red-600' : 'text-gray-700'
                  }`}>
                    Cost Effective To
                    {isCostExpired && <span className="ml-2 text-xs">(EXPIRED)</span>}
                  </label>
                  <input
                    type="date"
                    value={formData.cost_effective_to || ''}
                    onChange={(e) => updateField('cost_effective_to', e.target.value || null)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${
                      isCostExpired
                        ? 'border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {isCostExpired && (
                    <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>This cost effective date has expired</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                  <input
                    type="text"
                    value={formData.item_type || ''}
                    onChange={(e) => updateField('item_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignment</label>
                  <input
                    type="text"
                    value={formData.assignment || ''}
                    onChange={(e) => updateField('assignment', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={formData.unit_of_measure || 'EA'}
                    onChange={(e) => updateField('unit_of_measure', e.target.value)}
                    placeholder="EA, BOX, LB, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MOQ</label>
                  <input
                    type="number"
                    value={formData.moq || 1}
                    onChange={(e) => updateField('moq', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity</label>
                  <input
                    type="number"
                    value={formData.min_quantity || 0}
                    onChange={(e) => updateField('min_quantity', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Quantity</label>
                  <input
                    type="number"
                    value={formData.max_quantity || ''}
                    onChange={(e) => updateField('max_quantity', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    value={formData.lead_time_days}
                    onChange={(e) => updateField('lead_time_days', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Average Lead Time (Days)</label>
                  <input
                    type="number"
                    value={formData.average_lead_time || ''}
                    onChange={(e) => updateField('average_lead_time', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time Text</label>
                  <input
                    type="text"
                    value={formData.lead_time_text || ''}
                    onChange={(e) => updateField('lead_time_text', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buyer</label>
                  <input
                    type="text"
                    value={formData.buyer || ''}
                    onChange={(e) => updateField('buyer', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Revision</label>
                  <input
                    type="text"
                    value={formData.revision || ''}
                    onChange={(e) => updateField('revision', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Service Notes</label>
                  <textarea
                    value={formData.cs_notes || ''}
                    onChange={(e) => updateField('cs_notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {activeTab === 'dimensions' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.weight || ''}
                    onChange={(e) => updateField('weight', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.length || ''}
                    onChange={(e) => updateField('length', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.width || ''}
                    onChange={(e) => updateField('width', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.height || ''}
                    onChange={(e) => updateField('height', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {activeTab === 'logistics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                  <input
                    type="text"
                    value={formData.warehouse}
                    onChange={(e) => updateField('warehouse', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fleet</label>
                  <input
                    type="text"
                    value={formData.fleet || ''}
                    onChange={(e) => updateField('fleet', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
                  <input
                    type="text"
                    value={formData.country_of_origin || ''}
                    onChange={(e) => updateField('country_of_origin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tariff Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tariff_amount || ''}
                    onChange={(e) => updateField('tariff_amount', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rep Code</label>
                  <input
                    type="text"
                    value={formData.rep_code || ''}
                    onChange={(e) => updateField('rep_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rep By</label>
                  <input
                    type="text"
                    value={formData.rep_by || ''}
                    onChange={(e) => updateField('rep_by', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Effective From</label>
                  <input
                    type="date"
                    value={formData.cost_effective_from || ''}
                    onChange={(e) => updateField('cost_effective_from', e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Effective To</label>
                  <input
                    type="date"
                    value={formData.cost_effective_to || ''}
                    onChange={(e) => updateField('cost_effective_to', e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Price Breaks</h3>
                    <p className="text-xs text-gray-500 mt-1">Configure quantity-based pricing tiers</p>
                  </div>
                  <button
                    type="button"
                    onClick={addPriceBreak}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Price Break
                  </button>
                </div>

                {loadingPriceBreaks ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : priceBreaks.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 text-sm">No price breaks configured</p>
                    <p className="text-gray-400 text-xs mt-1">Click "Add Price Break" to create your first tier</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {priceBreaks.map((priceBreak, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-medium text-gray-700">Tier {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removePriceBreak(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Min Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={priceBreak.min_quantity}
                              onChange={(e) => updatePriceBreak(index, 'min_quantity', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Max Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={priceBreak.max_quantity}
                              onChange={(e) => updatePriceBreak(index, 'max_quantity', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Unit Cost <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              required
                              step="0.01"
                              min="0"
                              value={priceBreak.unit_cost}
                              onChange={(e) => updatePriceBreak(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Discount %
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={priceBreak.discount_percent || ''}
                              onChange={(e) => updatePriceBreak(index, 'discount_percent', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Effective Date
                            </label>
                            <input
                              type="date"
                              value={priceBreak.effective_date || ''}
                              onChange={(e) => updatePriceBreak(index, 'effective_date', e.target.value || null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={priceBreak.description || ''}
                              onChange={(e) => updatePriceBreak(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="e.g., Standard pricing, Volume discount"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!product && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800">
                        Price breaks will be saved after the product is created.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t p-6 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
