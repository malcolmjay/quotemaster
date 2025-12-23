import React, { useState, useEffect } from 'react';
import { Building, Search, Plus, Pencil, MapPin, Users, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CustomerEditModal } from './CustomerEditModal';
import { AddressManagement } from './AddressManagement';
import { ContactManagement } from './ContactManagement';
import { Pagination } from '../common/Pagination';
import { HelpTooltip } from '../common/HelpTooltip';

export const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,customer_number.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%`);
      }

      const { data: customersData, error: customersError, count } = await query
        .range(from, to);

      if (customersError) throw customersError;

      setTotalItems(count || 0);

      if (customersData && customersData.length > 0) {
        const customerNumbers = customersData.map(c => c.customer_number);

        const { data: addressesData, error: addressesError } = await supabase
          .from('customer_addresses')
          .select('*')
          .in('customer_number', customerNumbers);

        if (addressesError) throw addressesError;

        const { data: contactsData, error: contactsError } = await supabase
          .from('customer_contacts')
          .select('*')
          .in('customer_number', customerNumbers);

        if (contactsError) throw contactsError;

        const customersWithData = customersData.map(customer => ({
          ...customer,
          addresses: addressesData?.filter(addr => addr.customer_number === customer.customer_number) || [],
          contacts: contactsData?.filter(contact => contact.customer_number === customer.customer_number) || []
        }));

        setCustomers(customersWithData);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setIsCreating(false);
    setIsEditModalOpen(true);
  };

  const handleManageAddresses = (customer: any) => {
    setSelectedCustomer(customer);
    setIsAddressModalOpen(true);
  };

  const handleManageContacts = (customer: any) => {
    setSelectedCustomer(customer);
    setIsContactModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedCustomer(null);
    setIsCreating(true);
    setIsEditModalOpen(true);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-[#f5e6ff] text-[#6b21a8] border border-[#e9d5ff]';
      case 'gold': return 'bg-[#fef9e7] text-[#92400e] border border-[#fde68a]';
      case 'silver': return 'bg-[#f5f5f5] text-[#666] border border-[#d4d4d4]';
      default: return 'bg-[#d9edf7] text-[#31708f] border border-[#bce8f1]';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'federal': return 'bg-[#d9edf7] text-[#31708f] border border-[#bce8f1]';
      case 'state': return 'bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6]';
      case 'local': return 'bg-[#fcf8e3] text-[#8a6d3b] border border-[#faebcc]';
      default: return 'bg-[#f5f5f5] text-[#666] border border-[#d4d4d4]';
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#d4d4d4] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#d9edf7] rounded border border-[#bce8f1]">
              <Building className="h-6 w-6 text-[#31708f]" />
            </div>
            <div>
              <div className="text-xs text-[#999] mb-1">
                Management / Customers
              </div>
              <h1 className="text-2xl font-bold text-[#333]">Customer Management</h1>
            </div>
          </div>
          <HelpTooltip content="Create a new customer record with contact information, addresses, and account details.">
            <button
              onClick={handleCreateNew}
              className="flex items-center space-x-2 px-4 py-2 bg-[#428bca] text-white rounded hover:bg-[#3276b1] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Customer</span>
            </button>
          </HelpTooltip>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">

      <div className="bg-white rounded border border-[#d4d4d4]">
        <div className="p-4 border-b border-[#d4d4d4]">
          <HelpTooltip content="Search customers by name, customer number, or type. Results update as you type.">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#999]" />
              <input
                type="text"
                placeholder="Search by name, customer number, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333] placeholder-[#999]"
              />
            </div>
          </HelpTooltip>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#428bca]"></div>
              <p className="mt-2 text-sm text-[#666]">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center">
              <Building className="h-12 w-12 text-[#999] mx-auto mb-3" />
              <p className="text-[#666]">No customers found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#f5f5f5] border-b border-[#d4d4d4]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                    Type / Segment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                    Sales Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                    Addresses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                    Contacts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#d4d4d4]">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#f9f9f9] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-[#333]">
                          {customer.name}
                        </div>
                        <div className="text-xs text-[#999]">
                          #{customer.customer_number}
                        </div>
                        {customer.contract_number && (
                          <div className="text-xs text-[#999]">
                            Contract: {customer.contract_number}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTypeColor(customer.type)}`}>
                          {customer.type}
                        </span>
                        <div className="text-xs text-[#666]">
                          {customer.segment}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {customer.sales_manager && (
                          <div className="text-[#333]">
                            <span className="text-xs text-[#999]">Mgr:</span> {customer.sales_manager}
                          </div>
                        )}
                        {customer.sales_rep && (
                          <div className="text-[#333]">
                            <span className="text-xs text-[#999]">Rep:</span> {customer.sales_rep}
                          </div>
                        )}
                        {!customer.sales_manager && !customer.sales_rep && (
                          <span className="text-xs text-[#999]">Not assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTierColor(customer.tier)}`}>
                        {customer.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-sm text-[#333]">
                        <MapPin className="h-4 w-4 text-[#999]" />
                        <span>{customer.addresses?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-sm text-[#333]">
                        <User className="h-4 w-4 text-[#999]" />
                        <span>{customer.contacts?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <HelpTooltip content="Modify customer information including name, tier, sales assignments, and payment terms.">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="p-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded border border-transparent hover:border-[#d4d4d4] transition-colors"
                            title="Edit Customer"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </HelpTooltip>
                        <HelpTooltip content="Add, edit, or remove shipping and billing addresses for this customer.">
                          <button
                            onClick={() => handleManageAddresses(customer)}
                            className="p-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded border border-transparent hover:border-[#d4d4d4] transition-colors"
                            title="Manage Addresses"
                          >
                            <MapPin className="h-4 w-4" />
                          </button>
                        </HelpTooltip>
                        <HelpTooltip content="Maintain the list of contact persons, including email addresses, phone numbers, and roles.">
                          <button
                            onClick={() => handleManageContacts(customer)}
                            className="p-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded border border-transparent hover:border-[#d4d4d4] transition-colors"
                            title="Manage Contacts"
                          >
                            <Users className="h-4 w-4" />
                          </button>
                        </HelpTooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && customers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
      </div>
      {/* End Main Content */}

      {isEditModalOpen && (
        <CustomerEditModal
          customer={selectedCustomer}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            fetchCustomers();
          }}
          isCreating={isCreating}
        />
      )}

      {isAddressModalOpen && selectedCustomer && (
        <AddressManagement
          customer={selectedCustomer}
          isOpen={isAddressModalOpen}
          onClose={() => {
            setIsAddressModalOpen(false);
            fetchCustomers();
          }}
        />
      )}

      {isContactModalOpen && selectedCustomer && (
        <ContactManagement
          customer={selectedCustomer}
          isOpen={isContactModalOpen}
          onClose={() => {
            setIsContactModalOpen(false);
            fetchCustomers();
          }}
        />
      )}
    </div>
  );
};
