import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';

type CrossReference = Database['public']['Tables']['cross_references']['Row'];
type CrossReferenceInsert = Database['public']['Tables']['cross_references']['Insert'];

interface CrossReferenceEditModalProps {
  reference: CrossReference | null;
  onClose: () => void;
  onSave: () => void;
}

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
}

export default function CrossReferenceEditModal({ reference, onClose, onSave }: CrossReferenceEditModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState<Partial<CrossReferenceInsert>>({
    customer_id: reference?.customer_id || null,
    product_id: reference?.product_id || null,
    customer_part_number: reference?.customer_part_number || '',
    supplier_part_number: reference?.supplier_part_number || '',
    internal_part_number: reference?.internal_part_number || '',
    description: reference?.description || '',
    supplier: reference?.supplier || '',
    type: reference?.type || '',
    usage_frequency: reference?.usage_frequency || 0,
    last_used_at: reference?.last_used_at || null
  });

  useEffect(() => {
    loadDropdownData();
  }, []);

  const loadDropdownData = async () => {
    try {
      const [{ data: customersData }, { data: productsData }] = await Promise.all([
        supabase.from('customers').select('id, name').order('name'),
        supabase.from('products').select('id, sku, name').order('sku')
      ]);

      setCustomers(customersData || []);
      setProducts(productsData || []);
    } catch (err) {
      console.error('Error loading dropdown data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (reference) {
        const { error: updateError } = await supabase
          .from('cross_references')
          .update(formData)
          .eq('id', reference.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cross_references')
          .insert([formData]);

        if (insertError) throw insertError;
      }

      onSave();
    } catch (err) {
      console.error('Error saving cross reference:', err);
      setError(err instanceof Error ? err.message : 'Failed to save cross reference');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof CrossReferenceInsert, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {reference ? 'Edit Cross Reference' : 'Add New Cross Reference'}
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <select
                  value={formData.customer_id || ''}
                  onChange={(e) => updateField('customer_id', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <select
                  value={formData.product_id || ''}
                  onChange={(e) => updateField('product_id', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.sku} - {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Part Number
                </label>
                <input
                  type="text"
                  value={formData.customer_part_number}
                  onChange={(e) => updateField('customer_part_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Customer's part number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Part Number (Product SKU) <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.internal_part_number}
                  onChange={(e) => updateField('internal_part_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Product SKU</option>
                  {products.map(product => (
                    <option key={product.id} value={product.sku}>
                      {product.sku} - {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Part Number
                </label>
                <input
                  type="text"
                  value={formData.supplier_part_number || ''}
                  onChange={(e) => updateField('supplier_part_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Supplier's part number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  value={formData.supplier || ''}
                  onChange={(e) => updateField('supplier', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Supplier name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type || ''}
                  onChange={(e) => updateField('type', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Type</option>
                  <option value="OE">OE</option>
                  <option value="Competitor">Competitor</option>
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Customer">Customer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usage Frequency
                </label>
                <input
                  type="number"
                  value={formData.usage_frequency || 0}
                  onChange={(e) => updateField('usage_frequency', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes or description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Used Date
                </label>
                <input
                  type="date"
                  value={formData.last_used_at ? new Date(formData.last_used_at).toISOString().split('T')[0] : ''}
                  onChange={(e) => updateField('last_used_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Cross Reference Tips:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Internal Part Number must be a valid Product SKU from your catalog</li>
                    <li>Customer and Product associations are optional but recommended</li>
                    <li>Type helps categorize the relationship between parts</li>
                    <li>Usage frequency tracks how often this reference is used</li>
                  </ul>
                </div>
              </div>
            </div>
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
              {saving ? 'Saving...' : 'Save Cross Reference'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
