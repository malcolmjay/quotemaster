import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, X, Building2, User, MapPin, Loader2, RefreshCw, Truck } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useSupabaseQuote } from '../../context/SupabaseQuoteContext';
import { searchCustomers, supabase } from '../../lib/supabase';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import { HelpTooltip } from '../common/HelpTooltip';

interface CustomerSelectorProps {
  onShipToChange?: (addressId: string | null) => void;
  selectedShipToId?: string | null;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  onShipToChange,
  selectedShipToId
}) => {
  const { selectedCustomer, setSelectedCustomer } = useCustomer();
  const { currentQuote, updateCurrentQuote } = useSupabaseQuote();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showChangeConfirm, setShowChangeConfirm] = useState(false);
  const [changingCustomer, setChangingCustomer] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const hasActiveQuote = !!currentQuote;

  const performSearch = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchCustomers(term, 50);
      setSearchResults(results || []);
    } catch (error) {
      showToast('error', 'Customer search failed', 'Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [showToast]);

  useEffect(() => {
    performSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, performSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentQuote?.customer_user_id) {
      setSelectedContactId(currentQuote.customer_user_id);
    }
  }, [currentQuote?.customer_user_id]);

  useEffect(() => {
    if (selectedCustomer?.contacts?.length) {
      const primaryContact = selectedCustomer.contacts.find((c: any) => c.is_primary) || selectedCustomer.contacts[0];
      if (primaryContact) {
        setSelectedContactId(primaryContact.id);
        if (hasActiveQuote && currentQuote) {
          supabase
            .from('quotes')
            .update({ customer_user_id: primaryContact.id })
            .eq('id', currentQuote.id)
            .then(() => {})
            .catch((error) => console.error('Error updating contact:', error));
        }
      }
    } else {
      setSelectedContactId(null);
    }
  }, [selectedCustomer?.id]);

  useEffect(() => {
    if (selectedCustomer?.addresses?.length && !selectedShipToId) {
      const primaryAddr = selectedCustomer.addresses.find((addr: any) => addr.is_primary);
      const shippingAddr = selectedCustomer.addresses.find((addr: any) => addr.is_shipping);
      const defaultAddr = primaryAddr || shippingAddr || selectedCustomer.addresses[0];

      if (defaultAddr && onShipToChange) {
        onShipToChange(defaultAddr.id);
        if (hasActiveQuote && currentQuote) {
          supabase
            .from('quotes')
            .update({ ship_to_address_id: defaultAddr.id })
            .eq('id', currentQuote.id)
            .then(() => {})
            .catch((error) => console.error('Error updating ship-to address:', error));
        }
      }
    }
  }, [selectedCustomer?.id]);

  const handleCustomerSelect = async (customer: any) => {
    if (hasActiveQuote) {
      try {
        setChangingCustomer(true);
        await updateCurrentQuote({ customer_id: customer.id, currency: customer.currency || 'USD' } as any);
        setSelectedCustomer(customer);
        sessionStorage.removeItem('customerCleared');
        setSelectedContactId(null);
        if (onShipToChange) onShipToChange(null);
        showToast('success', 'Customer updated', `Quote customer changed to ${customer.name}`);
      } catch (error) {
        showToast('error', 'Failed to update customer', error instanceof Error ? error.message : 'Please try again.');
      } finally {
        setChangingCustomer(false);
      }
    } else {
      setSelectedCustomer(customer);
    }
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    setShowChangeConfirm(false);
  };

  const handleClearSelection = () => {
    if (hasActiveQuote) {
      showToast('warning', 'Cannot remove customer', 'A saved quote must have a customer assigned. You can change the customer by searching for a new one.');
      return;
    }
    setSelectedCustomer(null);
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleChangeCustomer = () => {
    setShowChangeConfirm(true);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleCancelChange = () => {
    setShowChangeConfirm(false);
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  const shippingAddresses = React.useMemo(() => {
    if (!selectedCustomer?.addresses?.length) return [];
    return selectedCustomer.addresses.filter((addr: any) => addr.is_shipping || addr.is_primary);
  }, [selectedCustomer]);

  const handleContactChange = async (contactId: string) => {
    const id = contactId || null;
    setSelectedContactId(id);
    if (hasActiveQuote && currentQuote) {
      try {
        await supabase
          .from('quotes')
          .update({ customer_user_id: id })
          .eq('id', currentQuote.id);
      } catch (error) {
        showToast('error', 'Failed to update contact', 'Please try again.');
      }
    }
  };

  const handleShipToChange = async (addressId: string) => {
    const id = addressId || null;
    if (onShipToChange) onShipToChange(id);
    if (hasActiveQuote) {
      try {
        await supabase
          .from('quotes')
          .update({ ship_to_address_id: id })
          .eq('id', currentQuote!.id);
      } catch (error) {
        showToast('error', 'Failed to update ship-to address', 'Please try again.');
      }
    }
  };

  const renderSearchInput = () => (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999]" />
        <HelpTooltip content="Search for customers by name, customer number, or contract number. Type at least 2 characters to see search results. Select a customer to begin building a quote.">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder={hasActiveQuote ? "Search for a new customer to assign..." : "Search by name, customer #, or contract (min 2 chars)..."}
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-700 border border-[#d4d4d4] dark:border-slate-600 rounded text-sm text-[#333] dark:text-white placeholder-[#999] focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] transition-all"
            autoFocus={showChangeConfirm}
          />
        </HelpTooltip>
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#428bca] animate-spin" />
        )}
        {showChangeConfirm && !isSearching && (
          <button
            onClick={handleCancelChange}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#999] hover:text-[#333] rounded transition-colors"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-slate-800 border border-[#d4d4d4] dark:border-slate-700 rounded shadow-lg max-h-80 overflow-y-auto">
          {isSearching ? (
            <div className="px-4 py-8 text-center">
              <Loader2 className="h-6 w-6 text-[#428bca] animate-spin mx-auto mb-2" />
              <span className="text-sm text-[#666] dark:text-slate-400">Searching customers...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-1">
              {searchResults.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  disabled={changingCustomer}
                  className="w-full px-4 py-3 text-left hover:bg-[#f0f0f0] dark:hover:bg-slate-700 border-b border-[#e8e8e8] dark:border-slate-700 last:border-b-0 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-[#333] dark:text-white truncate">
                        {customer.name}
                      </div>
                      <div className="text-xs text-[#666] dark:text-slate-400 mt-0.5">
                        #{customer.customer_number}
                        {customer.contract_number && ` | Contract: ${customer.contract_number}`}
                      </div>
                    </div>
                    {customer.tier && (
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                        customer.tier === 'platinum' ? 'bg-[#1a3a5c] text-white' :
                        customer.tier === 'gold' ? 'bg-[#c9a227] text-white' :
                        customer.tier === 'silver' ? 'bg-[#6c757d] text-white' :
                        'bg-[#428bca] text-white'
                      }`}>
                        {customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {searchResults.length >= 50 && (
                <div className="px-4 py-2 text-xs text-[#666] dark:text-slate-400 bg-[#f0f0f0] dark:bg-slate-700 text-center">
                  Showing first 50 results. Refine your search for more specific results.
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-[#666] dark:text-slate-400">
              {searchTerm.length < 2 ? 'Type at least 2 characters to search...' : 'No customers found'}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1.5">
            Customer <span className="text-red-500">*</span>
          </label>
          <div className="relative" ref={searchRef}>
            {!selectedCustomer || showChangeConfirm ? (
              renderSearchInput()
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-700 border border-[#d4d4d4] dark:border-slate-600 rounded">
                <Building2 className="h-4 w-4 text-[#666] flex-shrink-0" />
                <span className="flex-1 text-sm font-medium text-[#333] dark:text-white truncate">
                  {selectedCustomer.name}
                </span>
                <HelpTooltip content="Change the customer assigned to this quote.">
                  <button
                    onClick={handleChangeCustomer}
                    className="p-1 hover:bg-[#e8f4fd] rounded transition-colors"
                    title="Change customer"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-[#428bca]" />
                  </button>
                </HelpTooltip>
                {!hasActiveQuote && (
                  <HelpTooltip content="Clear the selected customer to choose a different one.">
                    <button
                      onClick={handleClearSelection}
                      className="p-1 hover:bg-[#f0f0f0] dark:hover:bg-slate-600 rounded transition-colors"
                    >
                      <X className="h-4 w-4 text-[#666]" />
                    </button>
                  </HelpTooltip>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1.5">
            Contact <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <HelpTooltip content="Select the primary contact person for this quote. This determines who receives quote communications and correspondence.">
              <select
                value={selectedContactId || ''}
                onChange={(e) => handleContactChange(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 bg-white dark:bg-slate-700 border border-[#d4d4d4] dark:border-slate-600 rounded text-sm text-[#333] dark:text-white focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] transition-all"
                disabled={!selectedCustomer}
              >
                <option value="">Select contact...</option>
                {selectedCustomer?.contacts?.map((contact: any) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name}
                    {contact.is_primary ? ' (Primary)' : ''}
                  </option>
                ))}
              </select>
            </HelpTooltip>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1.5">
            Ship To Location
          </label>
          <div className="relative">
            <HelpTooltip content="Select the shipping destination for this quote. Choose from the customer's registered shipping addresses.">
              <select
                value={selectedShipToId || ''}
                onChange={(e) => handleShipToChange(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 bg-white dark:bg-slate-700 border border-[#d4d4d4] dark:border-slate-600 rounded text-sm text-[#333] dark:text-white focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] transition-all"
                disabled={!selectedCustomer}
              >
                <option value="">Select ship-to address...</option>
                {shippingAddresses.map((addr: any) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.address_line_1}, {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postal_code}
                    {addr.is_primary ? ' (Primary)' : ''}
                  </option>
                ))}
                {selectedCustomer?.addresses?.filter((a: any) => !a.is_shipping && !a.is_primary).map((addr: any) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.address_line_1}, {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postal_code}
                  </option>
                ))}
              </select>
            </HelpTooltip>
            <Truck className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666] pointer-events-none" />
          </div>
        </div>
      </div>

      {selectedCustomer?.customer_notes && !showChangeConfirm && (
        <div className="bg-[#fff9e6] dark:bg-slate-700/50 rounded p-3 border border-[#ffe58f] dark:border-slate-600">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-4 w-4 text-[#d4a028]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#8a6d3b] dark:text-yellow-400 mb-1">Customer Notes</div>
              <div className="text-xs text-[#333] dark:text-slate-300 whitespace-pre-wrap break-words">
                {selectedCustomer.customer_notes}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
