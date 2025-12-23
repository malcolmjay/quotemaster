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
import { Plus, ChevronDown, ChevronRight, Settings } from 'lucide-react';

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
  const { selectedCustomer, setSelectedCustomer } = useCustomer();

  const handleNewQuote = () => {
    setCurrentQuote(null);
    setSelectedCustomer(null);
    setLineItems([]);
    sessionStorage.removeItem('focusQuoteId');
    localStorage.removeItem('currentQuoteId');
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
      console.log('QuoteBuilder: currentQuote loaded', currentQuote.quote_number);
      console.log('QuoteBuilder: selectedCustomer', selectedCustomer?.name || 'none');
      console.log('QuoteBuilder: customer in quote', currentQuote.customers);

      if (!selectedCustomer && currentQuote.customers) {
        console.log('QuoteBuilder: Setting customer from currentQuote');
        setSelectedCustomer(currentQuote.customers);
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
  }, [currentQuote, quotes, selectedCustomer, setSelectedCustomer, isLoadingQuote]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'bg-amber-100 text-amber-800 border border-amber-300';
      case 'approved':
        return 'bg-green-100 text-green-800 border border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300';
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
    <div className="min-h-screen bg-[#f0f0f0]">
      {isLoadingQuote && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#428bca] text-white px-4 py-2 text-sm flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          Loading quote data...
        </div>
      )}

      {/* Oro-style Header */}
      <div className="bg-white border-b border-[#d4d4d4]">
        <div className="px-5 py-3">
          {/* Breadcrumb */}
          <div className="text-xs text-[#999] mb-2">
            Sales / Quotes
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-normal text-[#333]">
                {currentQuote ? (
                  <span>Quote <span className="font-semibold">{currentQuote.quote_number}</span></span>
                ) : (
                  'New Quote'
                )}
              </h1>
              {currentQuote && (
                <span className={`px-2.5 py-1 rounded text-xs font-medium ${getStatusBadge(currentQuote.quote_status)}`}>
                  {getStatusLabel(currentQuote.quote_status)}
                </span>
              )}
              {currentQuote && (
                <span className="text-xs text-[#666]">
                  Created {new Date(currentQuote.created_at).toLocaleDateString()}
                  {createdByEmail && ` by ${createdByEmail}`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQuoteDetails(!showQuoteDetails)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded border border-transparent hover:border-[#d4d4d4] transition-colors"
              >
                <Settings className="w-4 h-4" />
                Options
                {showQuoteDetails ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleNewQuote}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#428bca] hover:bg-[#3276b1] text-white text-sm font-medium rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Quote
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 space-y-4">
        {/* Customer Selection Panel */}
        <div className="bg-white rounded border border-[#d4d4d4]">
          <button
            onClick={() => setShowCustomerDetails(!showCustomerDetails)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#fafafa] transition-colors border-b border-[#eee]"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${selectedCustomer ? 'bg-green-500' : 'bg-[#d4d4d4]'}`}></div>
              <div className="text-left">
                <div className="text-sm font-medium text-[#333]">
                  {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
                </div>
                {selectedCustomer && (
                  <div className="text-xs text-[#666]">
                    #{selectedCustomer.customer_number}
                    {selectedCustomer.contract_number && ` | Contract: ${selectedCustomer.contract_number}`}
                    {selectedCustomer.primary_warehouse && ` | Warehouse: ${selectedCustomer.primary_warehouse}`}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedCustomer?.tier && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  selectedCustomer.tier === 'platinum' ? 'bg-[#1a3a5c] text-white' :
                  selectedCustomer.tier === 'gold' ? 'bg-[#c9a227] text-white' :
                  selectedCustomer.tier === 'silver' ? 'bg-[#8d8d8d] text-white' :
                  'bg-[#428bca] text-white'
                }`}>
                  {selectedCustomer.tier.charAt(0).toUpperCase() + selectedCustomer.tier.slice(1)}
                </span>
              )}
              {showCustomerDetails ? (
                <ChevronDown className="w-4 h-4 text-[#999]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#999]" />
              )}
            </div>
          </button>

          {showCustomerDetails && (
            <div className="px-4 pb-4 pt-3">
              <CustomerSelector />
            </div>
          )}
        </div>

        {/* Quote Details Panel */}
        {showQuoteDetails && (
          <div className="bg-white rounded border border-[#d4d4d4] overflow-hidden">
            <div className="px-4 py-3 bg-[#fafafa] border-b border-[#eee]">
              <h3 className="text-sm font-medium text-[#333]">Quote Options</h3>
            </div>
            <div className="p-4">
              <QuoteDetails
                quoteStatus="draft"
                onSupplyPeriodChange={setSupplyPeriodMonths}
              />
            </div>
          </div>
        )}

        {/* Line Items */}
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
