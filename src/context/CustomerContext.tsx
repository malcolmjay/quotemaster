import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Customer {
  id: string;
  name: string;
  customer_number: string;
  type: 'federal' | 'state' | 'local' | 'commercial';
  segment?: 'government' | 'defense' | 'education' | 'healthcare' | 'commercial';
  contract_number?: string;
  payment_terms?: string;
  currency: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  contacts?: Contact[];
  addresses?: CustomerAddress[];
}

interface CustomerAddress {
  id: string;
  customer_number: string;
  site_use_id?: string;
  address_line_1: string;
  address_line_2?: string;
  address_line_3?: string;
  city: string;
  postal_code: string;
  state?: string;
  country: string;
  is_shipping: boolean;
  is_billing: boolean;
  is_primary: boolean;
  is_credit_hold?: boolean;
}

interface Contact {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  title?: string;
  is_primary?: boolean;
}

interface CustomerContextType {
  customers: Customer[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  loading: boolean;
  error: string | null;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const useCustomer = (): CustomerContextType => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};

interface CustomerProviderProps {
  children: ReactNode;
}

export const CustomerProvider: React.FC<CustomerProviderProps> = ({ children }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const value: CustomerContextType = {
    customers: [],
    selectedCustomer,
    setSelectedCustomer,
    loading: false,
    error: null
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};