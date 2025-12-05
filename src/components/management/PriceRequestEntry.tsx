import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Save, X, Plus, Trash2, ArrowLeft, Upload, FileText, Download, CheckCircle } from 'lucide-react';

type PriceRequest = Database['public']['Tables']['price_requests']['Row'];
type PriceBreak = {
  quantity: number;
  price: number;
};

interface PriceRequestEntryProps {
  onClose: () => void;
  onSave: () => void;
  existingRequest?: PriceRequest | null;
}

export function PriceRequestEntry({ onClose, onSave, existingRequest }: PriceRequestEntryProps) {
  const [formData, setFormData] = useState<Partial<PriceRequest>>({
    product_number: existingRequest?.product_number || '',
    description: existingRequest?.description || '',
    customer_name: existingRequest?.customer_name || '',
    supplier_name: existingRequest?.supplier_name || '',
    supplier_email: existingRequest?.supplier_email || '',
    supplier_currency: existingRequest?.supplier_currency || 'USD',
    buyer_name: existingRequest?.buyer_name || '',
    item_quantity: existingRequest?.item_quantity || 0,
    supplier_pricing: existingRequest?.supplier_pricing || undefined,
    moq: existingRequest?.moq || undefined,
    effective_start_date: existingRequest?.effective_start_date || '',
    effective_end_date: existingRequest?.effective_end_date || '',
    supplier_quote_number: existingRequest?.supplier_quote_number || '',
    quote_number: existingRequest?.quote_number || '',
    quote_type: existingRequest?.quote_type || 'Manual Entry',
    status: existingRequest?.status || 'pending',
    attachment_url: existingRequest?.attachment_url || null,
    attachment_name: existingRequest?.attachment_name || null,
    attachment_size: existingRequest?.attachment_size || null,
    attachment_type: existingRequest?.attachment_type || null,
  });

  const [priceBreaks, setPriceBreaks] = useState<PriceBreak[]>(
    Array.isArray(existingRequest?.price_breaks)
      ? (existingRequest.price_breaks as PriceBreak[])
      : []
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingFile, setUploadingFile] = useState(false);

  const addPriceBreak = () => {
    setPriceBreaks([...priceBreaks, { quantity: 0, price: 0 }]);
  };

  const updatePriceBreak = (index: number, field: 'quantity' | 'price', value: number) => {
    const updated = [...priceBreaks];
    updated[index][field] = value;
    setPriceBreaks(updated);
  };

  const removePriceBreak = (index: number) => {
    setPriceBreaks(priceBreaks.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploadingFile(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `price-request-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setFormData({
        ...formData,
        attachment_url: publicUrl,
        attachment_name: file.name,
        attachment_size: file.size,
        attachment_type: file.type,
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(`Failed to upload file: ${error.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveAttachment = async () => {
    if (formData.attachment_url) {
      try {
        const pathMatch = formData.attachment_url.match(/price-request-attachments\/[^?]+/);
        if (pathMatch) {
          await supabase.storage.from('documents').remove([pathMatch[0]]);
        }
      } catch (error) {
        console.error('Error removing file:', error);
      }
    }

    setFormData({
      ...formData,
      attachment_url: null,
      attachment_name: null,
      attachment_size: null,
      attachment_type: null,
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_number) {
      newErrors.product_number = 'Product number is required';
    }
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }
    if (!formData.customer_name) {
      newErrors.customer_name = 'Customer name is required';
    }
    if (!formData.item_quantity || formData.item_quantity <= 0) {
      newErrors.item_quantity = 'Valid quantity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in');
        return;
      }

      const requestData = {
        product_number: formData.product_number!,
        description: formData.description!,
        customer_name: formData.customer_name!,
        supplier_name: formData.supplier_name || null,
        supplier_email: formData.supplier_email || null,
        supplier_currency: formData.supplier_currency || null,
        buyer_name: formData.buyer_name || null,
        item_quantity: formData.item_quantity!,
        supplier_pricing: formData.supplier_pricing || null,
        moq: formData.moq || null,
        effective_start_date: formData.effective_start_date || null,
        effective_end_date: formData.effective_end_date || null,
        supplier_quote_number: formData.supplier_quote_number || null,
        attachment_url: formData.attachment_url || null,
        attachment_name: formData.attachment_name || null,
        attachment_size: formData.attachment_size || null,
        attachment_type: formData.attachment_type || null,
        price_breaks: priceBreaks.length > 0 ? priceBreaks : [],
        quote_number: formData.quote_number || 'MANUAL-' + Date.now(),
        quote_type: formData.quote_type || 'Manual Entry',
        status: formData.status || 'pending',
        quote_id: existingRequest?.quote_id || null,
        quote_line_item_id: existingRequest?.quote_line_item_id || null,
        updated_at: new Date().toISOString(),
      };

      if (existingRequest?.id) {
        const { error } = await supabase
          .from('price_requests')
          .update(requestData)
          .eq('id', existingRequest.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('price_requests')
          .insert({
            ...requestData,
            requested_by: user.id,
            requested_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving price request:', error);
      alert(`Failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!existingRequest) {
      alert('Cannot complete a price request that has not been saved');
      return;
    }

    if (!validateForm()) {
      alert('Please fill in all required fields before completing');
      return;
    }

    if (!formData.supplier_pricing || formData.supplier_pricing <= 0) {
      alert('Please enter a valid supplier pricing before completing');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to complete this price request? This will save all changes and update the cost on the associated quote line item and product.'
    );

    if (!confirmed) return;

    setIsCompleting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in');
        return;
      }

      const newCost = formData.supplier_pricing;
      console.log('Completing price request with:', {
        newCost,
        effectiveFrom: formData.effective_start_date,
        effectiveTo: formData.effective_end_date,
        lineItemId: existingRequest.quote_line_item_id
      });

      // First, save all the form data
      const requestData = {
        product_number: formData.product_number!,
        description: formData.description!,
        customer_name: formData.customer_name!,
        supplier_name: formData.supplier_name || null,
        supplier_email: formData.supplier_email || null,
        supplier_currency: formData.supplier_currency || null,
        buyer_name: formData.buyer_name || null,
        item_quantity: formData.item_quantity!,
        supplier_pricing: formData.supplier_pricing || null,
        moq: formData.moq || null,
        effective_start_date: formData.effective_start_date || null,
        effective_end_date: formData.effective_end_date || null,
        supplier_quote_number: formData.supplier_quote_number || null,
        attachment_url: formData.attachment_url || null,
        attachment_name: formData.attachment_name || null,
        attachment_size: formData.attachment_size || null,
        attachment_type: formData.attachment_type || null,
        price_breaks: priceBreaks.length > 0 ? priceBreaks : [],
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: user.id,
        updated_at: new Date().toISOString(),
      };

      const { data: priceRequestUpdate, error: priceRequestError } = await supabase
        .from('price_requests')
        .update(requestData)
        .eq('id', existingRequest.id)
        .select()
        .single();

      if (priceRequestError) {
        console.error('Error updating price request:', priceRequestError);
        throw priceRequestError;
      }
      console.log('Price request updated successfully:', priceRequestUpdate);

      if (existingRequest.quote_line_item_id) {
        console.log('Updating quote line item:', existingRequest.quote_line_item_id);
        console.log('Setting unit_cost to:', newCost);

        const updateData = {
          unit_cost: newCost,
          cost_effective_from: formData.effective_start_date || null,
          cost_effective_to: formData.effective_end_date || null,
          updated_at: new Date().toISOString(),
        };

        console.log('Update payload:', updateData);

        const { data: updatedLineItem, error: lineItemError } = await supabase
          .from('quote_line_items')
          .update(updateData)
          .eq('id', existingRequest.quote_line_item_id)
          .select()
          .single();

        if (lineItemError) {
          console.error('Error updating quote line item:', lineItemError);
          throw lineItemError;
        }
        console.log('Quote line item updated successfully:', updatedLineItem);
        console.log('New unit_cost in database:', updatedLineItem.unit_cost);
      }

      const { data: product, error: productFetchError } = await supabase
        .from('products')
        .select('id')
        .eq('sku', formData.product_number)
        .maybeSingle();

      if (productFetchError) {
        console.error('Error fetching product:', productFetchError);
      } else if (product) {
        const { error: productUpdateError } = await supabase
          .from('products')
          .update({
            unit_cost: newCost,
            cost_effective_from: formData.effective_start_date || null,
            cost_effective_to: formData.effective_end_date || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id);

        if (productUpdateError) {
          console.error('Error updating product:', productUpdateError);
          throw productUpdateError;
        }
      }

      // Force reload of the affected quote to ensure UI updates
      if (existingRequest.quote_id) {
        console.log('Forcing quote reload for quote_id:', existingRequest.quote_id);

        // Trigger a manual update on the quote to force real-time subscribers to refresh
        const { error: touchError } = await supabase
          .from('quotes')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', existingRequest.quote_id);

        if (touchError) {
          console.error('Error touching quote:', touchError);
        } else {
          console.log('Quote touched successfully to trigger refresh');
        }
      }

      alert('Price request completed successfully! Cost and effective dates updated on quote line item and product.');

      // Force a small delay to ensure real-time updates propagate
      await new Promise(resolve => setTimeout(resolve, 1500));

      onSave();
    } catch (error: any) {
      console.error('Error completing price request:', error);
      alert(`Failed to complete: ${error.message}`);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Price Requests</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {existingRequest ? 'Edit Price Request' : 'New Price Request'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {existingRequest
                ? 'Update the details of this price request'
                : 'Create a new price request for supplier pricing'}
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Number / SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.product_number || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, product_number: e.target.value });
                    setErrors({ ...errors, product_number: '' });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                    errors.product_number
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter SKU or product number"
                />
                {errors.product_number && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.product_number}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.item_quantity || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, item_quantity: parseFloat(e.target.value) });
                    setErrors({ ...errors, item_quantity: '' });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                    errors.item_quantity
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0"
                  min="0"
                />
                {errors.item_quantity && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.item_quantity}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    setErrors({ ...errors, description: '' });
                  }}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                    errors.description
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter product description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, customer_name: e.target.value });
                      setErrors({ ...errors, customer_name: '' });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                      errors.customer_name
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Customer name"
                  />
                  {errors.customer_name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.customer_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buyer Name
                  </label>
                  <input
                    type="text"
                    value={formData.buyer_name || ''}
                    onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Buyer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_name || ''}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Supplier name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supplier Email
                  </label>
                  <input
                    type="email"
                    value={formData.supplier_email || ''}
                    onChange={(e) => setFormData({ ...formData, supplier_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="supplier@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supplier Currency
                  </label>
                  <select
                    value={formData.supplier_currency || 'USD'}
                    onChange={(e) => setFormData({ ...formData, supplier_currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="MXN">MXN - Mexican Peso</option>
                    <option value="BRL">BRL - Brazilian Real</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supplier Pricing
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.supplier_pricing || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, supplier_pricing: parseFloat(e.target.value) || undefined })
                      }
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    MOQ (Minimum Order Quantity)
                  </label>
                  <input
                    type="number"
                    value={formData.moq || ''}
                    onChange={(e) => setFormData({ ...formData, moq: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Effective Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.effective_start_date || ''}
                    onChange={(e) => setFormData({ ...formData, effective_start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Effective End Date
                  </label>
                  <input
                    type="date"
                    value={formData.effective_end_date || ''}
                    onChange={(e) => setFormData({ ...formData, effective_end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supplier Quote Number
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_quote_number || ''}
                    onChange={(e) => setFormData({ ...formData, supplier_quote_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Supplier quote reference"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Document Attachment</h3>
              <div className="space-y-4">
                {formData.attachment_url ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{formData.attachment_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formData.attachment_size ? `${(formData.attachment_size / 1024).toFixed(2)} KB` : 'Unknown size'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={formData.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Download attachment"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                      <button
                        onClick={handleRemoveAttachment}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove attachment"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className={`w-10 h-10 mb-3 ${uploadingFile ? 'text-gray-400 animate-pulse' : 'text-gray-400'}`} />
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">{uploadingFile ? 'Uploading...' : 'Click to upload'}</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PDF, DOC, DOCX, XLS, XLSX, or images (MAX. 10MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Price Breaks</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Add quantity-based pricing tiers
                  </p>
                </div>
                <button
                  onClick={addPriceBreak}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Price Break</span>
                </button>
              </div>

              {priceBreaks.length > 0 ? (
                <div className="space-y-3">
                  {priceBreaks.map((priceBreak, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={priceBreak.quantity}
                          onChange={(e) => updatePriceBreak(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Min quantity"
                          min="0"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Price per Unit
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500 text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={priceBreak.price}
                            onChange={(e) => updatePriceBreak(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="0.00"
                            min="0"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removePriceBreak(index)}
                        className="mt-5 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove price break"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p>No price breaks added yet</p>
                  <p className="text-sm mt-1">Click "Add Price Break" to create quantity-based pricing</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
            <button
              onClick={onClose}
              disabled={isSaving || isCompleting}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <div className="flex items-center space-x-3">
              {existingRequest && existingRequest.status !== 'completed' && (
                <button
                  onClick={handleComplete}
                  disabled={isSaving || isCompleting}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>{isCompleting ? 'Completing...' : 'Complete Request'}</span>
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving || isCompleting}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span>{isSaving ? 'Saving...' : existingRequest ? 'Update Request' : 'Create Request'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
