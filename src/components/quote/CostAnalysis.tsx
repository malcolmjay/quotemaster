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
      <div className="bg-white rounded-lg shadow-xl max-w-[95vw] w-full max-h-[95vh] flex flex-col">
        <div className="bg-white px-6 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
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

        <div className="p-5 flex-1">
          <div className="grid grid-cols-4 gap-4">
            {/* Column 1: Product Info & Inputs */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Product Information</h4>
                <div className="space-y-2 text-xs">
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

              <div className="bg-yellow-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Cost Effective Dates</h4>
                <div className="space-y-2 text-xs">
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
                  {product?.cost_effective_to && (
                    <div className="text-xs text-gray-500">
                      Expires in {Math.ceil((new Date(product.cost_effective_to).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-gray-900 text-sm">Input Values</h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Base Cost (per unit)
                    </label>
                    <input
                      type="number"
                      value={baseCost}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Base Price (list price)
                    </label>
                    <input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Labor Cost (per unit)
                    </label>
                    <input
                      type="number"
                      value={laborCost}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Overhead & Cost Breakdown */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Overhead Rate
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={overheadRate}
                    onChange={(e) => setOverheadRate(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none slider"
                  />
                  <span className="text-sm text-gray-600 w-10">{overheadRate}%</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>${overheadAmount.toFixed(2)}</span>
                  <span>50%</span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-base">💰</span>
                  <h4 className="font-medium text-gray-900 text-sm">Cost Breakdown</h4>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Materials:</span>
                    <span className="font-medium">${baseCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Labor:</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Direct Costs:</span>
                    <span className="font-medium">${baseCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Overhead ({overheadRate}%):</span>
                    <span className="font-medium">${overheadAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-1.5 mt-1.5 flex justify-between font-semibold">
                    <span>Total Cost:</span>
                    <span>${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Price vs List</h4>
                <div className="px-3 py-2 bg-white border border-gray-300 rounded">
                  <span className={`font-medium text-sm ${
                    suggestedPrice < basePrice ? 'text-red-600' :
                    suggestedPrice > basePrice ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {suggestedPrice < basePrice ? 'Below' : suggestedPrice > basePrice ? 'Above' : 'At'} List Price
                  </span>
                  <div className="text-xs text-gray-600 mt-1">
                    {((suggestedPrice / basePrice - 1) * 100).toFixed(1)}% vs list
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Margin & Pricing */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium text-gray-900 text-sm">Margin & Pricing</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Target Margin
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={targetMargin}
                        onChange={(e) => setTargetMargin(Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none slider"
                      />
                      <span className="text-sm text-gray-600 w-10">{targetMargin}%</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>${marginAmount.toFixed(2)}</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={customPrice}
                      onChange={(e) => setCustomPrice(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-xs text-gray-700">Custom Price</label>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs text-blue-800 mb-1">Suggested Price (Total)</div>
                    <div className="text-xl font-bold text-blue-900">${suggestedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-blue-700">${suggestedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per unit</div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Profitability Analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-700">Good margin - Competitive and profitable</span>
                </div>
              </div>
            </div>

            {/* Column 4: Final Analysis Summary */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Final Analysis</h4>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Final Price</div>
                    <div className="text-2xl font-bold text-gray-900">${suggestedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-gray-500">${suggestedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / unit</div>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Margin Amount</div>
                    <div className="text-2xl font-bold text-green-600">${marginAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Margin %</div>
                    <div className="text-2xl font-bold text-green-600">{targetMargin.toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Summary</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-medium">${totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">List Price:</span>
                    <span className="font-medium">${basePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Suggested Price:</span>
                    <span className="font-medium">${suggestedPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-1.5 mt-1.5">
                    <span className="font-semibold">Profit:</span>
                    <span className="font-semibold text-green-600">${(suggestedPrice - totalCost).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white px-6 py-3 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
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