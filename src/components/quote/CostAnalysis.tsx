import React, { useState } from 'react';
import { X, Calculator, Target, TrendingUp } from 'lucide-react';

interface CostAnalysisProps {
  product: any;
  onClose: () => void;
  onApplyPricing?: (itemId: string, price: number) => void;
}

export const CostAnalysis: React.FC<CostAnalysisProps> = ({ product, onClose, onApplyPricing }) => {
  const [overheadRate, setOverheadRate] = useState(15);
  const [targetMargin, setTargetMargin] = useState(25);
  const [basePrice, setBasePrice] = useState(4200);
  const [customPrice, setCustomPrice] = useState(false);
  const [finalPrice, setFinalPrice] = useState(0);

  // Use the actual cost from the product/line item
  const baseCost = product?.cost || 3500;
  const laborCost = 0;
  const quantity = 1;
  const overheadAmount = (baseCost * overheadRate) / 100;
  const totalCost = baseCost + laborCost + overheadAmount;
  const marginAmount = (totalCost * targetMargin) / (100 - targetMargin);
  const suggestedPrice = totalCost + marginAmount;

  React.useEffect(() => {
    setFinalPrice(suggestedPrice);
  }, [suggestedPrice]);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Cost Analysis for {product?.name || 'Product'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Product Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">SKU:</span>
                <div className="font-medium text-gray-900">{product?.sku || 'N/A'}</div>
              </div>
              <div>
                <span className="text-gray-600">Buyer:</span>
                <div className="font-medium text-gray-900">{product?.buyer || 'Not assigned'}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Cost Effective Dates</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Effective From:</span>
                <div className="font-medium text-gray-900">
                  {product?.cost_effective_from ? new Date(product.cost_effective_from).toLocaleDateString() : 'Not set'}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Effective To:</span>
                <div className="font-medium text-gray-900">
                  {product?.cost_effective_to ? new Date(product.cost_effective_to).toLocaleDateString() : 'Not set'}
                </div>
              </div>
            </div>
            {product?.cost_effective_to && (
              <div className="mt-2 text-xs text-gray-500">
                Cost expires in {Math.ceil((new Date(product.cost_effective_to).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
              </div>
            )}
          </div>
          
          {/* Margin Calculator */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Margin Calculator</h4>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Cost (per unit)
                </label>
                <input
                  type="number"
                  value={baseCost}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price (list price)
                </label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Labor Cost (per unit)
                </label>
                <input
                  type="number"
                  value={laborCost}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price vs Base Price
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <span className={`font-medium ${
                    suggestedPrice < basePrice ? 'text-red-600' : 
                    suggestedPrice > basePrice ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {suggestedPrice < basePrice ? 'Below' : suggestedPrice > basePrice ? 'Above' : 'At'} List Price
                  </span>
                  <div className="text-sm text-gray-600">
                    {((suggestedPrice / basePrice - 1) * 100).toFixed(1)}% vs list
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm text-gray-600">Total: ${baseCost.toLocaleString()}</div>
              <div className="text-sm text-gray-600">List Price: ${basePrice.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total: $0.00</div>
            </div>
          </div>
          
          {/* Overhead Rate */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Overhead Rate
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="50"
                value={overheadRate}
                onChange={(e) => setOverheadRate(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none slider"
              />
              <span className="text-sm text-gray-600 w-12">{overheadRate}%</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>Amount: ${overheadAmount.toFixed(2)}</span>
              <span>50%</span>
            </div>
          </div>
          
          {/* Cost Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">💰</span>
              <h4 className="font-medium text-gray-900">Cost Breakdown</h4>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Materials:</span>
                <span className="font-medium">${baseCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Labor:</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Direct Costs:</span>
                <span className="font-medium">${baseCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Overhead ({overheadRate}%):</span>
                <span className="font-medium">${overheadAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                <span>Total Cost:</span>
                <span>${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          
          {/* Margin & Pricing */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-gray-900">Margin & Pricing</h4>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Target Margin
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none slider"
                />
                <span className="text-sm text-gray-600 w-12">{targetMargin}%</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>Amount: ${marginAmount.toFixed(2)}</span>
                <span>100%</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                checked={customPrice}
                onChange={(e) => setCustomPrice(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">Custom Price</label>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-800 mb-2">Suggested Price (Total)</div>
              <div className="text-2xl font-bold text-blue-900">${suggestedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="text-sm text-blue-700">${suggestedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per unit</div>
            </div>
          </div>
          
          {/* Final Analysis */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600">Final Price</div>
                <div className="text-xl font-bold text-gray-900">${suggestedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="text-xs text-gray-500">${suggestedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / unit</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Margin Amount</div>
                <div className="text-xl font-bold text-green-600">${marginAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Margin %</div>
                <div className="text-xl font-bold text-green-600">{targetMargin.toFixed(1)}%</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Profitability Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Good margin - Competitive and profitable</span>
            </div>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (onApplyPricing && product) {
                onApplyPricing(product.id, finalPrice);
              }
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Pricing
          </button>
        </div>
      </div>
    </div>
  );
};