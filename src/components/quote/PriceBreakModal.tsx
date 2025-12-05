import React from 'react';
import { X, Trophy, TrendingDown } from 'lucide-react';

interface PriceBreakModalProps {
  item: any;
  onClose: () => void;
  onPriceBreakSelect: (itemId: string, priceBreak: any) => void;
}

export const PriceBreakModal: React.FC<PriceBreakModalProps> = ({ item, onClose, onPriceBreakSelect }) => {
  // Mock supplier price breaks data
  const supplierPriceBreaks: { [key: string]: any[] } = {
    'CISCO-C9300-48P': [
      { minQty: 1, maxQty: 4, unitCost: 3500, description: 'Standard pricing', discount: 0, effectiveDate: '2025-01-01' },
      { minQty: 5, maxQty: 9, unitCost: 3350, description: '5+ units - 4.3% discount', discount: 4.3, effectiveDate: '2025-01-01' },
      { minQty: 10, maxQty: 24, unitCost: 3200, description: '10+ units - 8.6% discount', discount: 8.6, effectiveDate: '2025-01-01' },
      { minQty: 25, maxQty: 999, unitCost: 3000, description: '25+ units - 14.3% discount', discount: 14.3, effectiveDate: '2025-01-01' }
    ],
    'DELL-R7525-001': [
      { minQty: 1, maxQty: 2, unitCost: 4500, description: 'Standard pricing', discount: 0, effectiveDate: '2024-12-15' },
      { minQty: 3, maxQty: 9, unitCost: 4300, description: '3+ units - 4.4% discount', discount: 4.4, effectiveDate: '2024-12-15' },
      { minQty: 10, maxQty: 999, unitCost: 4100, description: '10+ units - 8.9% discount', discount: 8.9, effectiveDate: '2024-12-15' }
    ],
    'HPE-ML110-GEN10': [
      { minQty: 1, maxQty: 4, unitCost: 2100, description: 'Standard pricing', discount: 0, effectiveDate: '2024-11-01' },
      { minQty: 5, maxQty: 14, unitCost: 2000, description: '5+ units - 4.8% discount', discount: 4.8, effectiveDate: '2024-11-01' },
      { minQty: 15, maxQty: 999, unitCost: 1900, description: '15+ units - 9.5% discount', discount: 9.5, effectiveDate: '2024-11-01' }
    ],
    'LENOVO-ST250-001': [
      { minQty: 1, maxQty: 4, unitCost: 1800, description: 'Standard pricing', discount: 0, effectiveDate: '2024-10-15' },
      { minQty: 5, maxQty: 9, unitCost: 1750, description: '5+ units - 2.8% discount', discount: 2.8, effectiveDate: '2024-10-15' },
      { minQty: 10, maxQty: 999, unitCost: 1700, description: '10+ units - 5.6% discount', discount: 5.6, effectiveDate: '2024-10-15' }
    ],
    'FORTINET-FG-100F': [
      { minQty: 1, maxQty: 2, unitCost: 2800, description: 'Standard pricing', discount: 0, effectiveDate: '2024-09-01' },
      { minQty: 3, maxQty: 9, unitCost: 2700, description: '3+ units - 3.6% discount', discount: 3.6, effectiveDate: '2024-09-01' },
      { minQty: 10, maxQty: 999, unitCost: 2600, description: '10+ units - 7.1% discount', discount: 7.1, effectiveDate: '2024-09-01' }
    ]
  };

  const priceBreaks = supplierPriceBreaks[item.sku] || [];
  
  const getCurrentPriceBreak = (quantity: number) => {
    return priceBreaks.find(pb => quantity >= pb.minQty && quantity <= pb.maxQty) || priceBreaks[0];
  };

  const currentPriceBreak = getCurrentPriceBreak(item.qty);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Supplier Price Breaks</h3>
            <p className="text-sm text-gray-600 mt-1">
              {item.name} • SKU: {item.sku} • Supplier: {item.supplier}
            </p>
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
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-900">Current Quote Details</span>
              <span className="text-sm text-blue-700">Quantity: {item.qty} units</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Current Unit Cost:</span>
                <div className="font-semibold text-blue-900">${item.cost.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-blue-700">Total Cost:</span>
                <div className="font-semibold text-blue-900">${(item.cost * item.qty).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-blue-700">Price Break:</span>
                <div className="font-semibold text-blue-900">
                  {currentPriceBreak ? currentPriceBreak.description : 'Standard pricing'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 mb-4">Available Price Breaks</h4>
            
            {priceBreaks.map((priceBreak, index) => {
              const isCurrentlySelected = item.selectedPriceBreak?.unitCost === priceBreak.unitCost;
              const isOptimalForQuantity = currentPriceBreak?.unitCost === priceBreak.unitCost;
              const totalCost = priceBreak.unitCost * item.qty;
              const savings = item.qty > 0 ? (priceBreaks[0].unitCost - priceBreak.unitCost) * item.qty : 0;
              
              return (
                <div
                  key={index}
                  className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                    isCurrentlySelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : isOptimalForQuantity
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onPriceBreakSelect(item.id, priceBreak)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="font-semibold text-lg text-gray-900">
                          ${priceBreak.unitCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per unit
                        </div>
                        
                        {isCurrentlySelected && (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <Trophy className="h-4 w-4" />
                            <span className="text-sm font-medium">Currently Selected</span>
                          </div>
                        )}
                        
                        {isOptimalForQuantity && !isCurrentlySelected && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-sm font-medium">Optimal for {item.qty} units</span>
                          </div>
                        )}
                        
                        {priceBreak.discount > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {priceBreak.discount}% off
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Quantity Range:</span> {priceBreak.minQty.toLocaleString()}{priceBreak.maxQty < 999 ? `-${priceBreak.maxQty.toLocaleString()}` : '+'} units
                      </div>
                      
                      <div className="text-sm text-gray-700">{priceBreak.description}</div>
                    </div>
                    
                    <div className="text-right ml-6">
                      <div className="text-lg font-semibold text-gray-900 mb-1">
                        ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-gray-600">Total Cost</div>
                      
                      {savings > 0 && (
                        <div className="text-sm text-green-600 font-medium mt-1">
                          Save ${savings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                      
                      {priceBreak.effectiveDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Effective: {priceBreak.effectiveDate}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                      <div>
                        <span>Unit Cost: ${priceBreak.unitCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span>Quantity: {item.qty.toLocaleString()} units</span>
                      </div>
                      <div>
                        <span>Extended: ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {priceBreaks.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">No price breaks available</div>
              <div className="text-sm text-gray-400">Standard pricing applies for all quantities</div>
            </div>
          )}
        </div>
        
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};