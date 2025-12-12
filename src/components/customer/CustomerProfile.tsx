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
      <div className="min-h-screen bg-[#f0f0f0] p-5">
        <div className="bg-white rounded border border-[#d4d4d4] p-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Building className="h-12 w-12 text-[#999] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#333] mb-2">No Customer Selected</h3>
              <p className="text-[#666]">Please select a customer to view their profile.</p>
            </div>
          </div>
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
    <div className="min-h-screen bg-[#f0f0f0]">
      <div className="bg-white border-b border-[#d4d4d4] sticky top-0 z-40">
        <div className="px-5 py-3">
          <div className="text-xs text-[#999] mb-2">
            Sales / Customer Profile
          </div>
          <h1 className="text-xl font-normal text-[#333]">
            Customer Profile
          </h1>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="bg-white rounded border border-[#d4d4d4] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#e8f4f8] rounded">
                <Building className="h-8 w-8 text-[#428bca]" />
              </div>
              <div>
                <h2 className="text-2xl font-normal text-[#333]">{selectedCustomer.name}</h2>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[#d9edf7] text-[#31708f] border border-[#bce8f1]">
                    {selectedCustomer.type}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6]">
                    {selectedCustomer.segment}
                  </span>
                  <span className="text-sm text-[#666]">Contract: {selectedCustomer.contractNumber}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    timeRange === range.value
                      ? 'bg-[#428bca] text-white'
                      : 'bg-[#f5f5f5] text-[#666] hover:bg-[#e8e8e8] border border-[#d4d4d4]'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#d9edf7] border border-[#bce8f1] p-4 rounded">
              <div className="flex items-center space-x-3">
                <div className="p-1 bg-[#c4e3f3] rounded">
                  <TrendingUp className="h-5 w-5 text-[#31708f]" />
                </div>
                <div>
                  <div className="text-xs text-[#31708f] font-medium">Average Quote Margin</div>
                  <div className="text-xl font-semibold text-[#31708f]">{metrics.averageMargin.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            <div className="bg-[#dff0d8] border border-[#d6e9c6] p-4 rounded">
              <div className="flex items-center space-x-3">
                <div className="p-1 bg-[#d0e9c6] rounded">
                  <Award className="h-5 w-5 text-[#3c763d]" />
                </div>
                <div>
                  <div className="text-xs text-[#3c763d] font-medium">Won Opportunities Margin</div>
                  <div className="text-xl font-semibold text-[#3c763d]">{metrics.wonMargin.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            <div className="bg-[#f2dede] border border-[#ebccd1] p-4 rounded">
              <div className="flex items-center space-x-3">
                <div className="p-1 bg-[#ebcccc] rounded">
                  <TrendingDown className="h-5 w-5 text-[#a94442]" />
                </div>
                <div>
                  <div className="text-xs text-[#a94442] font-medium">Lost Opportunities Margin</div>
                  <div className="text-xl font-semibold text-[#a94442]">{metrics.lostMargin.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            <div className="bg-[#fcf8e3] border border-[#faebcc] p-4 rounded">
              <div className="flex items-center space-x-3">
                <div className="p-1 bg-[#faf2cc] rounded">
                  <Award className="h-5 w-5 text-[#8a6d3b]" />
                </div>
                <div>
                  <div className="text-xs text-[#8a6d3b] font-medium">Win Rate</div>
                  <div className="text-xl font-semibold text-[#8a6d3b]">{metrics.winRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-[#dff0d8] border border-[#d6e9c6] p-4 rounded text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-[#3c763d]" />
                <span className="text-xs text-[#3c763d] font-medium">Total Quote Value</span>
              </div>
              <div className="text-xl font-semibold text-[#3c763d]">
                ${metrics.totalQuoteValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-[#d9edf7] border border-[#bce8f1] p-4 rounded text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <BarChart3 className="h-4 w-4 text-[#31708f]" />
                <span className="text-xs text-[#31708f] font-medium">Average Quote Value</span>
              </div>
              <div className="text-xl font-semibold text-[#31708f]">
                ${metrics.averageQuoteValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-[#fcf8e3] border border-[#faebcc] p-4 rounded text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Calendar className="h-4 w-4 text-[#8a6d3b]" />
                <span className="text-xs text-[#8a6d3b] font-medium">Total Quotes</span>
              </div>
              <div className="text-xl font-semibold text-[#8a6d3b]">{metrics.totalQuotes.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded border border-[#d4d4d4] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-[#333]">Quote Trends</h3>
            <div className="flex space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#428bca] rounded-full"></div>
                <span className="text-[#666]">Quote Volume & Margin Trends</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#5cb85c] rounded-full"></div>
                <span className="text-[#666]">Margin Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#f0ad4e] rounded-full"></div>
                <span className="text-[#666]">Product Performance</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#d9534f] rounded-full"></div>
                <span className="text-[#666]">Opportunity Analysis</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded border border-[#d4d4d4] p-6">
            <h3 className="text-lg font-medium text-[#333] mb-2">Quote Value Over Time</h3>
            <p className="text-sm text-[#666] mb-6">Monthly quote values and win/loss breakdown</p>
            <Chart type="area" data={quoteValueData} />
          </div>

          <div className="bg-white rounded border border-[#d4d4d4] p-6">
            <h3 className="text-lg font-medium text-[#333] mb-2">Quote Volume & Margin Trends</h3>
            <p className="text-sm text-[#666] mb-6">Number of quotes and average margins by month</p>
            <Chart type="bar" data={marginTrendData} />
          </div>
        </div>
      </div>
    </div>
  );
};