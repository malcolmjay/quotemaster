import React from 'react';
import { Download, AlertTriangle, X, Save, Send, DollarSign, TrendingUp, Truck, PiggyBank, FileText } from 'lucide-react';
import { ApprovalStatus } from '../approval/ApprovalStatus';
import { useSupabaseQuote } from '../../context/SupabaseQuoteContext';
import { useCustomer } from '../../context/CustomerContext';
import { useAuthContext } from '../auth/AuthProvider';
import { useApproval } from '../../hooks/useApproval';

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
  const totalCarryingCost = totalCost * 0.0187;
  const totalFreightOut = totalCost * 0.06;
  const totalMargin = subtotal > 0 ? ((subtotal - totalCost) / subtotal) * 100 : 0;
  const grossProfit = subtotal - totalCost;
  const total = subtotal;

  const [approvalRefreshKey, setApprovalRefreshKey] = React.useState(0);

  const handleSaveDraft = async () => {
    if (!selectedCustomer) {
      setSaveMessage('Please select a customer');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    if (!user) {
      setSaveMessage('Not authenticated');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    if (lineItems.length === 0) {
      setSaveMessage('Add at least one line item');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    try {
      setSaving(true);
      setSaveMessage(null);

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

      if (currentQuote) {
        await updateCurrentQuote(quoteData);
        await syncLineItems(lineItems, currentQuote.id);
        setSaveMessage(`Quote ${currentQuote.quote_number} saved`);

        // If quote is already approved, trigger export
        if (currentQuote.quote_status === 'approved') {
          import('../../services/quoteExportService').then(({ quoteExportService }) => {
            quoteExportService.exportQuote(currentQuote.id).catch(error => {
              console.error('Failed to export updated approved quote:', error);
            });
          });
        }
      } else {
        const newQuote = await createNewQuote(quoteData);
        await syncLineItems(lineItems, newQuote.id);
        setSaveMessage(`Quote ${newQuote.quote_number} created`);
      }

      if (onSaveSuccess) onSaveSuccess();
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (error) {
      console.error('Error saving quote:', error);
      setSaveMessage(error instanceof Error ? error.message : 'Save failed');
      setTimeout(() => setSaveMessage(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleBookQuote = async () => {
    if (!selectedCustomer) {
      setSaveMessage('Please select a customer');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    if (!user) {
      setSaveMessage('Not authenticated');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    if (lineItems.length === 0) {
      setSaveMessage('Add at least one line item');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    if (grossProfit < 0) {
      setShowNegativeMarginModal(true);
      return;
    }

    try {
      setSaving(true);
      setSaveMessage(null);

      let quoteId: string;

      if (!currentQuote) {
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
        await syncLineItems(lineItems, newQuote.id);
        quoteId = newQuote.id;
      } else {
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
        await syncLineItems(lineItems, currentQuote.id);
        quoteId = currentQuote.id;
      }

      const result = await submitForApproval(quoteId);

      if (result.autoApproved) {
        setSaveMessage('Quote approved and booked');
      } else {
        setSaveMessage('Quote submitted for approval');
      }

      sessionStorage.setItem('focusQuoteId', quoteId);
      await refreshQuotes();

      if (onSaveSuccess) onSaveSuccess();
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (error) {
      console.error('Error booking quote:', error);
      setSaveMessage(error instanceof Error ? error.message : 'Booking failed');
      setTimeout(() => setSaveMessage(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const generateQuotePDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quote - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #333; }
          .header { border-bottom: 2px solid #428bca; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: 700; color: #333; }
          .quote-info { color: #666; font-size: 14px; margin-top: 8px; }
          .line-items { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 13px; }
          .line-items th { background: #f0f0f0; padding: 12px 16px; text-align: left; border-bottom: 2px solid #d4d4d4; font-weight: 600; color: #333; }
          .line-items td { padding: 12px 16px; border-bottom: 1px solid #e8e8e8; }
          .line-items tr:hover { background: #f5f5f5; }
          .text-right { text-align: right; }
          .totals { margin-top: 24px; display: flex; justify-content: flex-end; }
          .totals-box { background: #f0f0f0; padding: 20px; border-radius: 4px; min-width: 280px; border: 1px solid #d4d4d4; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .total-row.final { border-top: 2px solid #d4d4d4; margin-top: 8px; padding-top: 16px; font-weight: 700; font-size: 18px; color: #428bca; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Quote ${currentQuote?.quote_number || ''}</div>
          <div class="quote-info">
            Customer: ${selectedCustomer?.name || 'N/A'}<br>
            Date: ${new Date().toLocaleDateString()}<br>
            Items: ${totalLineItems}
          </div>
        </div>

        <table class="line-items">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Description</th>
              <th>Supplier</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems.map(item => `
              <tr>
                <td>${item.sku}</td>
                <td>${item.name}</td>
                <td>${item.supplier}</td>
                <td class="text-right">${item.qty}</td>
                <td class="text-right">$${item.price.toFixed(2)}</td>
                <td class="text-right">$${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-box">
            <div class="total-row">
              <span>Subtotal</span>
              <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row final">
              <span>Total</span>
              <span>$${total.toFixed(2)}</span>
            </div>
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
      setTimeout(() => printWindow.print(), 250);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded border border-[#d4d4d4] dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-[#f0f0f0] dark:bg-slate-800 border-b border-[#d4d4d4] dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#dff0d8] flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#3c763d]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#333] dark:text-white">Quote Summary</h3>
              <p className="text-xs text-[#666] dark:text-slate-400">{totalLineItems} items</p>
            </div>
          </div>

          {saveMessage && (
            <div className={`px-3 py-1.5 rounded text-sm font-medium ${
              saveMessage.includes('saved') || saveMessage.includes('created') || saveMessage.includes('approved') || saveMessage.includes('submitted')
                ? 'bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6]'
                : 'bg-[#f2dede] text-[#a94442] border border-[#ebccd1]'
            }`}>
              {saveMessage}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                saving
                  ? 'bg-[#e8e8e8] text-[#999] cursor-not-allowed'
                  : 'border border-[#d4d4d4] text-[#333] hover:bg-[#f0f0f0] dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>

            <button
              onClick={handleBookQuote}
              disabled={saving || !currentQuote}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                saving || !currentQuote
                  ? 'bg-[#e8e8e8] text-[#999] cursor-not-allowed'
                  : 'bg-[#5cb85c] text-white hover:bg-[#449d44]'
              }`}
            >
              <Send className="w-4 h-4" />
              {saving ? 'Booking...' : 'Book'}
            </button>

            <button
              onClick={generateQuotePDF}
              className="flex items-center gap-2 px-4 py-2 bg-[#428bca] hover:bg-[#3276b1] text-white rounded text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-[#f5f5f5] dark:bg-slate-700/50 rounded p-4 text-center border border-[#e8e8e8] dark:border-slate-600">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-[#666]" />
              <span className="text-xs font-medium text-[#666] dark:text-slate-400">Cost</span>
            </div>
            <div className="text-lg font-bold text-[#333] dark:text-white">
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-[#fcf8e3] dark:bg-amber-900/20 rounded p-4 text-center border border-[#faebcc] dark:border-amber-800">
            <div className="flex items-center justify-center gap-2 mb-2">
              <PiggyBank className="w-4 h-4 text-[#8a6d3b]" />
              <span className="text-xs font-medium text-[#8a6d3b] dark:text-amber-400">Carrying</span>
            </div>
            <div className="text-lg font-bold text-[#8a6d3b] dark:text-amber-300">
              ${totalCarryingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-[#d9edf7] dark:bg-sky-900/20 rounded p-4 text-center border border-[#bce8f1] dark:border-sky-800">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-[#31708f]" />
              <span className="text-xs font-medium text-[#31708f] dark:text-sky-400">Freight</span>
            </div>
            <div className="text-lg font-bold text-[#31708f] dark:text-sky-300">
              ${totalFreightOut.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-[#d9edf7] dark:bg-blue-900/20 rounded p-4 text-center border border-[#bce8f1] dark:border-blue-800">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-[#428bca]" />
              <span className="text-xs font-medium text-[#428bca] dark:text-blue-400">Total</span>
            </div>
            <div className="text-lg font-bold text-[#428bca] dark:text-blue-300">
              ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className={`rounded p-4 text-center border ${
            grossProfit >= 0 ? 'bg-[#dff0d8] border-[#d6e9c6] dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-[#f2dede] border-[#ebccd1] dark:bg-red-900/20 dark:border-red-800'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className={`w-4 h-4 ${grossProfit >= 0 ? 'text-[#3c763d]' : 'text-[#a94442]'}`} />
              <span className={`text-xs font-medium ${
                grossProfit >= 0 ? 'text-[#3c763d] dark:text-emerald-400' : 'text-[#a94442] dark:text-red-400'
              }`}>
                Profit ({totalMargin.toFixed(1)}%)
              </span>
            </div>
            <div className={`text-lg font-bold ${
              grossProfit >= 0 ? 'text-[#3c763d] dark:text-emerald-300' : 'text-[#a94442] dark:text-red-300'
            }`}>
              ${grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {currentQuote && (
          <div className="mt-4 pt-4 border-t border-[#d4d4d4] dark:border-slate-700">
            <ApprovalStatus
              quoteId={currentQuote.id}
              quoteValue={total}
              quoteStatus={currentQuote.quote_status}
              onApprovalChange={() => {
                setApprovalRefreshKey(prev => prev + 1);
                window.location.reload();
              }}
            />
          </div>
        )}
      </div>

      {showNegativeMarginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded shadow-xl max-w-md w-full mx-4 overflow-hidden border border-[#d4d4d4] dark:border-slate-700">
            <div className="px-5 py-4 border-b border-[#d4d4d4] dark:border-slate-700 flex items-center justify-between bg-[#f0f0f0] dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f2dede] rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#a94442]" />
                </div>
                <h2 className="text-lg font-semibold text-[#333] dark:text-white">Negative Margin</h2>
              </div>
              <button onClick={() => setShowNegativeMarginModal(false)} className="p-1 hover:bg-[#e8e8e8] dark:hover:bg-slate-700 rounded">
                <X className="w-5 h-5 text-[#666]" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-[#666] dark:text-slate-300">
                This quote has a negative gross margin and cannot be booked. Please review the pricing.
              </p>

              <div className="bg-[#f5f5f5] dark:bg-slate-700/50 rounded p-4 space-y-2 border border-[#e8e8e8] dark:border-slate-600">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Quote Total</span>
                  <span className="font-medium text-[#333] dark:text-white">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Total Cost</span>
                  <span className="font-medium text-[#333] dark:text-white">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[#d4d4d4] dark:border-slate-600">
                  <span className="text-[#a94442] font-medium">Gross Profit</span>
                  <span className="text-[#a94442] font-bold">${grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button
                onClick={() => setShowNegativeMarginModal(false)}
                className="w-full px-4 py-2.5 bg-[#428bca] hover:bg-[#3276b1] text-white rounded font-medium transition-colors"
              >
                Review Pricing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
