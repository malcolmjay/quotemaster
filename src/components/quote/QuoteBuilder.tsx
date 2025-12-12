import React, { useState } from 'react';
import { CustomerSelector } from './CustomerSelector';
import { QuoteDetails } from './QuoteDetails';
import { LineItems } from './LineItems';
import { QuoteSummary } from './QuoteSummary';
import { CostAnalysis } from './CostAnalysis';
import { MultiYearPricing } from './MultiYearPricing';
import { useSupabaseQuote } from '../../context/SupabaseQuoteContext';
import { useCustomer } from '../../context/CustomerContext';
import { supabase } from '../../lib/supabase';
import { Plus, ChevronDown, ChevronRight, FileText, Settings } from 'lucide-react';

export const QuoteBuilder: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCostAnalysis, setShowCostAnalysis] = useState(false);
  const [showMultiYearPricing, setShowMultiYearPricing] = useState(false);
  const [selectedLineItem, setSelectedLineItem] = useState(null);
  const [supplyPeriodMonths, setSupplyPeriodMonths] = useState(12);
  const [updatePriceCallback, setUpdatePriceCallback] = useState<{callback: (itemId: string, price: number) => void, itemId: string} | null>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [createdByEmail, setCreatedByEmail] = useState<string | null>(null);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(true);

  const { currentQuote, quotes, setCurrentQuote } = useSupabaseQuote();
  const { selectedCustomer, setSelectedCustomer, customers } = useCustomer();

  const handleNewQuote = () => {
    setCurrentQuote(null);
    setSelectedCustomer(null);
    setLineItems([]);
    sessionStorage.removeItem('focusQuoteId');
  };

  React.useEffect(() => {
    if (isLoadingQuote) return;

    const focusQuoteId = sessionStorage.getItem('focusQuoteId');
    if (focusQuoteId && !currentQuote) {
      sessionStorage.removeItem('focusQuoteId');

      const quoteToFocus = quotes.find(q => q.id === focusQuoteId);
      if (quoteToFocus) {
        console.log('Restoring focus to quote:', quoteToFocus.quote_number);
      }
    }

    if (currentQuote) {
      if (!selectedCustomer && currentQuote.customer_id) {
        const customer = customers.find(c => c.id === currentQuote.customer_id);
        if (customer) {
          setSelectedCustomer(customer);
        }
      }

      if (currentQuote.quote_line_items && currentQuote.quote_line_items.length > 0) {
        const transformedLineItems = currentQuote.quote_line_items.map((item: any) => ({
          id: item.id,
          sku: item.sku,
          name: item.product_name,
          supplier: item.supplier,
          category: item.category || 'General',
          qty: item.quantity,
          reserveQty: 0,
          price: item.unit_price,
          cost: item.unit_cost,
          subtotal: item.subtotal,
          stock: 50,
          available: item.next_available_date || new Date().toISOString().split('T')[0],
          status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Pending',
          leadTime: item.lead_time || '10 days',
          quotedLeadTime: item.quoted_lead_time || '',
          warehouse: 'wh-main',
          reserved: '0 / ' + item.quantity + ' units',
          shippingInstructions: item.shipping_instructions || '',
          customerPartNumber: item.customer_part_number || '',
          isReplacement: item.is_replacement || false,
          replacementType: item.replacement_type || '',
          replacementReason: item.replacement_reason || '',
          originalCustomerSku: item.original_customer_sku || '',
          originalCustomerName: item.original_customer_name || '',
          priceRequestId: item.price_request_id || null,
          cost_effective_from: item.cost_effective_from,
          cost_effective_to: item.cost_effective_to
        }));
        setLineItems(transformedLineItems);
      } else {
        setLineItems([]);
      }
    }
  }, [currentQuote, quotes, selectedCustomer, setSelectedCustomer, customers, isLoadingQuote]);

  React.useEffect(() => {
    if (currentQuote?.created_by) {
      const fetchCreatedByEmail = async () => {
        const { data, error } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('user_id', currentQuote.created_by)
          .maybeSingle();

        if (!error && data) {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user?.id === currentQuote.created_by) {
            setCreatedByEmail(userData.user.email || null);
          } else {
            setCreatedByEmail('User');
          }
        } else {
          setCreatedByEmail('User');
        }
      };
      fetchCreatedByEmail();
    } else {
      setCreatedByEmail(null);
    }
  }, [currentQuote?.created_by]);

  const handleMultiYearPricing = (lineItem: any) => {
    if (supplyPeriodMonths > 12) {
      setSelectedLineItem(lineItem);
      setShowMultiYearPricing(true);
    }
  };

  const handleSaveMultiYearPricing = (pricingData: any) => {
    setLineItems(prev => prev.map(item =>
      item.id === pricingData.lineItemId
        ? { ...item, multiYearPricing: pricingData }
        : item
    ));
    setShowMultiYearPricing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'Pending Approval';
      case 'approved': return 'Approved';
      default: return 'Draft';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {isLoadingQuote && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-2 text-sm flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          Loading quote data...
        </div>
      )}

      {/* Streamlined Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Title & Status */}
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {currentQuote ? `Quote ${currentQuote.quote_number}` : 'New Quote'}
                </h1>
                {currentQuote && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(currentQuote.quote_status)}`}>
                      {getStatusLabel(currentQuote.quote_status)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(currentQuote.created_at).toLocaleDateString()}
                      {createdByEmail && ` by ${createdByEmail}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowQuoteDetails(!showQuoteDetails)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Quote Settings</span>
                {showQuoteDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <button
                onClick={handleNewQuote}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Quote
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-4">
        {/* Collapsible Customer Selection */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowCustomerDetails(!showCustomerDetails)}
            className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                selectedCustomer ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
              }`}>
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
                </div>
                {selectedCustomer && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedCustomer.customer_number}
                    {selectedCustomer.contract_number && ` | Contract: ${selectedCustomer.contract_number}`}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedCustomer && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  selectedCustomer.tier === 'platinum' ? 'bg-slate-800 text-white' :
                  selectedCustomer.tier === 'gold' ? 'bg-amber-100 text-amber-800' :
                  selectedCustomer.tier === 'silver' ? 'bg-slate-200 text-slate-700' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {selectedCustomer.tier?.charAt(0).toUpperCase() + selectedCustomer.tier?.slice(1)}
                </span>
              )}
              {showCustomerDetails ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </button>

          {showCustomerDetails && (
            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-700">
              <div className="pt-4">
                <CustomerSelector />
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Quote Details */}
        {showQuoteDetails && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Quote Details & Settings</h3>
            </div>
            <div className="p-5">
              <QuoteDetails
                quoteStatus="draft"
                onSupplyPeriodChange={setSupplyPeriodMonths}
              />
            </div>
          </div>
        )}

        {/* Line Items - Primary Focus */}
        <LineItems
          onProductSelect={setSelectedProduct}
          onShowCostAnalysis={setShowCostAnalysis}
          onShowMultiYearPricing={handleMultiYearPricing}
          supplyPeriodMonths={supplyPeriodMonths}
          onSetUpdatePriceCallback={setUpdatePriceCallback}
          lineItems={lineItems}
          setLineItems={setLineItems}
          currentQuote={currentQuote}
          selectedCustomer={selectedCustomer}
        />

        {/* Quote Summary */}
        <QuoteSummary
          lineItems={lineItems}
          onSaveSuccess={() => {
            console.log('Quote saved successfully');
          }}
        />
      </div>

      {/* Modals */}
      {showCostAnalysis && (
        <CostAnalysis
          product={selectedProduct}
          onClose={() => setShowCostAnalysis(false)}
          onApplyPricing={updatePriceCallback?.callback}
        />
      )}

      {showMultiYearPricing && selectedLineItem && (
        <MultiYearPricing
          lineItem={selectedLineItem}
          supplyPeriodMonths={supplyPeriodMonths}
          onClose={() => setShowMultiYearPricing(false)}
          onSave={handleSaveMultiYearPricing}
        />
      )}
    </div>
  );
};
