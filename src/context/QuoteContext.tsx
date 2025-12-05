import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Quote {
  id: string;
  customerId: string;
  requestingUserId: string;
  quoteType: string;
  validUntil: string;
  shipUntil?: string;
  customerBidNumber?: string;
  purchaseOrderNumber?: string;
  status: 'draft' | 'sent' | 'accepted' | 'won' | 'lost' | 'expired';
  lineItems: QuoteLineItem[];
  totalValue: number;
  createdAt: string;
  updatedAt: string;
}

interface QuoteLineItem {
  id: string;
  productSku: string;
  productName: string;
  supplier: string;
  quantity: number;
  reserveQuantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
  stockOnHand: number;
  leadTime: string;
  nextAvailableDate: string;
  status: 'pending' | 'won' | 'lost';
  shippingInstructions?: string;
}

interface QuoteContextType {
  currentQuote: Quote | null;
  quotes: Quote[];
  setCurrentQuote: (quote: Quote | null) => void;
  addQuote: (quote: Quote) => void;
  updateQuote: (quoteId: string, updates: Partial<Quote>) => void;
  deleteQuote: (quoteId: string) => void;
  addLineItem: (lineItem: QuoteLineItem) => void;
  updateLineItem: (lineItemId: string, updates: Partial<QuoteLineItem>) => void;
  removeLineItem: (lineItemId: string) => void;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export const useQuote = (): QuoteContextType => {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
};

interface QuoteProviderProps {
  children: ReactNode;
}

export const QuoteProvider: React.FC<QuoteProviderProps> = ({ children }) => {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([
    {
      id: 'Q-2025-001',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      requestingUserId: 'colonel-johnson',
      quoteType: 'Daily Quote',
      validUntil: '2025-03-15',
      shipUntil: '2025-04-15',
      customerBidNumber: 'DOD-BID-2025-001',
      purchaseOrderNumber: '',
      status: 'draft',
      lineItems: [
        {
          id: 'CISCO-C9300-48P-1',
          productSku: 'CISCO-C9300-48P',
          productName: 'Cisco Catalyst 9300 48-Port Switch',
          supplier: 'Cisco Systems',
          quantity: 2,
          reserveQuantity: 0,
          unitPrice: 3600,
          unitCost: 3400,
          subtotal: 7200,
          stockOnHand: 48,
          leadTime: '10 days',
          nextAvailableDate: '2025-01-25',
          status: 'pending',
          shippingInstructions: ''
        }
      ],
      totalValue: 7200,
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z'
    },
    {
      id: 'Q-2025-002',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      requestingUserId: 'colonel-johnson',
      quoteType: 'Bid',
      validUntil: '2025-03-12',
      shipUntil: '2025-04-12',
      customerBidNumber: 'DOD-BID-2025-002',
      purchaseOrderNumber: 'PO-2025-456',
      status: 'sent',
      lineItems: [
        {
          id: 'DELL-R7525-001-1',
          productSku: 'DELL-R7525-001',
          productName: 'Dell PowerEdge R7525 Server',
          supplier: 'Dell Technologies',
          quantity: 3,
          reserveQuantity: 3,
          unitPrice: 4600,
          unitCost: 4300,
          subtotal: 13800,
          stockOnHand: 22,
          leadTime: '14 days',
          nextAvailableDate: '2025-01-29',
          status: 'pending',
          shippingInstructions: 'Deliver to loading dock B'
        }
      ],
      totalValue: 13800,
      createdAt: '2025-01-12T14:30:00Z',
      updatedAt: '2025-01-12T14:30:00Z'
    },
    {
      id: 'Q-2024-045',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      requestingUserId: 'colonel-johnson',
      quoteType: 'Daily Quote',
      validUntil: '2025-02-20',
      shipUntil: '2025-03-20',
      customerBidNumber: 'DOD-BID-2024-045',
      purchaseOrderNumber: '',
      status: 'won',
      lineItems: [
        {
          id: 'CISCO-C9300-48P-2',
          productSku: 'CISCO-C9300-48P',
          productName: 'Cisco Catalyst 9300 48-Port Switch',
          supplier: 'Cisco Systems',
          quantity: 2,
          reserveQuantity: 0,
          unitPrice: 3600,
          unitCost: 3400,
          subtotal: 7200,
          stockOnHand: 48,
          leadTime: '10 days',
          nextAvailableDate: '2024-12-30',
          status: 'won',
          shippingInstructions: ''
        }
      ],
      totalValue: 7200,
      createdAt: '2024-12-20T09:15:00Z',
      updatedAt: '2024-12-20T09:15:00Z'
    },
    {
      id: 'Q-2024-032',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      requestingUserId: 'major-smith',
      quoteType: 'Bid',
      validUntil: '2024-12-15',
      shipUntil: '2025-01-15',
      customerBidNumber: 'DOD-BID-2024-032',
      purchaseOrderNumber: '',
      status: 'lost',
      lineItems: [
        {
          id: 'CISCO-C9300-48P-3',
          productSku: 'CISCO-C9300-48P',
          productName: 'Cisco Catalyst 9300 48-Port Switch',
          supplier: 'Cisco Systems',
          quantity: 5,
          reserveQuantity: 0,
          unitPrice: 3450,
          unitCost: 3350,
          subtotal: 17250,
          stockOnHand: 48,
          leadTime: '10 days',
          nextAvailableDate: '2024-10-25',
          status: 'lost',
          shippingInstructions: ''
        }
      ],
      totalValue: 17250,
      createdAt: '2024-10-15T11:45:00Z',
      updatedAt: '2024-10-15T11:45:00Z'
    },
    {
      id: 'Q-2024-018',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      requestingUserId: 'colonel-johnson',
      quoteType: 'Daily Quote',
      validUntil: '2024-09-03',
      shipUntil: '2024-10-03',
      customerBidNumber: 'DOD-BID-2024-018',
      purchaseOrderNumber: 'PO-2024-789',
      status: 'won',
      lineItems: [
        {
          id: 'CISCO-C9300-48P-4',
          productSku: 'CISCO-C9300-48P',
          productName: 'Cisco Catalyst 9300 48-Port Switch',
          supplier: 'Cisco Systems',
          quantity: 1,
          reserveQuantity: 0,
          unitPrice: 3500,
          unitCost: 3400,
          subtotal: 3500,
          stockOnHand: 48,
          leadTime: '8 days',
          nextAvailableDate: '2024-08-11',
          status: 'won',
          shippingInstructions: ''
        }
      ],
      totalValue: 3500,
      createdAt: '2024-08-03T16:20:00Z',
      updatedAt: '2024-08-03T16:20:00Z'
    },
    {
      id: 'Q-2023-089',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      requestingUserId: 'colonel-johnson',
      quoteType: 'Daily Quote',
      validUntil: '2024-01-28',
      shipUntil: '2024-02-28',
      customerBidNumber: 'DOD-BID-2023-089',
      purchaseOrderNumber: 'PO-2023-123',
      status: 'won',
      lineItems: [
        {
          id: 'CISCO-C9300-48P-5',
          productSku: 'CISCO-C9300-48P',
          productName: 'Cisco Catalyst 9300 48-Port Switch',
          supplier: 'Cisco Systems',
          quantity: 4,
          reserveQuantity: 0,
          unitPrice: 3300,
          unitCost: 3100,
          subtotal: 13200,
          stockOnHand: 48,
          leadTime: '10 days',
          nextAvailableDate: '2023-12-08',
          status: 'won',
          shippingInstructions: ''
        }
      ],
      totalValue: 13200,
      createdAt: '2023-11-28T13:10:00Z',
      updatedAt: '2023-11-28T13:10:00Z'
    }
  ]);

  const addQuote = (quote: Quote) => {
    setQuotes(prev => [...prev, quote]);
  };

  const updateQuote = (quoteId: string, updates: Partial<Quote>) => {
    setQuotes(prev => prev.map(quote => 
      quote.id === quoteId ? { ...quote, ...updates } : quote
    ));
    if (currentQuote?.id === quoteId) {
      setCurrentQuote(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteQuote = (quoteId: string) => {
    setQuotes(prev => prev.filter(quote => quote.id !== quoteId));
    if (currentQuote?.id === quoteId) {
      setCurrentQuote(null);
    }
  };

  const addLineItem = (lineItem: QuoteLineItem) => {
    if (currentQuote) {
      const updatedQuote = {
        ...currentQuote,
        lineItems: [...currentQuote.lineItems, lineItem],
        totalValue: currentQuote.totalValue + lineItem.subtotal
      };
      setCurrentQuote(updatedQuote);
    }
  };

  const updateLineItem = (lineItemId: string, updates: Partial<QuoteLineItem>) => {
    if (currentQuote) {
      const updatedLineItems = currentQuote.lineItems.map(item =>
        item.id === lineItemId ? { ...item, ...updates } : item
      );
      const totalValue = updatedLineItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      const updatedQuote = {
        ...currentQuote,
        lineItems: updatedLineItems,
        totalValue
      };
      setCurrentQuote(updatedQuote);
    }
  };

  const removeLineItem = (lineItemId: string) => {
    if (currentQuote) {
      const updatedLineItems = currentQuote.lineItems.filter(item => item.id !== lineItemId);
      const totalValue = updatedLineItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      const updatedQuote = {
        ...currentQuote,
        lineItems: updatedLineItems,
        totalValue
      };
      setCurrentQuote(updatedQuote);
    }
  };

  const value: QuoteContextType = {
    currentQuote,
    quotes,
    setCurrentQuote,
    addQuote,
    updateQuote,
    deleteQuote,
    addLineItem,
    updateLineItem,
    removeLineItem
  };

  return (
    <QuoteContext.Provider value={value}>
      {children}
    </QuoteContext.Provider>
  );
};