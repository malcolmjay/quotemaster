import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar, MapPin, User, Search, X } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';

export const CustomerSelector: React.FC = () => {
  const { customers, selectedCustomer, setSelectedCustomer } = useCustomer();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter customers based on search term
  const filteredCustomers = React.useMemo(() => {
    if (!searchTerm.trim()) return customers;

    const term = searchTerm.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(term) ||
      customer.customer_number?.toLowerCase().includes(term) ||
      customer.contract_number?.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  // Close results when clicking outside
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

  // Memoize computed values to prevent re-computation on every render
  const primaryContact = React.useMemo(() => {
    if (!selectedCustomer?.contacts?.length) return null;
    return selectedCustomer.contacts.find((c: any) => c.is_primary) || selectedCustomer.contacts[0];
  }, [selectedCustomer]);

  const primaryAddress = React.useMemo(() => {
    if (!selectedCustomer?.addresses?.length) return null;
    const primary = selectedCustomer.addresses.find(addr => addr.is_primary);
    if (primary) return primary;
    const shipping = selectedCustomer.addresses.find(addr => addr.is_shipping);
    return shipping || selectedCustomer.addresses[0];
  }, [selectedCustomer]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Select Customer <span className="text-red-500">*</span>
        </label>
        <div className="relative" ref={searchRef}>
          {!selectedCustomer ? (
            <>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  placeholder="Search by name, customer #, or contract #..."
                  className="w-full px-3 py-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs"
                />
                <Search className="absolute left-3 top-2.5 h-3 w-3 text-gray-400" />
              </div>

              {showResults && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    <div className="py-1">
                      {filteredCustomers.slice(0, 100).map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => handleCustomerSelect(customer)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {customer.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            Customer #: {customer.customer_number}
                            {customer.contract_number && ` • Contract: ${customer.contract_number}`}
                            {customer.type && ` • ${customer.type}`}
                          </div>
                          {customer.tier && (
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                              customer.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                              customer.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                              customer.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1)}
                            </span>
                          )}
                        </button>
                      ))}
                      {filteredCustomers.length > 100 && (
                        <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                          Showing first 100 results. Keep typing to narrow down...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'No customers found matching your search' : 'Start typing to search customers...'}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="relative flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
              <span className="text-xs text-gray-900 dark:text-gray-100 font-medium">
                {selectedCustomer.name}
              </span>
              <button
                onClick={handleClearSelection}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="Clear selection"
              >
                <X className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          )}
        </div>
        
        {selectedCustomer && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <div className="text-xs">
              <div className="font-medium text-gray-900">{selectedCustomer.name}</div>
              <div className="text-gray-600">
                Customer #: {selectedCustomer.customer_number} • {selectedCustomer.type} • {selectedCustomer.contract_number}
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              {selectedCustomer.tier && (
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  selectedCustomer.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                  selectedCustomer.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                  selectedCustomer.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {selectedCustomer.tier.charAt(0).toUpperCase() + selectedCustomer.tier.slice(1)}
                </span>
              )}
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                {selectedCustomer.currency}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Requesting Contact <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select className="appearance-none w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs">
            <option value="">Select requesting contact...</option>
            {selectedCustomer && selectedCustomer.contacts && selectedCustomer.contacts.length > 0 ? (
              selectedCustomer.contacts.map((contact: any) => (
                <option key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name}
                  {contact.is_primary ? ' (Primary)' : ''}
                </option>
              ))
            ) : selectedCustomer ? (
              <option disabled>No contacts available</option>
            ) : null}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-gray-400" />
        </div>

        {primaryContact && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <div className="text-xs">
              <div className="font-medium text-gray-900">
                {primaryContact.first_name} {primaryContact.last_name}
                {primaryContact.is_primary && <span className="ml-2 text-yellow-600">(Primary)</span>}
              </div>
              <div className="text-gray-600">
                {primaryContact.title && <>{primaryContact.title} • </>}{primaryContact.email}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
      
      {selectedCustomer && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-3 w-3 text-gray-600" />
            <span className="text-xs font-medium text-gray-900">Additional Quote Information</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Acceptance Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <Calendar className="absolute right-1 top-1.5 h-2 w-2 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Supply Period
              </label>
              <input
                type="text"
                placeholder="e.g., 12 months"
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Account Manager
              </label>
              <input
                type="text"
                placeholder="Account manager name"
                defaultValue="Michael Thompson"
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ship To Address
              </label>
              <div className="relative">
                <select className="appearance-none w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option>Same as billing address</option>
                  <option>Alternate shipping address</option>
                </select>
                <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-2 w-2 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Primary Address</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 p-2 rounded border border-gray-300 dark:border-gray-600">
              {primaryAddress ? (
                <>
                  {primaryAddress.address_line_1}<br />
                  {primaryAddress.address_line_2 && <>{primaryAddress.address_line_2}<br /></>}
                  {primaryAddress.address_line_3 && <>{primaryAddress.address_line_3}<br /></>}
                  {primaryAddress.city}, {primaryAddress.state} {primaryAddress.postal_code}<br />
                  {primaryAddress.country}
                </>
              ) : (
                <span className="text-gray-400">No address on file</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};