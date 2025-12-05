import React from 'react';
import { FileText, Download, AlertTriangle, X } from 'lucide-react';
import { ApprovalStatus } from '../approval/ApprovalStatus';
import { useSupabaseQuote } from '../../context/SupabaseQuoteContext';
import { useCustomer } from '../../context/CustomerContext';
import { useAuthContext } from '../auth/AuthProvider';
import { useApproval } from '../../hooks/useApproval';
import { createLineItem } from '../../lib/supabase';

interface QuoteSummaryProps {
  lineItems?: any[];
  onSaveSuccess?: () => void;
}

export const QuoteSummary: React.FC<QuoteSummaryProps> = ({ lineItems = [], onSaveSuccess }) => {
  const [saving, setSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [showNegativeMarginModal, setShowNegativeMarginModal] = React.useState(false);
  const { createNewQuote, currentQuote, updateCurrentQuote, syncLineItems, refreshQuotes } = useSupabaseQuote();
  const { selectedCustomer } = useCustomer();
  const { user } = useAuthContext();
  const { submitForApproval } = useApproval();

  const totalLineItems = lineItems.length;
  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalCost = lineItems.reduce((sum, item) => sum + (item.cost * item.qty), 0);
  const totalCarryingCost = totalCost * 0.0187; // 1.87% of Total Cost
  const totalFreightOut = totalCost * 0.06; // 6% of Total Cost
  const totalMargin = subtotal > 0 ? ((subtotal - totalCost) / subtotal) * 100 : 0;
  const total = subtotal;
  
  const [approvalRefreshKey, setApprovalRefreshKey] = React.useState(0);
  
  const handleSaveDraft = async () => {
    console.log('=== SAVE DRAFT DEBUG START ===');
    console.log('Selected customer:', selectedCustomer);
    console.log('Current user:', user);
    console.log('Line items to save:', lineItems);
    console.log('Current quote:', currentQuote);

    if (!selectedCustomer) {
      setSaveMessage('Please select a customer before saving');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    if (!user) {
      setSaveMessage('User not authenticated');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    if (lineItems.length === 0) {
      setSaveMessage('Please add at least one line item before saving');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    try {
      setSaving(true);
      setSaveMessage(null);
      console.log('Starting save process...');

      const quoteData = {
        customer_id: selectedCustomer.id,
        customer_user_id: null,
        quote_type: 'Daily Quote' as const,
        status: 'draft' as const,
        valid_until: null,
        ship_until: null,
        customer_bid_number: null,
        purchase_order_number: null,
        total_value: total,
        total_cost: totalCost,
        total_margin: totalMargin,
        line_item_count: totalLineItems,
        created_by: user.id,
        dbe_required: false,
        bid_bond_required: false,
        performance_bond_required: false,
        insurance_required: false,
        quote_status: 'draft' as const
      };

      console.log('Quote data prepared:', quoteData);

      if (currentQuote) {
        console.log('Updating existing quote:', currentQuote.id);
        await updateCurrentQuote(quoteData);
        console.log('Quote updated successfully');

        await syncLineItems(lineItems, currentQuote.id);

        setSaveMessage(`Quote ${currentQuote.quote_number} updated successfully`);
      } else {
        console.log('Creating new quote...');
        const newQuote = await createNewQuote(quoteData);
        console.log('New quote created:', newQuote);

        await syncLineItems(lineItems, newQuote.id);

        setSaveMessage(`Quote ${newQuote.quote_number} saved as draft`);
      }

      if (onSaveSuccess) {
        onSaveSuccess();
      }

      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error) {
      console.error('❌ CRITICAL ERROR saving quote:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      setSaveMessage(error instanceof Error ? error.message : 'Failed to save quote');
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setSaving(false);
      console.log('=== SAVE DRAFT DEBUG END ===');
    }
  };

  const handleBookQuote = async () => {
    console.log('=== BOOK QUOTE DEBUG START ===');
    console.log('Selected customer:', selectedCustomer);
    console.log('Current user:', user);
    console.log('Line items:', lineItems);
    console.log('Current quote:', currentQuote);

    if (!selectedCustomer) {
      setSaveMessage('Please select a customer before booking');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    if (!user) {
      setSaveMessage('User not authenticated');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    if (lineItems.length === 0) {
      setSaveMessage('Please add at least one line item before booking');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    // Check if gross profit is negative
    const grossProfit = subtotal - totalCost;
    if (grossProfit < 0) {
      setShowNegativeMarginModal(true);
      return;
    }

    try {
      setSaving(true);
      setSaveMessage(null);

      let quoteId: string;

      if (!currentQuote) {
        console.log('No current quote - creating new quote before booking...');

        const quoteData = {
          customer_id: selectedCustomer.id,
          customer_user_id: null,
          quote_type: 'Daily Quote' as const,
          status: 'draft' as const,
          valid_until: null,
          ship_until: null,
          customer_bid_number: null,
          purchase_order_number: null,
          total_value: total,
          total_cost: totalCost,
          total_margin: totalMargin,
          line_item_count: totalLineItems,
          created_by: user.id,
          dbe_required: false,
          bid_bond_required: false,
          performance_bond_required: false,
          insurance_required: false,
          quote_status: 'draft' as const
        };

        const newQuote = await createNewQuote(quoteData);
        console.log('New quote created:', newQuote);

        await syncLineItems(lineItems, newQuote.id);
        console.log('Line items synced');

        quoteId = newQuote.id;
      } else {
        console.log('Updating existing quote before booking...');

        const quoteData = {
          customer_id: selectedCustomer.id,
          customer_user_id: null,
          quote_type: currentQuote.quote_type,
          status: currentQuote.status,
          valid_until: currentQuote.valid_until,
          ship_until: currentQuote.ship_until,
          customer_bid_number: currentQuote.customer_bid_number,
          purchase_order_number: currentQuote.purchase_order_number,
          total_value: total,
          total_cost: totalCost,
          total_margin: totalMargin,
          line_item_count: totalLineItems,
          dbe_required: currentQuote.dbe_required,
          bid_bond_required: currentQuote.bid_bond_required,
          performance_bond_required: currentQuote.performance_bond_required,
          insurance_required: currentQuote.insurance_required
        };

        await updateCurrentQuote(quoteData);
        console.log('Quote updated successfully');

        await syncLineItems(lineItems, currentQuote.id);
        console.log('Line items synced');

        quoteId = currentQuote.id;
      }

      console.log('Starting book process for quote:', quoteId);

      const result = await submitForApproval(quoteId);

      if (result.autoApproved) {
        setSaveMessage('Quote automatically approved and booked');
      } else {
        setSaveMessage('Quote booked and submitted for approval');
      }

      sessionStorage.setItem('focusQuoteId', quoteId);
      await refreshQuotes();

      if (onSaveSuccess) {
        onSaveSuccess();
      }

      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error) {
      console.error('❌ ERROR booking quote:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      setSaveMessage(error instanceof Error ? error.message : 'Failed to book quote');
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setSaving(false);
      console.log('=== BOOK QUOTE DEBUG END ===');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[280px]">
      {/* Minimized Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quote Summary</h3>
          <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">{totalLineItems} items</span>
            <span className={`font-semibold ${
              totalMargin >= 20 ? 'text-green-600' :
              totalMargin >= 10 ? 'text-gray-600' : 'text-red-600'
            }`}>
              {totalMargin.toFixed(1)}% margin
            </span>
          </div>
        </div>
      </div>

      {/* Compact Summary */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-5 gap-10 text-center">
          <div className="flex flex-col items-center">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3 whitespace-nowrap">Total Cost</div>
            <div className="text-base font-bold text-gray-900 dark:text-white whitespace-nowrap">
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3 whitespace-nowrap">Total Carrying Cost</div>
            <div className="text-base font-bold text-orange-600 whitespace-nowrap">
              ${totalCarryingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3 whitespace-nowrap">Total Freight Out</div>
            <div className="text-base font-bold text-purple-600 whitespace-nowrap">
              ${totalFreightOut.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3 whitespace-nowrap">Quote Total</div>
            <div className="text-base font-bold text-blue-600 whitespace-nowrap">
              ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3 whitespace-nowrap">Gross Profit</div>
            <div className={`text-base font-bold whitespace-nowrap ${
              (subtotal - totalCost) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${(subtotal - totalCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        
        {/* Action Buttons - Simplified */}
        {saveMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            saveMessage.includes('successfully') || saveMessage.includes('saved') 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>
            {saveMessage}
          </div>
        )}
        
        <div className="flex justify-center space-x-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className={`px-6 py-2 border border-gray-300 rounded transition-colors text-sm font-medium ${
              saving
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleBookQuote}
            disabled={saving || !currentQuote}
            className={`px-6 py-2 rounded transition-colors text-sm font-medium ${
              saving || !currentQuote
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {saving ? 'Booking...' : 'Book'}
          </button>
          <button 
            onClick={() => {
              const generateQuotePDF = () => {
                const htmlContent = `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Quote - ${new Date().toLocaleDateString()}</title>
                    <style>
                      body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
                      .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
                      .company-name { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
                      .quote-title { font-size: 22px; color: #374151; }
                      .line-items { width: 100%; border-collapse: collapse; margin: 30px 0; }
                      .line-items th { background-color: #f3f4f6; padding: 12px; text-align: left; border: 1px solid #d1d5db; font-weight: bold; color: #374151; }
                      .line-items td { padding: 10px 12px; border: 1px solid #d1d5db; }
                      .line-items tr:nth-child(even) { background-color: #f9fafb; }
                      .totals { margin-top: 30px; text-align: right; }
                      .total-final { font-size: 20px; font-weight: bold; color: #2563eb; border-top: 2px solid #2563eb; padding-top: 10px; margin-top: 15px; }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <div class="company-name">QuoteMaster Pro</div>
                      <div class="quote-title">Professional Quote</div>
                    </div>
                    
                    <table class="line-items">
                      <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Product Name</th>
                          <th>Supplier</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${lineItems.map(item => `
                          <tr>
                            <td>${item.sku}</td>
                            <td>${item.name}</td>
                            <td>${item.supplier}</td>
                            <td>${item.qty}</td>
                            <td>$${item.price.toFixed(2)}</td>
                            <td>$${item.subtotal.toFixed(2)}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                    
                    <div class="totals">
                      <div class="total-final">
                        <strong>Total: $${total.toFixed(2)}</strong>
                      </div>
                    </div>
                  </body>
                  </html>
                `;
                
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(htmlContent);
                  printWindow.document.close();
                  printWindow.focus();
                  setTimeout(() => {
                    printWindow.print();
                  }, 250);
                }
              };
              
              generateQuotePDF();
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Download className="h-4 w-4 mr-2 inline" />
            Generate PDF
          </button>
        </div>
        
        {/* Approval Status Section */}
        {currentQuote && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <ApprovalStatus
              quoteId={currentQuote.id}
              quoteValue={total}
              quoteStatus={currentQuote.quote_status}
              onApprovalChange={() => {
               setApprovalRefreshKey(prev => prev + 1)
               // Force refresh the quote data from database
               window.location.reload()
              }}
            />
          </div>
        )}
      </div>

      {/* Negative Margin Warning Modal */}
      {showNegativeMarginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Negative Margin Warning</h2>
              </div>
              <button
                onClick={() => setShowNegativeMarginModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">
                  Cannot Book Quote
                </p>
                <p className="text-sm text-red-700">
                  The gross margin for this quote is below $0. Please review and adjust the pricing before booking.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Quote Total:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-gray-300">
                    <span className="text-gray-600">Gross Profit:</span>
                    <span className="ml-2 font-bold text-red-600">
                      ${(subtotal - totalCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowNegativeMarginModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Review Pricing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};