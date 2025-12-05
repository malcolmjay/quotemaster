import React, { useEffect, useState } from 'react';
import { X, Calendar, DollarSign, TrendingUp, TrendingDown, User, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface HistoryModalProps {
  item: any;
  currentQuoteId?: string;
  customerId?: string;
  onClose: () => void;
}

interface HistoricalQuote {
  id: string;
  date: string;
  customer: string;
  requestingUser: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  margin: number;
  leadTime: string;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ item, currentQuoteId, customerId, onClose }) => {
  const [historicalQuotes, setHistoricalQuotes] = useState<HistoricalQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistoricalQuotes();
  }, [item?.sku, customerId]);

  const fetchHistoricalQuotes = async () => {
    if (!item?.sku) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const query = supabase
        .from('quote_line_items')
        .select(`
          id,
          quantity,
          unit_price,
          subtotal,
          margin_percent,
          quoted_lead_time,
          created_at,
          quotes!inner (
            id,
            quote_number,
            status,
            created_at,
            customers!inner (
              id,
              name
            )
          )
        `)
        .eq('sku', item.sku)
        .order('created_at', { ascending: false });

      if (currentQuoteId) {
        query.neq('quote_id', currentQuoteId);
      }

      if (customerId) {
        query.eq('quotes.customer_id', customerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedQuotes: HistoricalQuote[] = (data || []).map((lineItem: any) => {
        const rawStatus = lineItem.quotes.status || 'Unknown';
        return {
          id: lineItem.quotes.quote_number || `Q-${lineItem.quotes.id.substring(0, 8)}`,
          date: new Date(lineItem.created_at).toISOString().split('T')[0],
          customer: lineItem.quotes.customers?.name || 'Unknown',
          requestingUser: '',
          quantity: lineItem.quantity || 0,
          unitPrice: parseFloat(lineItem.unit_price) || 0,
          totalPrice: parseFloat(lineItem.subtotal) || 0,
          status: rawStatus,
          margin: parseFloat(lineItem.margin_percent) || 0,
          leadTime: lineItem.quoted_lead_time || 'N/A'
        };
      });

      setHistoricalQuotes(formattedQuotes);
    } catch (error) {
      console.error('Error fetching historical quotes:', error);
      setHistoricalQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const mockHistoricalQuotes = [
    {
      id: 'Q-2024-045',
      date: '2024-12-20',
      customer: 'Department of Defense - Pentagon',
      requestingUser: 'Colonel Johnson',
      quantity: 2,
      unitPrice: 3600,
      totalPrice: 7200,
      status: 'Won',
      margin: 18.5,
      leadTime: '12 days',
      notes: 'Urgent requirement for network upgrade project'
    },
    {
      id: 'Q-2024-032',
      date: '2024-10-15',
      customer: 'Department of Defense - Pentagon',
      requestingUser: 'Major Smith',
      quantity: 5,
      unitPrice: 3450,
      totalPrice: 17250,
      status: 'Lost',
      margin: 15.2,
      leadTime: '10 days',
      notes: 'Lost to competitor - price was too high'
    },
    {
      id: 'Q-2024-018',
      date: '2024-08-03',
      customer: 'Department of Defense - Pentagon',
      requestingUser: 'Colonel Johnson',
      quantity: 1,
      unitPrice: 3500,
      totalPrice: 3500,
      status: 'Won',
      margin: 22.1,
      leadTime: '8 days',
      notes: 'Standard procurement - no issues'
    },
    {
      id: 'Q-2024-007',
      date: '2024-05-12',
      customer: 'US Air Force - Pentagon',
      requestingUser: 'Captain Williams',
      quantity: 3,
      unitPrice: 3400,
      totalPrice: 10200,
      status: 'Won',
      margin: 19.8,
      leadTime: '14 days',
      notes: 'Part of larger infrastructure refresh'
    },
    {
      id: 'Q-2023-089',
      date: '2023-11-28',
      customer: 'Department of Defense - Pentagon',
      requestingUser: 'Colonel Johnson',
      quantity: 4,
      unitPrice: 3300,
      totalPrice: 13200,
      status: 'Won',
      margin: 25.3,
      leadTime: '10 days',
      notes: 'Year-end budget utilization'
    }
  ];

  const normalizeStatus = (status: string): string => {
    const lowerStatus = status?.toLowerCase() || '';
    if (lowerStatus === 'won' || lowerStatus === 'closed_won') return 'Won';
    if (lowerStatus === 'lost' || lowerStatus === 'closed_lost') return 'Lost';
    if (lowerStatus === 'pending' || lowerStatus === 'pending_approval') return 'Pending';
    if (lowerStatus === 'draft') return 'Draft';
    if (lowerStatus === 'submitted') return 'Submitted';
    if (lowerStatus === 'expired') return 'Expired';
    return status || 'Unknown';
  };

  const statusColors = {
    'Won': 'bg-green-100 text-green-800',
    'Lost': 'bg-red-100 text-red-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Draft': 'bg-gray-100 text-gray-800',
    'Submitted': 'bg-blue-100 text-blue-800',
    'Expired': 'bg-gray-100 text-gray-800'
  };

  const displayQuotes = loading ? [] : historicalQuotes;
  const totalQuotes = displayQuotes.length;
  const wonQuotes = displayQuotes.filter(q => {
    const normalized = normalizeStatus(q.status);
    return normalized === 'Won';
  }).length;
  const lostQuotes = displayQuotes.filter(q => {
    const normalized = normalizeStatus(q.status);
    return normalized === 'Lost';
  }).length;
  const winRate = totalQuotes > 0 ? (wonQuotes / totalQuotes * 100).toFixed(1) : '0';
  const averagePrice = totalQuotes > 0 ? displayQuotes.reduce((sum, q) => sum + q.unitPrice, 0) / totalQuotes : 0;
  const averageMargin = totalQuotes > 0 ? displayQuotes.reduce((sum, q) => sum + q.margin, 0) / totalQuotes : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Quote History</h3>
            <p className="text-sm text-gray-600 mt-1">
              Historical quotes for {item?.sku} - {item?.name}
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
            <div className="flex items-center space-x-3 mb-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Current Quote Line</span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700">SKU:</span>
                <div className="font-semibold text-blue-900">{item?.sku}</div>
              </div>
              <div>
                <span className="text-blue-700">Quantity:</span>
                <div className="font-semibold text-blue-900">{item?.qty} units</div>
              </div>
              <div>
                <span className="text-blue-700">Current Price:</span>
                <div className="font-semibold text-blue-900">${item?.price?.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-blue-700">Status:</span>
                <div className="font-semibold text-blue-900">{item?.status}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-700 font-medium">Total Quotes</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalQuotes}</div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-700 font-medium">Win Rate</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{winRate}%</div>
              <div className="text-xs text-green-700">{wonQuotes} won, {lostQuotes} lost</div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">Avg Price</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">${averagePrice.toLocaleString()}</div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-purple-700 font-medium">Avg Margin</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{averageMargin.toFixed(1)}%</div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Historical Quote Details</h4>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                        Loading historical quotes...
                      </td>
                    </tr>
                  ) : displayQuotes.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                        No historical quotes found for this product
                      </td>
                    </tr>
                  ) : (
                    displayQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{quote.id}</div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {quote.date}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{quote.customer}</div>
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-3 w-3 mr-1" />
                            {quote.requestingUser}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                        {quote.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                        ${quote.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                        ${quote.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`font-medium ${
                          quote.margin >= 20 ? 'text-green-600' : 
                          quote.margin >= 10 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {quote.margin}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {quote.leadTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[normalizeStatus(quote.status) as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {normalizeStatus(quote.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {quote.requestingUser || '-'}
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-end">
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