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
import { Plus, ChevronDown, ChevronRight, Settings, MessageCircle, CheckSquare, Bot, Building2, User, MapPin, Truck } from 'lucide-react';
import { HelpTooltip } from '../common/HelpTooltip';
import { MessagePanel } from '../common/MessagePanel';
import { TaskManager } from './TaskManager';
import { AIAgentPanel } from '../agent/AIAgentPanel';

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
  const [showMessages, setShowMessages] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [carryingCostPercent, setCarryingCostPercent] = useState(0);
  const [freightOverheadPercent, setFreightOverheadPercent] = useState(0);
  const [selectedShipToId, setSelectedShipToId] = useState<string | null>(null);

  const { currentQuote, quotes, setCurrentQuote } = useSupabaseQuote();
  const { selectedCustomer, setSelectedCustomer } = useCustomer();

  const primaryContact = React.useMemo(() => {
    if (!selectedCustomer?.contacts?.length) return null;
    return selectedCustomer.contacts.find((c: any) => c.is_primary) || selectedCustomer.contacts[0];
  }, [selectedCustomer]);

  const selectedShipToAddress = React.useMemo(() => {
    if (!selectedShipToId || !selectedCustomer?.addresses?.length) return null;
    return selectedCustomer.addresses.find((a: any) => a.id === selectedShipToId) || null;
  }, [selectedShipToId, selectedCustomer]);

  const primaryAddress = React.useMemo(() => {
    if (!selectedCustomer?.addresses?.length) return null;
    const primary = selectedCustomer.addresses.find((addr: any) => addr.is_primary);
    if (primary) return primary;
    const shipping = selectedCustomer.addresses.find((addr: any) => addr.is_shipping);
    return shipping || selectedCustomer.addresses[0];
  }, [selectedCustomer]);

  React.useEffect(() => {
    if (currentQuote && (currentQuote as any).ship_to_address_id) {
      setSelectedShipToId((currentQuote as any).ship_to_address_id);
    } else {
      setSelectedShipToId(null);
    }
  }, [currentQuote?.id]);

  const handleNewQuote = () => {
    setCurrentQuote(null);
    setSelectedCustomer(null);
    setSelectedShipToId(null);
    setLineItems([]);
    sessionStorage.removeItem('focusQuoteId');
    sessionStorage.removeItem('customerCleared');
    localStorage.removeItem('currentQuoteId');
  };

  React.useEffect(() => {
    if (isLoadingQuote) return;

    const focusQuoteId = sessionStorage.getItem('focusQuoteId');
    if (focusQuoteId && !currentQuote) {
      sessionStorage.removeItem('focusQuoteId');
    }

    if (currentQuote) {
      if (!selectedCustomer && currentQuote.customers && !sessionStorage.getItem('customerCleared')) {
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
          warehouse: item.warehouse || '',
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
          cost_effective_to: item.cost_effective_to,
          award_company_id: item.award_company_id || null,
          award_price: item.award_price ?? null,
          award_quantity: item.award_quantity ?? null,
          award_contract_number: item.award_contract_number || null,
          bid_competitor_1_id: item.bid_competitor_1_id || null,
          bid_price_1: item.bid_price_1 ?? null,
          bid_price_2: item.bid_price_2 ?? null,
          bid_competitor_2_id: item.bid_competitor_2_id || null,
          bid_competitor_2_price: item.bid_competitor_2_price ?? null
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

  React.useEffect(() => {
    if (currentQuote) {
      setCarryingCostPercent(currentQuote.carrying_cost_percent || 0);
      setFreightOverheadPercent(currentQuote.freight_overhead_percent || 0);
    } else {
      setCarryingCostPercent(0);
      setFreightOverheadPercent(0);
    }
  }, [currentQuote]);

  const handleOverheadUpdate = async (carrying: number, freight: number) => {
    if (currentQuote) {
      try {
        await supabase
          .from('quotes')
          .update({
            carrying_cost_percent: carrying,
            freight_overhead_percent: freight
          })
          .eq('id', currentQuote.id);

        setCarryingCostPercent(carrying);
        setFreightOverheadPercent(freight);
      } catch (error) {
        console.error('Error updating overhead:', error);
      }
    }
  };

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
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-200';
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
    <div className="min-h-screen bg-[#f4f5f7]">
      {isLoadingQuote && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#1a6fb5] text-white px-4 py-2 text-sm flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          Loading quote data...
        </div>
      )}

      <div className="bg-white border-b border-[#dce0e6] shadow-sm">
        <div className="px-6 py-4">
          <div className="text-xs text-[#8c939d] mb-1.5 tracking-wide uppercase font-medium">
            Sales / Quotes
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-[#1a1f36]">
                {currentQuote ? (
                  <span>Quote <span className="text-[#1a6fb5]">{currentQuote.quote_number}</span></span>
                ) : (
                  'New Quote'
                )}
              </h1>
              {currentQuote && (
                <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getStatusBadge(currentQuote.quote_status)}`}>
                  {getStatusLabel(currentQuote.quote_status)}
                </span>
              )}
              {currentQuote && (
                <span className="text-xs text-[#8c939d]">
                  Created {new Date(currentQuote.created_at).toLocaleDateString()}
                  {createdByEmail && ` by ${createdByEmail}`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {currentQuote && (
                <>
                  <HelpTooltip content="Ask the AI assistant questions about this quote, customer, line items, or anything else in the database. Get instant insights and analysis.">
                    <button
                      onClick={() => setShowAIAgent(!showAIAgent)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md transition-all ${
                        showAIAgent
                          ? 'bg-[#e8f0fe] text-[#1a6fb5] font-medium'
                          : 'text-[#5f6672] hover:text-[#1a1f36] hover:bg-[#f4f5f7]'
                      }`}
                    >
                      <Bot className="w-4 h-4" />
                      AI
                    </button>
                  </HelpTooltip>
                  <HelpTooltip content="View and manage tasks for this quote.">
                    <button
                      onClick={() => setShowTasks(!showTasks)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md transition-all ${
                        showTasks
                          ? 'bg-[#e8f0fe] text-[#1a6fb5] font-medium'
                          : 'text-[#5f6672] hover:text-[#1a1f36] hover:bg-[#f4f5f7]'
                      }`}
                    >
                      <CheckSquare className="w-4 h-4" />
                      Tasks
                    </button>
                  </HelpTooltip>
                  <HelpTooltip content="View and add messages to coordinate with team members on this quote.">
                    <button
                      onClick={() => setShowMessages(!showMessages)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md transition-all ${
                        showMessages
                          ? 'bg-[#e8f0fe] text-[#1a6fb5] font-medium'
                          : 'text-[#5f6672] hover:text-[#1a1f36] hover:bg-[#f4f5f7]'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Messages
                    </button>
                  </HelpTooltip>

                  <div className="w-px h-6 bg-[#dce0e6] mx-1" />
                </>
              )}
              <HelpTooltip content="Toggle quote options like quote number, PO number, terms, and expiration date.">
                <button
                  onClick={() => setShowQuoteDetails(!showQuoteDetails)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md transition-all ${
                    showQuoteDetails
                      ? 'bg-[#e8f0fe] text-[#1a6fb5] font-medium'
                      : 'text-[#5f6672] hover:text-[#1a1f36] hover:bg-[#f4f5f7]'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Options
                  {showQuoteDetails ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </HelpTooltip>
              <HelpTooltip content="Start a new quote from scratch.">
                <button
                  onClick={handleNewQuote}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1a6fb5] hover:bg-[#155a94] text-white text-sm font-medium rounded-md transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Quote
                </button>
              </HelpTooltip>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5 max-w-[1920px] mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#dce0e6] dark:border-slate-700 shadow-sm">
          <button
            onClick={() => setShowCustomerDetails(!showCustomerDetails)}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-[#f8f9fb] dark:hover:bg-slate-700/50 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full transition-colors ${selectedCustomer ? 'bg-emerald-500' : 'bg-[#cdd1d9]'}`}></div>
              <div className="text-left">
                <div className="text-sm font-semibold text-[#1a1f36] dark:text-white">
                  {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
                </div>
                {selectedCustomer && (
                  <div className="text-xs text-[#8c939d] dark:text-slate-400 mt-0.5">
                    #{selectedCustomer.customer_number}
                    {selectedCustomer.contract_number && ` | Contract: ${selectedCustomer.contract_number}`}
                    {selectedCustomer.primary_warehouse && ` | Warehouse: ${selectedCustomer.primary_warehouse}`}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedCustomer?.tier && (
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                  selectedCustomer.tier === 'platinum' ? 'bg-[#1a3a5c] text-white' :
                  selectedCustomer.tier === 'gold' ? 'bg-[#c9a227] text-white' :
                  selectedCustomer.tier === 'silver' ? 'bg-[#6c757d] text-white' :
                  'bg-[#1a6fb5] text-white'
                }`}>
                  {selectedCustomer.tier.charAt(0).toUpperCase() + selectedCustomer.tier.slice(1)}
                </span>
              )}
              {showCustomerDetails ? (
                <ChevronDown className="w-4 h-4 text-[#8c939d] dark:text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#8c939d] dark:text-slate-400" />
              )}
            </div>
          </button>

          {selectedCustomer && !showCustomerDetails && (
            <div className="px-5 pb-4 pt-3 border-t border-[#eef0f3] dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <div className="flex items-center gap-2.5 bg-[#f8f9fb] dark:bg-slate-700/50 rounded-md px-3 py-2.5 border border-[#eef0f3] dark:border-slate-600">
                  <Building2 className="h-3.5 w-3.5 text-[#8c939d] flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-[#8c939d] dark:text-slate-400 font-medium">Customer</div>
                    <div className="text-xs font-medium text-[#1a1f36] dark:text-white truncate">{selectedCustomer.name}</div>
                    <div className="text-[10px] text-[#8c939d] dark:text-slate-400">
                      #{selectedCustomer.customer_number} | {selectedCustomer.type}
                      {selectedCustomer.currency && ` | ${selectedCustomer.currency}`}
                    </div>
                  </div>
                </div>

                {primaryContact && (
                  <div className="flex items-center gap-2.5 bg-[#f8f9fb] dark:bg-slate-700/50 rounded-md px-3 py-2.5 border border-[#eef0f3] dark:border-slate-600">
                    <User className="h-3.5 w-3.5 text-[#8c939d] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wide text-[#8c939d] dark:text-slate-400 font-medium">Contact</div>
                      <div className="text-xs font-medium text-[#1a1f36] dark:text-white truncate">
                        {primaryContact.first_name} {primaryContact.last_name}
                      </div>
                      <div className="text-[10px] text-[#8c939d] dark:text-slate-400 truncate">
                        {primaryContact.email}
                      </div>
                    </div>
                  </div>
                )}

                {(selectedShipToAddress || primaryAddress) && (
                  <div className="flex items-center gap-2.5 bg-[#f8f9fb] dark:bg-slate-700/50 rounded-md px-3 py-2.5 border border-[#eef0f3] dark:border-slate-600">
                    <Truck className="h-3.5 w-3.5 text-[#8c939d] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wide text-[#8c939d] dark:text-slate-400 font-medium">
                        Ship To{selectedShipToAddress ? '' : ' (Default)'}
                      </div>
                      <div className="text-xs font-medium text-[#1a1f36] dark:text-white truncate">
                        {(selectedShipToAddress || primaryAddress).address_line_1}
                      </div>
                      <div className="text-[10px] text-[#8c939d] dark:text-slate-400">
                        {(selectedShipToAddress || primaryAddress).city}, {(selectedShipToAddress || primaryAddress).state} {(selectedShipToAddress || primaryAddress).postal_code}
                      </div>
                    </div>
                  </div>
                )}

                {selectedCustomer.primary_warehouse && (
                  <div className="flex items-center gap-2.5 bg-[#f8f9fb] dark:bg-slate-700/50 rounded-md px-3 py-2.5 border border-[#eef0f3] dark:border-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-[#8c939d] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wide text-[#8c939d] dark:text-slate-400 font-medium">Warehouse</div>
                      <div className="text-xs font-medium text-[#1a1f36] dark:text-white truncate">{selectedCustomer.primary_warehouse}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {showCustomerDetails && (
            <div className="px-5 pb-5 pt-3 border-t border-[#eef0f3] dark:border-slate-700">
              <CustomerSelector
                onShipToChange={setSelectedShipToId}
                selectedShipToId={selectedShipToId}
              />
            </div>
          )}
        </div>

        {showQuoteDetails && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#dce0e6] dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-[#f8f9fb] dark:bg-slate-700 border-b border-[#eef0f3] dark:border-slate-600">
              <h3 className="text-sm font-semibold text-[#1a1f36] dark:text-white">Quote Options</h3>
            </div>
            <div className="p-5">
              <QuoteDetails
                quoteStatus="draft"
                onSupplyPeriodChange={setSupplyPeriodMonths}
                carryingCostPercent={carryingCostPercent}
                freightOverheadPercent={freightOverheadPercent}
                onOverheadUpdate={handleOverheadUpdate}
              />
            </div>
          </div>
        )}

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

        <QuoteSummary
          lineItems={lineItems}
          onSaveSuccess={() => {
            console.log('Quote saved successfully');
          }}
        />
      </div>

      {showCostAnalysis && (
        <CostAnalysis
          product={selectedProduct}
          onClose={() => setShowCostAnalysis(false)}
          onApplyPricing={updatePriceCallback?.callback}
          carryingCostPercent={currentQuote?.carrying_cost_percent || 0}
          freightOverheadPercent={currentQuote?.freight_overhead_percent || 0}
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

      {showTasks && currentQuote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-[#dce0e6]">
            <div className="sticky top-0 bg-white border-b border-[#dce0e6] px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a1f36]">
                Tasks - Quote {currentQuote.quote_number}
              </h2>
              <button
                onClick={() => setShowTasks(false)}
                className="p-1.5 hover:bg-[#f4f5f7] rounded-md text-[#8c939d] hover:text-[#1a1f36] transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <TaskManager quoteId={currentQuote.id} />
            </div>
          </div>
        </div>
      )}

      {showMessages && currentQuote && (
        <MessagePanel
          quoteId={currentQuote.id}
          title={`Quote ${currentQuote.quote_number} Messages`}
          onClose={() => setShowMessages(false)}
        />
      )}

      {showAIAgent && currentQuote && (
        <AIAgentPanel
          onClose={() => setShowAIAgent(false)}
          context={{
            quoteId: currentQuote.id,
            quoteNumber: currentQuote.quote_number,
            customerId: selectedCustomer?.id,
            customerName: selectedCustomer?.name,
            lineItems: lineItems,
          }}
        />
      )}
    </div>
  );
};
