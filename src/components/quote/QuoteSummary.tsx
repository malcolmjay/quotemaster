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
    if (lineItems.length === 0) {
      setSaveMessage('Add items to generate PDF');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Quote ${currentQuote?.quote_number || 'Draft'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 40px;
            color: #333;
            background: white;
            font-size: 13px;
            line-height: 1.5;
          }
          .page-header {
            border-bottom: 3px solid #428bca;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .company-info { flex: 1; }
          .company-name {
            font-size: 28px;
            font-weight: 700;
            color: #428bca;
            margin-bottom: 10px;
          }
          .company-details {
            font-size: 12px;
            color: #666;
            line-height: 1.6;
          }
          .quote-title {
            text-align: right;
            flex: 1;
          }
          .quote-number {
            font-size: 24px;
            font-weight: 700;
            color: #333;
            margin-bottom: 8px;
          }
          .quote-meta {
            font-size: 12px;
            color: #666;
            line-height: 1.6;
          }
          .section {
            margin: 30px 0;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #428bca;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .info-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #e8e8e8;
          }
          .info-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 13px;
            color: #333;
            font-weight: 500;
          }
          .line-items {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
          }
          .line-items thead {
            background: #428bca;
            color: white;
          }
          .line-items th {
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .line-items td {
            padding: 10px;
            border-bottom: 1px solid #e8e8e8;
          }
          .line-items tbody tr:nth-child(even) {
            background: #f8f9fa;
          }
          .line-items tbody tr:hover {
            background: #f0f7ff;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .summary {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            gap: 20px;
          }
          .summary-left {
            flex: 1;
          }
          .summary-right {
            min-width: 350px;
          }
          .cost-breakdown {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #e8e8e8;
            margin-bottom: 15px;
          }
          .cost-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 12px;
          }
          .cost-row.emphasized {
            font-weight: 600;
            font-size: 13px;
            color: #428bca;
          }
          .totals-box {
            background: linear-gradient(135deg, #428bca 0%, #5a9fd4 100%);
            color: white;
            padding: 20px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 13px;
          }
          .total-row.final {
            border-top: 2px solid rgba(255,255,255,0.3);
            margin-top: 8px;
            padding-top: 12px;
            font-weight: 700;
            font-size: 20px;
          }
          .margin-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            margin-left: 8px;
          }
          .margin-positive {
            background: #d4edda;
            color: #155724;
          }
          .margin-negative {
            background: #f8d7da;
            color: #721c24;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e8e8e8;
            text-align: center;
            font-size: 11px;
            color: #999;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
            .page-header { page-break-after: avoid; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="page-header">
          <div class="company-info">
            <div class="company-name">Quote</div>
            <div class="company-details">
              Generated: ${new Date().toLocaleString()}<br>
              Created by: ${user?.email || 'N/A'}
            </div>
          </div>
          <div class="quote-title">
            <div class="quote-number">#${currentQuote?.quote_number || 'DRAFT'}</div>
            <div class="quote-meta">
              Status: <strong>${currentQuote?.quote_status?.toUpperCase() || 'DRAFT'}</strong><br>
              Type: ${currentQuote?.quote_type || 'Daily Quote'}
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Customer Information</div>
          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">Customer Name</div>
              <div class="info-value">${selectedCustomer?.name || 'N/A'}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Customer Number</div>
              <div class="info-value">${selectedCustomer?.number || 'N/A'}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Primary Warehouse</div>
              <div class="info-value">${selectedCustomer?.primary_warehouse || 'Not set'}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Payment Terms</div>
              <div class="info-value">${selectedCustomer?.payment_terms || 'Standard'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Line Items (${totalLineItems})</div>
          <table class="line-items">
            <thead>
              <tr>
                <th style="width: 10%;">Item #</th>
                <th style="width: 15%;">SKU</th>
                <th style="width: 30%;">Description</th>
                <th style="width: 15%;">Supplier</th>
                <th class="text-right" style="width: 10%;">Qty</th>
                <th class="text-right" style="width: 10%;">Unit Price</th>
                <th class="text-right" style="width: 10%;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${lineItems.map((item, index) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>${item.sku || 'N/A'}</td>
                  <td><strong>${item.name || 'N/A'}</strong>${item.notes ? '<br><small style="color: #666;">' + item.notes + '</small>' : ''}</td>
                  <td>${item.supplier || 'N/A'}</td>
                  <td class="text-right">${item.qty?.toLocaleString() || 0}</td>
                  <td class="text-right">$${(item.price || 0).toFixed(2)}</td>
                  <td class="text-right"><strong>$${(item.subtotal || 0).toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="summary">
          <div class="summary-left">
            <div class="section-title">Cost Analysis</div>
            <div class="cost-breakdown">
              <div class="cost-row">
                <span>Total Cost</span>
                <span>$${totalCost.toFixed(2)}</span>
              </div>
              <div class="cost-row">
                <span>Carrying Cost (1.87%)</span>
                <span>$${totalCarryingCost.toFixed(2)}</span>
              </div>
              <div class="cost-row">
                <span>Freight Out (6%)</span>
                <span>$${totalFreightOut.toFixed(2)}</span>
              </div>
              <div class="cost-row emphasized" style="border-top: 2px solid #d4d4d4; margin-top: 8px; padding-top: 8px;">
                <span>Gross Profit</span>
                <span style="color: ${grossProfit >= 0 ? '#28a745' : '#dc3545'};">
                  $${grossProfit.toFixed(2)}
                  <span class="margin-badge ${grossProfit >= 0 ? 'margin-positive' : 'margin-negative'}">
                    ${totalMargin.toFixed(1)}%
                  </span>
                </span>
              </div>
            </div>
            ${currentQuote?.notes ? `
              <div style="margin-top: 15px;">
                <div class="section-title">Notes</div>
                <div class="info-box">
                  ${currentQuote.notes}
                </div>
              </div>
            ` : ''}
          </div>

          <div class="summary-right">
            <div class="totals-box">
              <div class="total-row">
                <span>Subtotal</span>
                <span>$${subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Items</span>
                <span>${totalLineItems}</span>
              </div>
              <div class="total-row final">
                <span>Total</span>
                <span>$${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="footer">
          This is a computer-generated quote. For questions, please contact your sales representative.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1024,height=768');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      setSaveMessage('Please allow popups to generate PDF');
      setTimeout(() => setSaveMessage(null), 3000);
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
