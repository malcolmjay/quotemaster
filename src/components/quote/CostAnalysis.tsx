import React, { useState } from 'react';
import { X, Calculator, Target, TrendingUp } from 'lucide-react';

const round2 = (num: number): number => Math.round(num * 100) / 100;

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

  const baseCost = product?.cost || 3500;
  const laborCost = 0;
  const quantity = 1;
  const overheadAmount = round2((baseCost * overheadRate) / 100);
  const totalCost = round2(baseCost + laborCost + overheadAmount);
  const marginAmount = round2((totalCost * targetMargin) / (100 - targetMargin));
  const suggestedPrice = round2(totalCost + marginAmount);

  React.useEffect(() => {
    setFinalPrice(suggestedPrice);
  }, [suggestedPrice]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-[95vw] w-full max-h-[95vh] flex flex-col border border-[#dce0e6]">
        <div className="bg-[#f8f9fb] px-6 py-4 border-b border-[#eef0f3] flex items-center justify-between flex-shrink-0 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#e8f0fe] flex items-center justify-center">
              <Calculator className="h-4 w-4 text-[#1a6fb5]" />
            </div>
            <h3 className="text-base font-semibold text-[#1a1f36]">
              Cost Analysis - {product?.name || 'Product'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#eef0f3] rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-[#8c939d]" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 gap-5">
            <div className="space-y-4">
              <div className="bg-[#f8f9fb] p-4 rounded-lg border border-[#eef0f3]">
                <h4 className="font-semibold text-[#1a1f36] mb-3 text-sm">Product Information</h4>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-[#8c939d]">SKU:</span>
                    <div className="font-medium text-[#1a1f36]">{product?.sku || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-[#8c939d]">Buyer:</span>
                    <div className="font-medium text-[#1a1f36]">{product?.buyer || 'Not assigned'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <h4 className="font-semibold text-[#1a1f36] mb-3 text-sm">Cost Effective Dates</h4>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-amber-600">Effective From:</span>
                    <div className="font-medium text-[#1a1f36]">
                      {product?.cost_effective_from ? new Date(product.cost_effective_from).toLocaleDateString() : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <span className="text-amber-600">Effective To:</span>
                    <div className="font-medium text-[#1a1f36]">
                      {product?.cost_effective_to ? new Date(product.cost_effective_to).toLocaleDateString() : 'Not set'}
                    </div>
                  </div>
                  {product?.cost_effective_to && (
                    <div className="text-xs text-[#8c939d]">
                      Expires in {Math.ceil((new Date(product.cost_effective_to).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-4 w-4 text-[#1a6fb5]" />
                  <h4 className="font-semibold text-[#1a1f36] text-sm">Input Values</h4>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-medium text-[#5f6672] mb-1">Base Cost (per unit)</label>
                    <input
                      type="number"
                      value={baseCost}
                      className="w-full px-3 py-2 text-sm border border-[#dce0e6] rounded-md bg-[#f8f9fb] text-[#1a1f36] focus:ring-2 focus:ring-[#1a6fb5]"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5f6672] mb-1">Base Price (list price)</label>
                    <input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-[#dce0e6] rounded-md bg-white text-[#1a1f36] focus:ring-2 focus:ring-[#1a6fb5]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5f6672] mb-1">Labor Cost (per unit)</label>
                    <input
                      type="number"
                      value={laborCost}
                      className="w-full px-3 py-2 text-sm border border-[#dce0e6] rounded-md bg-white text-[#1a1f36] focus:ring-2 focus:ring-[#1a6fb5]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5f6672] mb-1">Quantity</label>
                    <input
                      type="number"
                      value={quantity}
                      className="w-full px-3 py-2 text-sm border border-[#dce0e6] rounded-md bg-white text-[#1a1f36] focus:ring-2 focus:ring-[#1a6fb5]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#5f6672] mb-2">Overhead Rate</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={overheadRate}
                    onChange={(e) => setOverheadRate(Number(e.target.value))}
                    className="flex-1 h-2 bg-[#eef0f3] rounded-lg appearance-none slider accent-[#1a6fb5]"
                  />
                  <span className="text-sm font-medium text-[#1a1f36] w-12 text-right">{overheadRate}%</span>
                </div>
                <div className="flex justify-between text-xs text-[#8c939d] mt-1">
                  <span>0%</span>
                  <span className="font-medium text-[#5f6672]">${overheadAmount.toFixed(2)}</span>
                  <span>50%</span>
                </div>
              </div>

              <div className="bg-[#f8f9fb] p-4 rounded-lg border border-[#eef0f3]">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSignIcon />
                  <h4 className="font-semibold text-[#1a1f36] text-sm">Cost Breakdown</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#5f6672]">Materials:</span>
                    <span className="font-medium text-[#1a1f36] tabular-nums">${baseCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5f6672]">Labor:</span>
                    <span className="font-medium text-[#1a1f36] tabular-nums">$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5f6672]">Direct Costs:</span>
                    <span className="font-medium text-[#1a1f36] tabular-nums">${baseCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5f6672]">Overhead ({overheadRate}%):</span>
                    <span className="font-medium text-[#1a1f36] tabular-nums">${overheadAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-[#dce0e6] pt-2 mt-2 flex justify-between font-semibold">
                    <span className="text-[#1a1f36]">Total Cost:</span>
                    <span className="text-[#1a1f36] tabular-nums">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#f8f9fb] p-4 rounded-lg border border-[#eef0f3]">
                <h4 className="font-semibold text-[#1a1f36] mb-2 text-sm">Price vs List</h4>
                <div className="px-3 py-2.5 bg-white border border-[#dce0e6] rounded-md">
                  <span className={`font-semibold text-sm ${
                    suggestedPrice < basePrice ? 'text-red-600' :
                    suggestedPrice > basePrice ? 'text-emerald-600' : 'text-[#5f6672]'
                  }`}>
                    {suggestedPrice < basePrice ? 'Below' : suggestedPrice > basePrice ? 'Above' : 'At'} List Price
                  </span>
                  <div className="text-xs text-[#8c939d] mt-0.5 tabular-nums">
                    {((suggestedPrice / basePrice - 1) * 100).toFixed(1)}% vs list
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-emerald-600" />
                  <h4 className="font-semibold text-[#1a1f36] text-sm">Margin & Pricing</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#5f6672] mb-2">Target Margin</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={targetMargin}
                        onChange={(e) => setTargetMargin(Number(e.target.value))}
                        className="flex-1 h-2 bg-[#eef0f3] rounded-lg appearance-none slider accent-emerald-600"
                      />
                      <span className="text-sm font-medium text-[#1a1f36] w-12 text-right">{targetMargin}%</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#8c939d] mt-1">
                      <span>0%</span>
                      <span className="font-medium text-[#5f6672] tabular-nums">${marginAmount.toFixed(2)}</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={customPrice}
                      onChange={(e) => setCustomPrice(e.target.checked)}
                      className="rounded border-[#cdd1d9] text-[#1a6fb5] focus:ring-[#1a6fb5]"
                    />
                    <label className="text-xs text-[#5f6672]">Custom Price</label>
                  </div>

                  <div className="bg-[#e8f0fe] p-4 rounded-lg border border-[#c4d9f2]">
                    <div className="text-xs font-medium text-[#1a6fb5] mb-1">Suggested Price (Total)</div>
                    <div className="text-xl font-bold text-[#0d3f6e] tabular-nums">${suggestedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-[#3d6b9e] tabular-nums">${suggestedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per unit</div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">Profitability Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs text-emerald-700">Good margin - Competitive and profitable</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#f8f9fb] p-5 rounded-lg border border-[#eef0f3]">
                <h4 className="font-semibold text-[#1a1f36] mb-4 text-sm">Final Analysis</h4>
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-md border border-[#dce0e6]">
                    <div className="text-[11px] font-semibold text-[#8c939d] uppercase tracking-wider mb-1">Final Price</div>
                    <div className="text-2xl font-bold text-[#1a1f36] tabular-nums">${suggestedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-[#8c939d] tabular-nums">${suggestedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / unit</div>
                  </div>
                  <div className="bg-white p-4 rounded-md border border-[#dce0e6]">
                    <div className="text-[11px] font-semibold text-[#8c939d] uppercase tracking-wider mb-1">Margin Amount</div>
                    <div className="text-2xl font-bold text-emerald-700 tabular-nums">${marginAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div className="bg-white p-4 rounded-md border border-[#dce0e6]">
                    <div className="text-[11px] font-semibold text-[#8c939d] uppercase tracking-wider mb-1">Margin %</div>
                    <div className="text-2xl font-bold text-emerald-700 tabular-nums">{targetMargin.toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#e8f0fe] p-4 rounded-lg border border-[#c4d9f2]">
                <h4 className="font-semibold text-[#1a1f36] mb-3 text-sm">Summary</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#5f6672]">Total Cost:</span>
                    <span className="font-medium text-[#1a1f36] tabular-nums">${totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5f6672]">List Price:</span>
                    <span className="font-medium text-[#1a1f36] tabular-nums">${basePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5f6672]">Suggested Price:</span>
                    <span className="font-medium text-[#1a1f36] tabular-nums">${suggestedPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#c4d9f2] pt-2 mt-2">
                    <span className="font-semibold text-[#1a1f36]">Profit:</span>
                    <span className="font-bold text-emerald-700 tabular-nums">${(suggestedPrice - totalCost).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#f8f9fb] px-6 py-4 border-t border-[#eef0f3] flex justify-end gap-3 flex-shrink-0 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#dce0e6] text-[#5f6672] rounded-md hover:bg-white hover:text-[#1a1f36] transition-colors text-sm font-medium"
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
            className="px-4 py-2 bg-[#1a6fb5] text-white rounded-md hover:bg-[#155a94] transition-colors text-sm font-medium shadow-sm"
          >
            Apply Pricing
          </button>
        </div>
      </div>
    </div>
  );
};

function DollarSignIcon() {
  return (
    <svg className="h-4 w-4 text-[#1a6fb5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
