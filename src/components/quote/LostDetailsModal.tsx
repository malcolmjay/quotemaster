import React, { useState } from 'react';
import { X, AlertTriangle, DollarSign, Building } from 'lucide-react';

interface LostDetailsModalProps {
  lineItem: any;
  onClose: () => void;
  onSave: (lostDetails: LostDetailsData) => void;
  isOpen: boolean;
}

interface LostDetailsData {
  lineItemId: string;
  lostReason: string;
  competitor1: string;
  bidPrice1: number;
  competitor2?: string;
  bidPrice2?: number;
}

export const LostDetailsModal: React.FC<LostDetailsModalProps> = ({
  lineItem,
  onClose,
  onSave,
  isOpen
}) => {
  const [formData, setFormData] = useState<LostDetailsData>({
    lineItemId: lineItem?.id || '',
    lostReason: '',
    competitor1: '',
    bidPrice1: 0,
    competitor2: '',
    bidPrice2: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.lostReason.trim()) {
      newErrors.lostReason = 'Lost reason is required';
    }

    if (!formData.competitor1.trim()) {
      newErrors.competitor1 = 'At least one competitor is required';
    }

    if (formData.bidPrice1 <= 0) {
      newErrors.bidPrice1 = 'Bid price must be greater than 0';
    }

    // Validate competitor 2 and bid price 2 together
    if (formData.competitor2?.trim() && (!formData.bidPrice2 || formData.bidPrice2 <= 0)) {
      newErrors.bidPrice2 = 'Bid price 2 is required when competitor 2 is specified';
    }

    if (formData.bidPrice2 && formData.bidPrice2 > 0 && !formData.competitor2?.trim()) {
      newErrors.competitor2 = 'Competitor 2 is required when bid price 2 is specified';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving lost details:', error);
      setErrors({ general: 'Failed to save lost details. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof LostDetailsData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Lost Opportunity Details</h3>
              <p className="text-sm text-gray-600">
                {lineItem?.sku} - {lineItem?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Line Item Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">SKU:</span>
                <div className="font-semibold text-blue-900">{lineItem?.sku}</div>
              </div>
              <div>
                <span className="text-blue-700">Quantity:</span>
                <div className="font-semibold text-blue-900">{lineItem?.qty} units</div>
              </div>
              <div>
                <span className="text-blue-700">Our Price:</span>
                <div className="font-semibold text-blue-900">${lineItem?.price?.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-blue-700">Total Value:</span>
                <div className="font-semibold text-blue-900">${lineItem?.subtotal?.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {errors.general && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Lost Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lost Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.lostReason}
                onChange={(e) => handleInputChange('lostReason', e.target.value)}
                placeholder="Describe why this opportunity was lost..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.lostReason ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                rows={3}
              />
              {errors.lostReason && (
                <p className="mt-1 text-sm text-red-600">{errors.lostReason}</p>
              )}
            </div>

            {/* Competitor 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-600" />
                    <span>Competitor 1 <span className="text-red-500">*</span></span>
                  </div>
                </label>
                <input
                  type="text"
                  value={formData.competitor1}
                  onChange={(e) => handleInputChange('competitor1', e.target.value)}
                  placeholder="Company name that won the business"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.competitor1 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.competitor1 && (
                  <p className="mt-1 text-sm text-red-600">{errors.competitor1}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-600" />
                    <span>Bid Price 1 <span className="text-red-500">*</span></span>
                  </div>
                </label>
                <input
                  type="number"
                  value={formData.bidPrice1}
                  onChange={(e) => handleInputChange('bidPrice1', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.bidPrice1 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  step="0.01"
                  min="0"
                />
                {errors.bidPrice1 && (
                  <p className="mt-1 text-sm text-red-600">{errors.bidPrice1}</p>
                )}
              </div>
            </div>

            {/* Competitor 2 (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-600" />
                    <span>Competitor 2 (Optional)</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={formData.competitor2}
                  onChange={(e) => handleInputChange('competitor2', e.target.value)}
                  placeholder="Additional competitor (optional)"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.competitor2 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.competitor2 && (
                  <p className="mt-1 text-sm text-red-600">{errors.competitor2}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-600" />
                    <span>Bid Price 2 (Optional)</span>
                  </div>
                </label>
                <input
                  type="number"
                  value={formData.bidPrice2}
                  onChange={(e) => handleInputChange('bidPrice2', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.bidPrice2 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  step="0.01"
                  min="0"
                />
                {errors.bidPrice2 && (
                  <p className="mt-1 text-sm text-red-600">{errors.bidPrice2}</p>
                )}
              </div>
            </div>

            {/* Competitive Analysis */}
            {formData.bidPrice1 > 0 && lineItem?.price > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Competitive Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-600">Our Price</div>
                    <div className="text-lg font-bold text-blue-600">
                      ${lineItem.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Winning Price</div>
                    <div className="text-lg font-bold text-red-600">
                      ${formData.bidPrice1.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Price Difference</div>
                    <div className={`text-lg font-bold ${
                      lineItem.price > formData.bidPrice1 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {lineItem.price > formData.bidPrice1 ? '+' : ''}
                      ${(lineItem.price - formData.bidPrice1).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {((lineItem.price - formData.bidPrice1) / formData.bidPrice1 * 100).toFixed(1)}% difference
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            <span>{saving ? 'Saving...' : 'Save Lost Details'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};