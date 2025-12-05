import React, { useState, useEffect } from 'react';
import { Building, Search, Plus, Pencil, MapPin, Users, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CustomerEditModal } from './CustomerEditModal';
import { AddressManagement } from './AddressManagement';
import { ContactManagement } from './ContactManagement';

export const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (customersError) throw customersError;

      const { data: addressesData, error: addressesError } = await supabase
        .from('customer_addresses')
        .select('*');

      if (addressesError) throw addressesError;

      const { data: contactsData, error: contactsError } = await supabase
        .from('customer_contacts')
        .select('*');

      if (contactsError) throw contactsError;

      const customersWithData = customersData?.map(customer => ({
        ...customer,
        addresses: addressesData?.filter(addr => addr.customer_number === customer.customer_number) || [],
        contacts: contactsData?.filter(contact => contact.customer_number === customer.customer_number) || []
      })) || [];

      setCustomers(customersWithData);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      case 'platinum': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'federal': return 'bg-blue-100 text-blue-800';
      case 'state': return 'bg-green-100 text-green-800';
      case 'local': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Management</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage customer information and addresses
            </p>
          </div>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Customer</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, customer number, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No customers found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type / Segment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Sales Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Addresses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contacts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {customer.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          #{customer.customer_number}
                        </div>
                        {customer.contract_number && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
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
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {customer.segment}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {customer.sales_manager && (
                          <div className="text-gray-900 dark:text-white">
                            <span className="text-xs text-gray-500">Mgr:</span> {customer.sales_manager}
                          </div>
                        )}
                        {customer.sales_rep && (
                          <div className="text-gray-900 dark:text-white">
                            <span className="text-xs text-gray-500">Rep:</span> {customer.sales_rep}
                          </div>
                        )}
                        {!customer.sales_manager && !customer.sales_rep && (
                          <span className="text-xs text-gray-400">Not assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTierColor(customer.tier)}`}>
                        {customer.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-sm text-gray-900 dark:text-white">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{customer.addresses?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-sm text-gray-900 dark:text-white">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{customer.contacts?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit Customer"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleManageAddresses(customer)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                          title="Manage Addresses"
                        >
                          <MapPin className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleManageContacts(customer)}
                          className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                          title="Manage Contacts"
                        >
                          <Users className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
