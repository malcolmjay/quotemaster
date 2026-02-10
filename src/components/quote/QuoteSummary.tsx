import React from 'react';
import { Download, AlertTriangle, X, Save, Send, DollarSign, TrendingUp, Truck, PiggyBank, FileText } from 'lucide-react';
import { ApprovalStatus } from '../approval/ApprovalStatus';
import { useSupabaseQuote } from '../../context/SupabaseQuoteContext';
import { useCustomer } from '../../context/CustomerContext';
import { useAuthContext } from '../auth/AuthProvider';
import { useApproval } from '../../hooks/useApproval';
import { QuotePrintView } from './QuotePrintView';
import { HelpTooltip } from '../common/HelpTooltip';

const round2 = (num: number): number => Math.round(num * 100) / 100;

interface QuoteSummaryProps {
  lineItems?: any[];
  onSaveSuccess?: () => void;
}

export const QuoteSummary: React.FC<QuoteSummaryProps> = ({ lineItems = [], onSaveSuccess }) => {
  const [saving, setSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [showNegativeMarginModal, setShowNegativeMarginModal] = React.useState(false);
  const [showPrintView, setShowPrintView] = React.useState(false);
  const { createNewQuote, currentQuote, updateCurrentQuote, syncLineItems, refreshQuotes } = useSupabaseQuote();
  const { selectedCustomer } = useCustomer();
  const { user } = useAuthContext();
  const { submitForApproval } = useApproval();

  const totalLineItems = lineItems.length;
  const subtotal = round2(lineItems.reduce((sum, item) => sum + item.subtotal, 0));
  const totalCost = round2(lineItems.reduce((sum, item) => sum + (item.cost * item.qty), 0));
  const totalCarryingCost = round2(totalCost * 0.0187);
  const totalFreightOut = round2(totalCost * 0.06);
  const totalMargin = subtotal > 0 ? round2(((subtotal - totalCost) / subtotal) * 100) : 0;
  const grossProfit = round2(subtotal - totalCost);
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

    setShowPrintView(true);
  };

  return (
    <div className="bg-white rounded-lg border border-[#dce0e6] shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-[#f8f9fb] border-b border-[#eef0f3]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1a1f36]">Quote Summary</h3>
              <p className="text-xs text-[#8c939d]">{totalLineItems} item{totalLineItems !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {saveMessage && (
            <div className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              saveMessage.includes('saved') || saveMessage.includes('created') || saveMessage.includes('approved') || saveMessage.includes('submitted')
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {saveMessage}
            </div>
          )}

          <div className="flex items-center gap-2">
            <HelpTooltip content="Save the quote as a draft. You can continue editing it later.">
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  saving
                    ? 'bg-[#eef0f3] text-[#8c939d] cursor-not-allowed'
                    : 'border border-[#dce0e6] text-[#5f6672] hover:text-[#1a1f36] hover:bg-[#f4f5f7]'
                }`}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </HelpTooltip>

            <HelpTooltip content="Submit the quote for approval and booking. Quotes are automatically approved if within your approval limit.">
              <button
                onClick={handleBookQuote}
                disabled={saving || !currentQuote}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  saving || !currentQuote
                    ? 'bg-[#eef0f3] text-[#8c939d] cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                }`}
              >
                <Send className="w-4 h-4" />
                {saving ? 'Booking...' : 'Book'}
              </button>
            </HelpTooltip>

            <HelpTooltip content="Generate a PDF version of the quote for printing or emailing.">
              <button
                onClick={generateQuotePDF}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a6fb5] hover:bg-[#155a94] text-white rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </HelpTooltip>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-[#f8f9fb] rounded-lg p-4 text-center border border-[#eef0f3]">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <DollarSign className="w-3.5 h-3.5 text-[#8c939d]" />
              <span className="text-[11px] font-semibold text-[#8c939d] uppercase tracking-wider">Cost</span>
            </div>
            <div className="text-lg font-bold text-[#1a1f36] tabular-nums">
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-100">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <PiggyBank className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Carrying</span>
            </div>
            <div className="text-lg font-bold text-amber-800 tabular-nums">
              ${totalCarryingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-sky-50 rounded-lg p-4 text-center border border-sky-100">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Truck className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider">Freight</span>
            </div>
            <div className="text-lg font-bold text-sky-800 tabular-nums">
              ${totalFreightOut.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-[#e8f0fe] rounded-lg p-4 text-center border border-[#c4d9f2]">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-[#1a6fb5]" />
              <span className="text-[11px] font-semibold text-[#1a6fb5] uppercase tracking-wider">Total</span>
            </div>
            <div className="text-lg font-bold text-[#0d3f6e] tabular-nums">
              ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className={`rounded-lg p-4 text-center border ${
            grossProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
          }`}>
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <TrendingUp className={`w-3.5 h-3.5 ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                Profit ({totalMargin.toFixed(1)}%)
              </span>
            </div>
            <div className={`text-lg font-bold tabular-nums ${
              grossProfit >= 0 ? 'text-emerald-800' : 'text-red-800'
            }`}>
              ${grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {currentQuote && (
          <div className="mt-4 pt-4 border-t border-[#eef0f3]">
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-[#dce0e6]">
            <div className="px-5 py-4 border-b border-[#eef0f3] flex items-center justify-between bg-[#f8f9fb]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-[#1a1f36]">Negative Margin</h2>
              </div>
              <button onClick={() => setShowNegativeMarginModal(false)} className="p-1.5 hover:bg-[#eef0f3] rounded-md transition-colors">
                <X className="w-5 h-5 text-[#8c939d]" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-[#5f6672]">
                This quote has a negative gross margin and cannot be booked. Please review the pricing.
              </p>

              <div className="bg-[#f8f9fb] rounded-lg p-4 space-y-2.5 border border-[#eef0f3]">
                <div className="flex justify-between text-sm">
                  <span className="text-[#5f6672]">Quote Total</span>
                  <span className="font-medium text-[#1a1f36] tabular-nums">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#5f6672]">Total Cost</span>
                  <span className="font-medium text-[#1a1f36] tabular-nums">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm pt-2.5 border-t border-[#dce0e6]">
                  <span className="text-red-700 font-semibold">Gross Profit</span>
                  <span className="text-red-700 font-bold tabular-nums">${grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button
                onClick={() => setShowNegativeMarginModal(false)}
                className="w-full px-4 py-2.5 bg-[#1a6fb5] hover:bg-[#155a94] text-white rounded-md font-medium transition-colors"
              >
                Review Pricing
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrintView && selectedCustomer && (
        <QuotePrintView
          quote={currentQuote}
          customer={selectedCustomer}
          lineItems={lineItems}
          user={user}
          onClose={() => setShowPrintView(false)}
        />
      )}
    </div>
  );
};
