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
import { User, Plus } from 'lucide-react';

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
        console.log('📍 Restoring focus to quote:', quoteToFocus.quote_number);
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

  // Debug logging to help troubleshoot
  React.useEffect(() => {
    console.log('QuoteBuilder - currentQuote:', currentQuote);
    console.log('QuoteBuilder - lineItems:', lineItems);
    console.log('QuoteBuilder - selectedCustomer:', selectedCustomer);
  }, [currentQuote, lineItems, selectedCustomer]);

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
    // Update line item with multi-year pricing data
    setLineItems(prev => prev.map(item => 
      item.id === pricingData.lineItemId 
        ? { ...item, multiYearPricing: pricingData }
        : item
    ));
    setShowMultiYearPricing(false);
  };
  return (
    <div className="space-y-4">
      {isLoadingQuote && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-800">Loading quote data...</span>
          </div>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {currentQuote ? `Edit Quote ${currentQuote.quote_number}` : 'Create Request for Quote (RFQ)'}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                {currentQuote ? 'Edit existing quote with line items and customer information' : 'Create comprehensive quotes with Oracle integration, cost analysis, and workflow management'}
              </p>
            </div>
            <button
              onClick={handleNewQuote}
              className="ml-3 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Quote
            </button>
          </div>
        </div>
        
        <div className="p-3 space-y-3">
          {/* Quote Status Display */}
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Quote Status:</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                  {currentQuote?.quote_status === 'pending_approval' ? 'Pending Approval' :
                   currentQuote?.quote_status === 'approved' ? 'Approved' : 'Draft'}
                </span>
              </div>
              {currentQuote && (
                <div className="flex flex-col items-end space-y-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Quote: {currentQuote.quote_number}
                  </span>
                  <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                    {currentQuote.created_at && (
                      <span>
                        Created: {new Date(currentQuote.created_at).toLocaleDateString()} {new Date(currentQuote.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {createdByEmail && (
                      <span>
                        by {createdByEmail}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 mb-3">
            <User className="h-3 w-3" />
            <span className="text-xs font-bold">Customer & Quote Context</span>
          </div>
          
          <CustomerSelector />
          <QuoteDetails 
            quoteStatus="draft" 
            onSupplyPeriodChange={setSupplyPeriodMonths}
          />
        </div>
      </div>

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
      
      {/* Quote Summary - Full Width */}
      <QuoteSummary
        lineItems={lineItems}
        onSaveSuccess={() => {
          // Optionally refresh data or show success message
          console.log('Quote saved successfully');
        }}
      />
      
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