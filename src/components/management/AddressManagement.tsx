import React, { useState } from 'react';
import { X, Plus, Pencil, Trash2, MapPin, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AddressManagementProps {
  customer: any;
  isOpen: boolean;
  onClose: () => void;
}

interface Address {
  id?: string;
  customer_number: string;
  site_use_id: string;
  address_line_1: string;
  address_line_2: string;
  address_line_3: string;
  city: string;
  postal_code: string;
  state: string;
  country: string;
  is_shipping: boolean;
  is_billing: boolean;
  is_primary: boolean;
  is_credit_hold: boolean;
}

export const AddressManagement: React.FC<AddressManagementProps> = ({
  customer,
  isOpen,
  onClose
}) => {
  const [addresses, setAddresses] = useState<Address[]>(customer.addresses || []);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emptyAddress: Address = {
    customer_number: customer.customer_number,
    site_use_id: '',
    address_line_1: '',
    address_line_2: '',
    address_line_3: '',
    city: '',
    postal_code: '',
    state: '',
    country: 'USA',
    is_shipping: false,
    is_billing: false,
    is_primary: false,
    is_credit_hold: false
  };

  const handleCreateNew = () => {
    setEditingAddress({ ...emptyAddress });
    setIsCreating(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress({ ...address });
    setIsCreating(false);
  };

  const handleSaveAddress = async () => {
    if (!editingAddress) return;

    setError(null);
    setSaving(true);

    try {
      if (isCreating) {
        const { error: insertError } = await supabase
          .from('customer_addresses')
          .insert([editingAddress]);

        if (insertError) throw insertError;
      } else {
        const { error: updateError } = await supabase
          .from('customer_addresses')
          .update(editingAddress)
          .eq('id', editingAddress.id);

        if (updateError) throw updateError;
      }

      const { data: updatedAddresses, error: fetchError } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_number', customer.customer_number);

      if (fetchError) throw fetchError;

      setAddresses(updatedAddresses || []);
      setEditingAddress(null);
      setIsCreating(false);
    } catch (err) {
      console.error('Error saving address:', err);
      setError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    setError(null);
    setSaving(true);

    try {
      const { error: deleteError } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', addressId);

      if (deleteError) throw deleteError;

      setAddresses(addresses.filter(addr => addr.id !== addressId));
    } catch (err) {
      console.error('Error deleting address:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete address');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Manage Addresses
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {customer.name} (#{customer.customer_number})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {editingAddress ? (
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {isCreating ? 'Add New Address' : 'Edit Address'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Site Use ID
                  </label>
                  <input
                    type="text"
                    value={editingAddress.site_use_id}
                    onChange={(e) => setEditingAddress({ ...editingAddress, site_use_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAddress.address_line_1}
                    onChange={(e) => setEditingAddress({ ...editingAddress, address_line_1: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={editingAddress.address_line_2}
                    onChange={(e) => setEditingAddress({ ...editingAddress, address_line_2: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address Line 3
                  </label>
                  <input
                    type="text"
                    value={editingAddress.address_line_3}
                    onChange={(e) => setEditingAddress({ ...editingAddress, address_line_3: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAddress.city}
                    onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={editingAddress.state}
                    onChange={(e) => setEditingAddress({ ...editingAddress, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAddress.postal_code}
                    onChange={(e) => setEditingAddress({ ...editingAddress, postal_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAddress.country}
                    onChange={(e) => setEditingAddress({ ...editingAddress, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAddress.is_shipping}
                    onChange={(e) => setEditingAddress({ ...editingAddress, is_shipping: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Shipping</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAddress.is_billing}
                    onChange={(e) => setEditingAddress({ ...editingAddress, is_billing: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Billing</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAddress.is_primary}
                    onChange={(e) => setEditingAddress({ ...editingAddress, is_primary: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Primary</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAddress.is_credit_hold}
                    onChange={(e) => setEditingAddress({ ...editingAddress, is_credit_hold: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Credit Hold</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setEditingAddress(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAddress}
                  disabled={saving || !editingAddress.address_line_1 || !editingAddress.city || !editingAddress.postal_code || !editingAddress.country}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : 'Save Address'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <button
                onClick={handleCreateNew}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Address</span>
              </button>
            </div>
          )}

          <div className="space-y-4">
            {addresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No addresses found</p>
              </div>
            ) : (
              addresses.map((address) => (
                <div
                  key={address.id}
                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {address.site_use_id && (
                          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            Site: {address.site_use_id}
                          </span>
                        )}
                        {address.is_primary && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                        {address.is_shipping && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Shipping
                          </span>
                        )}
                        {address.is_billing && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            Billing
                          </span>
                        )}
                        {address.is_credit_hold && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Credit Hold
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-900 dark:text-white">
                        <div>{address.address_line_1}</div>
                        {address.address_line_2 && <div>{address.address_line_2}</div>}
                        {address.address_line_3 && <div>{address.address_line_3}</div>}
                        <div>
                          {address.city}, {address.state} {address.postal_code}
                        </div>
                        <div>{address.country}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(address)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Edit Address"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => address.id && handleDeleteAddress(address.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete Address"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
