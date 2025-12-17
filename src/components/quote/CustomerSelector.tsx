import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, X, Building2, User, MapPin, Loader2 } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { searchCustomers } from '../../lib/supabase';
import { useDebounce } from '../../hooks/useDebounce';

export const CustomerSelector: React.FC = () => {
  const { selectedCustomer, setSelectedCustomer } = useCustomer();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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
      console.error('Customer search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

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

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleClearSelection = () => {
    setSelectedCustomer(null);
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  const primaryContact = React.useMemo(() => {
    if (!selectedCustomer?.contacts?.length) return null;
    return selectedCustomer.contacts.find((c: any) => c.is_primary) || selectedCustomer.contacts[0];
  }, [selectedCustomer]);

  const primaryAddress = React.useMemo(() => {
    if (!selectedCustomer?.addresses?.length) return null;
    const primary = selectedCustomer.addresses.find((addr: any) => addr.is_primary);
    if (primary) return primary;
    const shipping = selectedCustomer.addresses.find((addr: any) => addr.is_shipping);
    return shipping || selectedCustomer.addresses[0];
  }, [selectedCustomer]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1.5">
            Customer <span className="text-red-500">*</span>
          </label>
          <div className="relative" ref={searchRef}>
            {!selectedCustomer ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    placeholder="Search by name, customer #, or contract (min 2 chars)..."
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-700 border border-[#d4d4d4] dark:border-slate-600 rounded text-sm text-[#333] dark:text-white placeholder-[#999] focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] transition-all"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#428bca] animate-spin" />
                  )}
                </div>

                {showResults && (
                  <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-[#d4d4d4] dark:border-slate-700 rounded shadow-lg max-h-80 overflow-y-auto">
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
                            className="w-full px-4 py-3 text-left hover:bg-[#f0f0f0] dark:hover:bg-slate-700 border-b border-[#e8e8e8] dark:border-slate-700 last:border-b-0 transition-colors"
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
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-700 border border-[#d4d4d4] dark:border-slate-600 rounded">
                <Building2 className="h-4 w-4 text-[#666] flex-shrink-0" />
                <span className="flex-1 text-sm font-medium text-[#333] dark:text-white truncate">
                  {selectedCustomer.name}
                </span>
                <button
                  onClick={handleClearSelection}
                  className="p-1 hover:bg-[#f0f0f0] dark:hover:bg-slate-600 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-[#666]" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#666] dark:text-slate-400 mb-1.5">
            Contact <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
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
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666] pointer-events-none" />
          </div>
        </div>
      </div>

      {selectedCustomer && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-[#f0f0f0] dark:bg-slate-700/50 rounded p-3 border border-[#e8e8e8] dark:border-slate-600">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-3.5 w-3.5 text-[#666]" />
              <span className="text-xs font-medium text-[#666] dark:text-slate-400">Customer</span>
            </div>
            <div className="text-sm font-medium text-[#333] dark:text-white">{selectedCustomer.name}</div>
            <div className="text-xs text-[#666] dark:text-slate-400 mt-0.5">
              #{selectedCustomer.customer_number} | {selectedCustomer.type}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {selectedCustomer.tier && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  selectedCustomer.tier === 'platinum' ? 'bg-[#1a3a5c] text-white' :
                  selectedCustomer.tier === 'gold' ? 'bg-[#c9a227] text-white' :
                  selectedCustomer.tier === 'silver' ? 'bg-[#6c757d] text-white' :
                  'bg-[#428bca] text-white'
                }`}>
                  {selectedCustomer.tier.charAt(0).toUpperCase() + selectedCustomer.tier.slice(1)}
                </span>
              )}
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#5cb85c] text-white">
                {selectedCustomer.currency}
              </span>
            </div>
          </div>

          {primaryContact && (
            <div className="bg-[#f0f0f0] dark:bg-slate-700/50 rounded p-3 border border-[#e8e8e8] dark:border-slate-600">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-3.5 w-3.5 text-[#666]" />
                <span className="text-xs font-medium text-[#666] dark:text-slate-400">Primary Contact</span>
              </div>
              <div className="text-sm font-medium text-[#333] dark:text-white">
                {primaryContact.first_name} {primaryContact.last_name}
              </div>
              <div className="text-xs text-[#666] dark:text-slate-400 mt-0.5 truncate">
                {primaryContact.title && <>{primaryContact.title} | </>}
                {primaryContact.email}
              </div>
            </div>
          )}

          {primaryAddress && (
            <div className="bg-[#f0f0f0] dark:bg-slate-700/50 rounded p-3 border border-[#e8e8e8] dark:border-slate-600">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-3.5 w-3.5 text-[#666]" />
                <span className="text-xs font-medium text-[#666] dark:text-slate-400">Ship To</span>
              </div>
              <div className="text-xs text-[#333] dark:text-slate-300 leading-relaxed">
                {primaryAddress.address_line_1}<br />
                {primaryAddress.city}, {primaryAddress.state} {primaryAddress.postal_code}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
