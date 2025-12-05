import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, TrendingUp, TrendingDown, Calculator, Eye, ChevronLeft, ChevronRight, BarChart3, Target, AlertTriangle, CheckCircle } from 'lucide-react';

interface MultiYearPricingProps {
  lineItem: any;
  supplyPeriodMonths: number;
  onClose: () => void;
  onSave: (pricingData: MultiYearPricingData) => void;
}

interface YearlyPricing {
  year: number;
  unitPrice: number;
  unitCost: number;
  quantity: number;
  subtotal: number;
  totalCost: number;
  margin: number;
  escalationRate: number;
  notes: string;
}

interface MultiYearPricingData {
  lineItemId: string;
  yearlyPricing: YearlyPricing[];
  totalContractValue: number;
  averageMargin: number;
  profitabilityScore: 'excellent' | 'good' | 'fair' | 'poor';
}

export const MultiYearPricing: React.FC<MultiYearPricingProps> = ({ 
  lineItem, 
  supplyPeriodMonths, 
  onClose, 
  onSave 
}) => {
  const [activeYear, setActiveYear] = useState(1);
  const [viewMode, setViewMode] = useState<'entry' | 'analysis'>('entry');
  const [yearlyData, setYearlyData] = useState<YearlyPricing[]>([]);
  const [basePrice, setBasePrice] = useState(lineItem?.price || 0);
  const [baseCost, setBaseCost] = useState(lineItem?.cost || 0);
  const [defaultEscalation, setDefaultEscalation] = useState(3.0);

  const totalYears = Math.ceil(supplyPeriodMonths / 12);
  const years = Array.from({ length: totalYears }, (_, i) => i + 1);

  // Initialize yearly data
  useEffect(() => {
    const initialData: YearlyPricing[] = years.map(year => ({
      year,
      unitPrice: basePrice * Math.pow(1 + defaultEscalation / 100, year - 1),
      unitCost: baseCost * Math.pow(1 + defaultEscalation / 100, year - 1),
      quantity: lineItem?.qty || 1,
      subtotal: 0,
      totalCost: 0,
      margin: 0,
      escalationRate: defaultEscalation,
      notes: ''
    }));

    // Calculate derived values
    initialData.forEach(yearData => {
      yearData.subtotal = yearData.unitPrice * yearData.quantity;
      yearData.totalCost = yearData.unitCost * yearData.quantity;
      yearData.margin = yearData.subtotal > 0 ? ((yearData.subtotal - yearData.totalCost) / yearData.subtotal) * 100 : 0;
    });

    setYearlyData(initialData);
  }, [years.length, basePrice, baseCost, defaultEscalation, lineItem]);

  const updateYearData = (year: number, field: keyof YearlyPricing, value: any) => {
    setYearlyData(prev => prev.map(data => {
      if (data.year === year) {
        const updated = { ...data, [field]: value };
        
        // Recalculate derived values
        if (field === 'unitPrice' || field === 'quantity') {
          updated.subtotal = updated.unitPrice * updated.quantity;
          updated.margin = updated.subtotal > 0 ? ((updated.subtotal - updated.totalCost) / updated.subtotal) * 100 : 0;
        }
        if (field === 'unitCost' || field === 'quantity') {
          updated.totalCost = updated.unitCost * updated.quantity;
          updated.margin = updated.subtotal > 0 ? ((updated.subtotal - updated.totalCost) / updated.subtotal) * 100 : 0;
        }
        
        return updated;
      }
      return data;
    }));
  };

  const applyEscalationToAll = () => {
    setYearlyData(prev => prev.map(data => {
      const escalatedPrice = basePrice * Math.pow(1 + defaultEscalation / 100, data.year - 1);
      const escalatedCost = baseCost * Math.pow(1 + defaultEscalation / 100, data.year - 1);
      const subtotal = escalatedPrice * data.quantity;
      const totalCost = escalatedCost * data.quantity;
      
      return {
        ...data,
        unitPrice: escalatedPrice,
        unitCost: escalatedCost,
        subtotal,
        totalCost,
        margin: subtotal > 0 ? ((subtotal - totalCost) / subtotal) * 100 : 0,
        escalationRate: defaultEscalation
      };
    }));
  };

  // Calculate summary metrics
  const totalContractValue = yearlyData.reduce((sum, data) => sum + data.subtotal, 0);
  const totalContractCost = yearlyData.reduce((sum, data) => sum + data.totalCost, 0);
  const averageMargin = totalContractValue > 0 ? ((totalContractValue - totalContractCost) / totalContractValue) * 100 : 0;
  const profitabilityScore = averageMargin >= 25 ? 'excellent' : averageMargin >= 15 ? 'good' : averageMargin >= 8 ? 'fair' : 'poor';

  const currentYearData = yearlyData.find(data => data.year === activeYear);

  const handleSave = () => {
    const pricingData: MultiYearPricingData = {
      lineItemId: lineItem.id,
      yearlyPricing: yearlyData,
      totalContractValue,
      averageMargin,
      profitabilityScore
    };
    onSave(pricingData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Multi-Year Pricing</h3>
              <p className="text-sm text-gray-600 mt-1">
                {lineItem?.sku} - {lineItem?.name} • {totalYears} Year Contract
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('entry')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'entry' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Pricing Entry
                </button>
                <button
                  onClick={() => setViewMode('analysis')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'analysis' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Profitability Analysis
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Contract Summary Bar */}
        <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-sm text-blue-700 font-medium">Contract Period</div>
              <div className="text-lg font-bold text-blue-900">{totalYears} Years</div>
              <div className="text-xs text-blue-600">{supplyPeriodMonths} months</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-blue-700 font-medium">Total Contract Value</div>
              <div className="text-lg font-bold text-blue-900">
                ${totalContractValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-blue-700 font-medium">Average Margin</div>
              <div className={`text-lg font-bold ${
                averageMargin >= 20 ? 'text-green-600' : 
                averageMargin >= 10 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {averageMargin.toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-blue-700 font-medium">Profitability</div>
              <div className={`text-lg font-bold ${
                profitabilityScore === 'excellent' ? 'text-green-600' :
                profitabilityScore === 'good' ? 'text-blue-600' :
                profitabilityScore === 'fair' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {profitabilityScore.charAt(0).toUpperCase() + profitabilityScore.slice(1)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {viewMode === 'entry' ? (
            <div className="space-y-6">
              {/* Base Pricing Controls */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Base Pricing & Escalation</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (Year 1)</label>
                    <input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Cost (Year 1)</label>
                    <input
                      type="number"
                      value={baseCost}
                      onChange={(e) => setBaseCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Escalation (%)</label>
                    <input
                      type="number"
                      value={defaultEscalation}
                      onChange={(e) => setDefaultEscalation(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      step="0.1"
                      min="0"
                      max="20"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={applyEscalationToAll}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply to All Years
                    </button>
                  </div>
                </div>
              </div>

              {/* Year Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h4 className="font-medium text-gray-900">Year-by-Year Pricing</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setActiveYear(Math.max(1, activeYear - 1))}
                      disabled={activeYear === 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-gray-600">
                      Year {activeYear} of {totalYears}
                    </span>
                    <button
                      onClick={() => setActiveYear(Math.min(totalYears, activeYear + 1))}
                      disabled={activeYear === totalYears}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Year Tabs */}
                <div className="flex space-x-1">
                  {years.map(year => {
                    const yearData = yearlyData.find(d => d.year === year);
                    const hasData = yearData && yearData.unitPrice > 0;
                    
                    return (
                      <button
                        key={year}
                        onClick={() => setActiveYear(year)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                          activeYear === year
                            ? 'bg-blue-600 text-white'
                            : hasData
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Year {year}
                        {hasData && activeYear !== year && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Year Pricing Entry */}
              {currentYearData && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900">Year {activeYear} Pricing</h5>
                        <p className="text-sm text-gray-600">
                          Contract months {((activeYear - 1) * 12) + 1} - {Math.min(activeYear * 12, supplyPeriodMonths)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Year {activeYear} Margin</div>
                      <div className={`text-xl font-bold ${
                        currentYearData.margin >= 20 ? 'text-green-600' : 
                        currentYearData.margin >= 10 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {currentYearData.margin.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Price
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          value={currentYearData.unitPrice}
                          onChange={(e) => updateYearData(activeYear, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Cost
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          value={currentYearData.unitCost}
                          onChange={(e) => updateYearData(activeYear, 'unitCost', parseFloat(e.target.value) || 0)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={currentYearData.quantity}
                        onChange={(e) => updateYearData(activeYear, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Escalation Rate (%)
                      </label>
                      <input
                        type="number"
                        value={currentYearData.escalationRate}
                        onChange={(e) => updateYearData(activeYear, 'escalationRate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        step="0.1"
                        min="0"
                        max="20"
                      />
                    </div>
                  </div>

                  {/* Year Summary */}
                  <div className="mt-6 grid grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-sm text-blue-700 font-medium">Year {activeYear} Subtotal</div>
                      <div className="text-xl font-bold text-blue-900">
                        ${currentYearData.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-sm text-gray-700 font-medium">Year {activeYear} Total Cost</div>
                      <div className="text-xl font-bold text-gray-900">
                        ${currentYearData.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-sm text-green-700 font-medium">Year {activeYear} Profit</div>
                      <div className="text-xl font-bold text-green-900">
                        ${(currentYearData.subtotal - currentYearData.totalCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year {activeYear} Notes
                    </label>
                    <textarea
                      value={currentYearData.notes}
                      onChange={(e) => updateYearData(activeYear, 'notes', e.target.value)}
                      placeholder="Add notes about pricing assumptions, market conditions, or special considerations for this year..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Quick Year Overview */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <h5 className="font-medium text-gray-900">All Years Overview</h5>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Escalation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {yearlyData.map((data) => (
                        <tr 
                          key={data.year} 
                          className={`hover:bg-gray-50 cursor-pointer ${
                            activeYear === data.year ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                          onClick={() => setActiveYear(data.year)}
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">Year {data.year}</td>
                          <td className="px-4 py-3 text-right">${data.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3 text-right">${data.unitCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3 text-center">{data.quantity}</td>
                          <td className="px-4 py-3 text-right font-medium">${data.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-medium ${
                              data.margin >= 20 ? 'text-green-600' : 
                              data.margin >= 10 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {data.margin.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">{data.escalationRate.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Profitability Analysis View */
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">Total Revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    ${totalContractValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Calculator className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700 font-medium">Total Cost</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${totalContractCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Total Profit</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    ${(totalContractValue - totalContractCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <span className="text-sm text-purple-700 font-medium">Avg Margin</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">{averageMargin.toFixed(1)}%</div>
                </div>
              </div>

              {/* Profitability Assessment */}
              <div className={`p-6 rounded-lg border-2 ${
                profitabilityScore === 'excellent' ? 'bg-green-50 border-green-200' :
                profitabilityScore === 'good' ? 'bg-blue-50 border-blue-200' :
                profitabilityScore === 'fair' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-3 mb-4">
                  {profitabilityScore === 'excellent' ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : profitabilityScore === 'poor' ? (
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  ) : (
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  )}
                  <div>
                    <h4 className="font-semibold text-lg">
                      Profitability Assessment: {profitabilityScore.charAt(0).toUpperCase() + profitabilityScore.slice(1)}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {profitabilityScore === 'excellent' ? 'Strong margins across all years - highly profitable contract' :
                       profitabilityScore === 'good' ? 'Solid margins with good profitability potential' :
                       profitabilityScore === 'fair' ? 'Acceptable margins but monitor costs carefully' :
                       'Low margins - review pricing strategy and cost assumptions'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Risk Factors</h5>
                    <ul className="text-sm space-y-1">
                      {averageMargin < 10 && <li className="text-red-600">• Low average margin</li>}
                      {yearlyData.some(d => d.margin < 5) && <li className="text-red-600">• Some years below 5% margin</li>}
                      {totalYears > 3 && <li className="text-yellow-600">• Long-term contract risk</li>}
                      {yearlyData.some(d => d.escalationRate > 5) && <li className="text-yellow-600">• High escalation rates</li>}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Opportunities</h5>
                    <ul className="text-sm space-y-1">
                      {averageMargin > 15 && <li className="text-green-600">• Strong margin potential</li>}
                      {totalContractValue > 100000 && <li className="text-green-600">• High-value contract</li>}
                      {yearlyData.every(d => d.margin > 10) && <li className="text-green-600">• Consistent profitability</li>}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Recommendations</h5>
                    <ul className="text-sm space-y-1">
                      {averageMargin < 10 && <li className="text-blue-600">• Review cost assumptions</li>}
                      {totalYears > 3 && <li className="text-blue-600">• Consider price protection clauses</li>}
                      <li className="text-blue-600">• Monitor market conditions</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Year-by-Year Analysis Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h5 className="font-medium text-gray-900 mb-4">Year-by-Year Analysis</h5>
                <div className="space-y-4">
                  {yearlyData.map((data) => (
                    <div key={data.year} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 text-center">
                        <div className="font-medium text-gray-900">Year {data.year}</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Revenue vs Cost</span>
                          <span className="text-sm font-medium">${data.subtotal.toLocaleString()} / ${data.totalCost.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full relative"
                            style={{ width: `${Math.min(100, (data.subtotal / Math.max(...yearlyData.map(d => d.subtotal))) * 100)}%` }}
                          >
                            <div 
                              className="bg-red-500 h-2 rounded-full absolute top-0 left-0"
                              style={{ width: `${(data.totalCost / data.subtotal) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="w-20 text-right">
                        <div className={`font-bold ${
                          data.margin >= 20 ? 'text-green-600' : 
                          data.margin >= 10 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {data.margin.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div>Contract Period: {supplyPeriodMonths} months</div>
            <div>•</div>
            <div>Total Years: {totalYears}</div>
            <div>•</div>
            <div>Current Year: {activeYear}</div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Multi-Year Pricing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};