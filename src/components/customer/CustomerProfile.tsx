import React, { useState } from 'react';
import { Building, Award, TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { Chart } from './Chart';
import { useQuote } from '../../context/QuoteContext';
import { useCustomer } from '../../context/CustomerContext';

export const CustomerProfile: React.FC = () => {
  const [timeRange, setTimeRange] = useState('12');
  const { quotes } = useQuote();
  const { selectedCustomer } = useCustomer();

  // Filter quotes for selected customer
  const customerQuotes = quotes.filter(quote => quote.customerId === selectedCustomer?.id);
  
  // Calculate dynamic metrics
  const calculateMetrics = () => {
    if (customerQuotes.length === 0) {
      return {
        averageMargin: 0,
        wonMargin: 0,
        lostMargin: 0,
        winRate: 0,
        totalQuoteValue: 0,
        averageQuoteValue: 0,
        totalQuotes: 0
      };
    }

    const wonQuotes = customerQuotes.filter(q => q.status === 'won');
    const lostQuotes = customerQuotes.filter(q => q.status === 'lost');
    
    const totalValue = customerQuotes.reduce((sum, quote) => sum + quote.totalValue, 0);
    const wonValue = wonQuotes.reduce((sum, quote) => sum + quote.totalValue, 0);
    const lostValue = lostQuotes.reduce((sum, quote) => sum + quote.totalValue, 0);
    
    // Calculate margins based on line items
    const calculateQuoteMargin = (quote: any) => {
      const totalCost = quote.lineItems.reduce((sum: number, item: any) => sum + (item.unitCost * item.quantity), 0);
      const totalPrice = quote.lineItems.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0);
      return totalPrice > 0 ? ((totalPrice - totalCost) / totalPrice) * 100 : 0;
    };
    
    const allMargins = customerQuotes.map(calculateQuoteMargin);
    const wonMargins = wonQuotes.map(calculateQuoteMargin);
    const lostMargins = lostQuotes.map(calculateQuoteMargin);
    
    const averageMargin = allMargins.length > 0 ? allMargins.reduce((sum, margin) => sum + margin, 0) / allMargins.length : 0;
    const wonMargin = wonMargins.length > 0 ? wonMargins.reduce((sum, margin) => sum + margin, 0) / wonMargins.length : 0;
    const lostMargin = lostMargins.length > 0 ? lostMargins.reduce((sum, margin) => sum + margin, 0) / lostMargins.length : 0;
    
    const winRate = customerQuotes.length > 0 ? (wonQuotes.length / customerQuotes.length) * 100 : 0;
    
    return {
      averageMargin: Number(averageMargin.toFixed(1)),
      wonMargin: Number(wonMargin.toFixed(1)),
      lostMargin: Number(lostMargin.toFixed(1)),
      winRate: Number(winRate.toFixed(1)),
      totalQuoteValue: totalValue,
      averageQuoteValue: customerQuotes.length > 0 ? totalValue / customerQuotes.length : 0,
      totalQuotes: customerQuotes.length
    };
  };

  const metrics = calculateMetrics();
  
  if (!selectedCustomer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Customer Selected</h3>
          <p className="text-gray-600">Please select a customer to view their profile.</p>
        </div>
      </div>
    );
  }

  const timeRanges = [
    { value: '3', label: '3 Months' },
    { value: '6', label: '6 Months' },
    { value: '12', label: '12 Months' }
  ];

  const quoteValueData = [
    { month: 'Apr 2025', won: 15000, lost: 12000, pending: 8000 },
    { month: 'Jan 2025', won: 18000, lost: 10000, pending: 15000 },
    { month: 'Jul 2025', won: 22000, lost: 8000, pending: 12000 },
    { month: 'Jun 2025', won: 16000, lost: 14000, pending: 18000 },
    { month: 'Mar 2025', won: 25000, lost: 6000, pending: 10000 },
    { month: 'May 2025', won: 20000, lost: 12000, pending: 15000 }
  ];

  const marginTrendData = [
    { month: 'Apr 2025', margin: 12.5 },
    { month: 'Jan 2025', margin: 8.2 },
    { month: 'Jul 2025', margin: 9.8 },
    { month: 'Jun 2025', margin: 7.1 },
    { month: 'Mar 2025', margin: 11.2 },
    { month: 'May 2025', margin: 13.8 }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
              <div className="flex items-center space-x-3 mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {selectedCustomer.type}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                  {selectedCustomer.segment}
                </span>
                <span className="text-sm text-gray-600">Contract: {selectedCustomer.contractNumber}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-blue-700 font-medium">Average Quote Margin</div>
                <div className="text-xl font-bold text-blue-900">{metrics.averageMargin.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-green-100 rounded-lg">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-green-700 font-medium">Won Opportunities Margin</div>
                <div className="text-xl font-bold text-green-900">{metrics.wonMargin.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-xs text-red-700 font-medium">Lost Opportunities Margin</div>
                <div className="text-xl font-bold text-red-900">{metrics.lostMargin.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-purple-100 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-xs text-purple-700 font-medium">Win Rate</div>
                <div className="text-xl font-bold text-purple-900">{metrics.winRate.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">Total Quote Value</span>
            </div>
            <div className="text-xl font-bold text-green-900">
              ${metrics.totalQuoteValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-700 font-medium">Average Quote Value</span>
            </div>
            <div className="text-xl font-bold text-blue-900">
              ${metrics.averageQuoteValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-700 font-medium">Total Quotes</span>
            </div>
            <div className="text-xl font-bold text-purple-900">{metrics.totalQuotes.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Quote Trends</h3>
              <div className="flex space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Quote Volume & Margin Trends</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Margin Analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Product Performance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Opportunity Analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Value Over Time</h3>
          <p className="text-sm text-gray-600 mb-6">Monthly quote values and win/loss breakdown</p>
          <Chart type="area" data={quoteValueData} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Volume & Margin Trends</h3>
          <p className="text-sm text-gray-600 mb-6">Number of quotes and average margins by month</p>
          <Chart type="bar" data={marginTrendData} />
        </div>
      </div>
    </div>
  );
};