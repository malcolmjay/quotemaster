import React, { useState, useEffect } from 'react';
import { X, Save, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CustomerEditModalProps {
  customer: any;
  isOpen: boolean;
  onClose: () => void;
  isCreating: boolean;
}

export const CustomerEditModal: React.FC<CustomerEditModalProps> = ({
  customer,
  isOpen,
  onClose,
  isCreating
}) => {
  const [formData, setFormData] = useState({
    name: '',
    customer_number: '',
    type: 'commercial' as 'federal' | 'state' | 'local' | 'commercial',
    segment: 'commercial' as 'government' | 'defense' | 'education' | 'healthcare' | 'commercial',
    contract_number: '',
    payment_terms: 'NET 30',
    currency: 'USD',
    tier: 'bronze' as 'bronze' | 'silver' | 'gold' | 'platinum',
    sales_manager: '',
    sales_rep: '',
    primary_warehouse: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warehouseOptions, setWarehouseOptions] = useState<string[]>([]);

  useEffect(() => {
    if (customer && !isCreating) {
      setFormData({
        name: customer.name || '',
        customer_number: customer.customer_number || '',
        type: customer.type || 'commercial',
        segment: customer.segment || 'commercial',
        contract_number: customer.contract_number || '',
        payment_terms: customer.payment_terms || 'NET 30',
        currency: customer.currency || 'USD',
        tier: customer.tier || 'bronze',
        sales_manager: customer.sales_manager || '',
        sales_rep: customer.sales_rep || '',
        primary_warehouse: customer.primary_warehouse || ''
      });
    }
  }, [customer, isCreating]);

  useEffect(() => {
    const loadWarehouseOptions = async () => {
      try {
        const { data, error } = await supabase
          .from('app_configurations')
          .select('config_value')
          .eq('config_key', 'warehouse_options')
          .maybeSingle();
        if (error) throw error;
        if (data?.config_value) {
          const options = JSON.parse(data.config_value);
          setWarehouseOptions(options);
        }
      } catch (error) {
        console.error('Error loading warehouse options:', error);
      }
    };
    loadWarehouseOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const dataToSave = {
        name: formData.name,
        customer_number: formData.customer_number,
        type: formData.type,
        segment: formData.segment,
        contract_number: formData.contract_number || null,
        payment_terms: formData.payment_terms,
        currency: formData.currency,
        tier: formData.tier,
        sales_manager: formData.sales_manager || null,
        sales_rep: formData.sales_rep || null,
        primary_warehouse: formData.primary_warehouse || null
      };

      if (isCreating) {
        const { error: insertError } = await supabase
          .from('customers')
          .insert([dataToSave]);

        if (insertError) throw insertError;
      } else {
        const { error: updateError } = await supabase
          .from('customers')
          .update(dataToSave)
          .eq('id', customer.id);

        if (updateError) throw updateError;
      }

      onClose();
    } catch (err) {
      console.error('Error saving customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isCreating ? 'Create New Customer' : 'Edit Customer'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.customer_number}
                onChange={(e) => setFormData({ ...formData, customer_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contract Number
              </label>
              <input
                type="text"
                value={formData.contract_number}
                onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="federal">Federal</option>
                <option value="state">State</option>
                <option value="local">Local</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Segment <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.segment}
                onChange={(e) => setFormData({ ...formData, segment: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="government">Government</option>
                <option value="defense">Defense</option>
                <option value="education">Education</option>
                <option value="healthcare">Healthcare</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tier
              </label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Terms
              </label>
              <input
                type="text"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sales Manager
              </label>
              <input
                type="text"
                value={formData.sales_manager}
                onChange={(e) => setFormData({ ...formData, sales_manager: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sales Rep
              </label>
              <input
                type="text"
                value={formData.sales_rep}
                onChange={(e) => setFormData({ ...formData, sales_rep: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Warehouse
              </label>
              <select
                value={formData.primary_warehouse}
                onChange={(e) => setFormData({ ...formData, primary_warehouse: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select warehouse...</option>
                {warehouseOptions.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>
                    {warehouse}
                  </option>
                ))}
              </select>
            </div>
          </div>


          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : isCreating ? 'Create Customer' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
