import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Building2, User, MapPin } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';

export const CustomerSelector: React.FC = () => {
  const { customers, selectedCustomer, setSelectedCustomer } = useCustomer();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredCustomers = React.useMemo(() => {
    if (!searchTerm.trim()) return customers;

    const term = searchTerm.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(term) ||
      customer.customer_number?.toLowerCase().includes(term) ||
      customer.contract_number?.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

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
    setShowResults(false);
  };

  const handleClearSelection = () => {
    setSelectedCustomer(null);
    setSearchTerm('');
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
      {/* Customer Search */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Customer <span className="text-red-500">*</span>
          </label>
          <div className="relative" ref={searchRef}>
            {!selectedCustomer ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    placeholder="Search by name, customer #, or contract..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all"
                  />
                </div>

                {showResults && (
                  <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                      <div className="py-1">
                        {filteredCustomers.slice(0, 50).map((customer) => (
                          <button
                            key={customer.id}
                            onClick={() => handleCustomerSelect(customer)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
                                  {customer.name}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  #{customer.customer_number}
                                  {customer.contract_number && ` | Contract: ${customer.contract_number}`}
                                </div>
                              </div>
                              {customer.tier && (
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                                  customer.tier === 'platinum' ? 'bg-slate-800 text-white' :
                                  customer.tier === 'gold' ? 'bg-amber-100 text-amber-800' :
                                  customer.tier === 'silver' ? 'bg-slate-200 text-slate-700' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1)}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                        {filteredCustomers.length > 50 && (
                          <div className="px-4 py-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-700 text-center">
                            Showing first 50 of {filteredCustomers.length} results
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                        {searchTerm ? 'No customers found' : 'Start typing to search...'}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg">
                <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="flex-1 text-sm font-medium text-slate-900 dark:text-white truncate">
                  {selectedCustomer.name}
                </span>
                <button
                  onClick={handleClearSelection}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Contact <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              className="w-full appearance-none px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all"
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
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Compact Customer Info Cards */}
      {selectedCustomer && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Customer Details Card */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Customer</span>
            </div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">{selectedCustomer.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              #{selectedCustomer.customer_number} | {selectedCustomer.type}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {selectedCustomer.tier && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  selectedCustomer.tier === 'platinum' ? 'bg-slate-800 text-white' :
                  selectedCustomer.tier === 'gold' ? 'bg-amber-100 text-amber-800' :
                  selectedCustomer.tier === 'silver' ? 'bg-slate-200 text-slate-700' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {selectedCustomer.tier.charAt(0).toUpperCase() + selectedCustomer.tier.slice(1)}
                </span>
              )}
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                {selectedCustomer.currency}
              </span>
            </div>
          </div>

          {/* Contact Card */}
          {primaryContact && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Primary Contact</span>
              </div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                {primaryContact.first_name} {primaryContact.last_name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {primaryContact.title && <>{primaryContact.title} | </>}
                {primaryContact.email}
              </div>
            </div>
          )}

          {/* Address Card */}
          {primaryAddress && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Ship To</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
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
