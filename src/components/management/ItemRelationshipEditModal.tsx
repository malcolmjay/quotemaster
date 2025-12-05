import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';

type ItemRelationship = Database['public']['Tables']['item_relationships']['Row'];
type ItemRelationshipInsert = Database['public']['Tables']['item_relationships']['Insert'];

interface ItemRelationshipEditModalProps {
  relationship: ItemRelationship | null;
  onClose: () => void;
  onSave: () => void;
}

interface Product {
  id: string;
  sku: string;
  name: string;
}

const RELATIONSHIP_TYPES = [
  'Up-Sell',
  'Substitute',
  'Superseded',
  'Related',
  'Complementary',
  'Mandatory Charge'
];

export default function ItemRelationshipEditModal({ relationship, onClose, onSave }: ItemRelationshipEditModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState<Partial<ItemRelationshipInsert>>({
    from_item_id: relationship?.from_item_id || '',
    to_item_id: relationship?.to_item_id || '',
    type: relationship?.type || '',
    reciprocal: relationship?.reciprocal ?? false,
    effective_from: relationship?.effective_from || null,
    effective_to: relationship?.effective_to || null
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error: productsError } = await supabase
        .from('products')
        .select('id, sku, name')
        .order('sku');

      if (productsError) throw productsError;
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (formData.from_item_id === formData.to_item_id) {
        throw new Error('From Item and To Item cannot be the same product');
      }

      if (relationship) {
        const { error: updateError } = await supabase
          .from('item_relationships')
          .update(formData)
          .eq('id', relationship.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('item_relationships')
          .insert([formData]);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item relationship');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ItemRelationshipInsert, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
          <div className="p-6 flex items-center justify-center">
            <div className="text-gray-600">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {relationship ? 'Edit Item Relationship' : 'New Item Relationship'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Item <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.from_item_id}
                  onChange={(e) => updateField('from_item_id', e.target.value)}
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
                  To Item <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.to_item_id}
                  onChange={(e) => updateField('to_item_id', e.target.value)}
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
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => updateField('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Type</option>
                  {RELATIONSHIP_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reciprocal
                </label>
                <select
                  value={formData.reciprocal ? 'true' : 'false'}
                  onChange={(e) => updateField('reciprocal', e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective From
                </label>
                <input
                  type="date"
                  value={formData.effective_from || ''}
                  onChange={(e) => updateField('effective_from', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective To
                </label>
                <input
                  type="date"
                  value={formData.effective_to || ''}
                  onChange={(e) => updateField('effective_to', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Item Relationship Tips:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>From Item and To Item must be different products</li>
                    <li>Reciprocal relationships apply in both directions</li>
                    <li>Use effective dates to control when relationships are active</li>
                    <li>Up-Sell: Suggests a higher-value alternative</li>
                    <li>Substitute: Indicates a replacement option</li>
                    <li>Superseded: The from item has been replaced by the to item</li>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
