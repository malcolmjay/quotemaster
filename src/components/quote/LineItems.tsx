import React, { useState, useRef, useEffect } from 'react';
import { Package, Plus, Upload, Search, ChevronDown, Trash2, Calendar, AlertCircle, Eye, Calculator, FileCheck, Filter, X, Download } from 'lucide-react';
import { ProductModal } from '../catalog/ProductModal';
import { PriceBreakModal } from './PriceBreakModal';
import { SupersessionModal } from './SupersessionModal';
import { HistoryModal } from './HistoryModal';
import { CSVUploadModal } from './CSVUploadModal';
import { LostDetailsModal } from './LostDetailsModal';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { useQuote } from '../../context/QuoteContext';
import { useInventory } from '../../context/InventoryContext';
import { useCustomer } from '../../context/CustomerContext';
import { useDeletion } from '../../hooks/useDeletion';
import { useProducts } from '../../hooks/useSupabaseData';
import { createLostDetailsTable, supabase } from '../../lib/supabase';

const PriceRequestInfo: React.FC<{ itemId: string }> = ({ itemId }) => {
  const [priceRequest, setPriceRequest] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadPriceRequest = async () => {
      try {
        const { data, error } = await supabase
          .from('price_requests')
          .select('*')
          .eq('quote_line_item_id', itemId)
          .eq('status', 'completed')
          .maybeSingle();

        if (error) throw error;
        setPriceRequest(data);
      } catch (error) {
        console.error('Error loading price request:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPriceRequest();
  }, [itemId]);

  type PriceBreak = {
    quantity: number;
    price: number;
  };

  const priceBreaks = React.useMemo(() => {
    return Array.isArray(priceRequest?.price_breaks)
      ? priceRequest.price_breaks as PriceBreak[]
      : [];
  }, [priceRequest]);

  const isPriceExpired = React.useMemo(() => {
    if (!priceRequest?.effective_end_date) return false;
    const endDate = new Date(priceRequest.effective_end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
  }, [priceRequest]);

  if (loading) {
    return null;
  }

  if (!priceRequest) {
    return null;
  }

  const bgColor = isPriceExpired ? 'bg-red-50' : 'bg-green-50';
  const borderColor = isPriceExpired ? 'border-red-200' : 'border-green-200';
  const iconColor = isPriceExpired ? 'text-red-700' : 'text-green-700';
  const textColor = isPriceExpired ? 'text-red-900' : 'text-green-900';
  const labelColor = isPriceExpired ? 'text-red-700' : 'text-green-700';
  const badgeColor = isPriceExpired ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800';

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-3`}>
      <div className="flex items-center space-x-2 mb-3">
        {isPriceExpired ? (
          <AlertCircle className={`h-4 w-4 ${iconColor}`} />
        ) : (
          <FileCheck className={`h-4 w-4 ${iconColor}`} />
        )}
        <h4 className={`font-medium text-sm ${textColor}`}>
          {isPriceExpired ? 'Expired Price Request' : 'Completed Price Request'}
        </h4>
        <span className={`text-xs ${badgeColor} px-2 py-0.5 rounded-full`}>
          {isPriceExpired ? 'EXPIRED' : `Completed ${new Date(priceRequest.completed_at).toLocaleDateString()}`}
        </span>
      </div>
      {isPriceExpired && (
        <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
          <strong>Warning:</strong> This pricing has expired. Please create a new price request to get updated pricing.
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className={`${labelColor} font-medium`}>Supplier:</span>
          <div className={textColor}>{priceRequest.supplier_name || 'N/A'}</div>
        </div>
        <div>
          <span className={`${labelColor} font-medium`}>Supplier Pricing:</span>
          <div className={`${textColor} font-semibold`}>
            ${priceRequest.supplier_pricing?.toFixed(2) || 'N/A'}
          </div>
        </div>
        <div>
          <span className={`${labelColor} font-medium`}>MOQ:</span>
          <div className={textColor}>{priceRequest.moq || 'N/A'}</div>
        </div>
        <div>
          <span className={`${labelColor} font-medium`}>Buyer:</span>
          <div className={textColor}>{priceRequest.buyer_name || 'N/A'}</div>
        </div>
      </div>
      {(priceRequest.effective_start_date || priceRequest.effective_end_date) && (
        <div className="mt-3 text-xs">
          <span className={`${labelColor} font-medium`}>Effective Period:</span>
          <div className={`${textColor} ${isPriceExpired ? 'font-semibold' : ''}`}>
            {priceRequest.effective_start_date || 'N/A'} to {priceRequest.effective_end_date || 'N/A'}
          </div>
        </div>
      )}
      {priceRequest.supplier_quote_number && (
        <div className="mt-3 text-xs">
          <span className={`${labelColor} font-medium`}>Supplier Quote #:</span>
          <div className={textColor}>{priceRequest.supplier_quote_number}</div>
        </div>
      )}
      {priceBreaks.length > 0 && (
        <div className="mt-3">
          <span className={`text-xs ${labelColor} font-medium`}>Price Breaks:</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {priceBreaks.map((pb, i) => (
              <span
                key={i}
                className={`px-2 py-1 ${isPriceExpired ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'} rounded text-xs font-medium`}
              >
                {pb.quantity}+ @ ${pb.price.toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface LineItemsProps {
  onProductSelect: (product: any) => void;
  onShowCostAnalysis: (show: boolean) => void;
  onShowMultiYearPricing?: (lineItem: any) => void;
  supplyPeriodMonths?: number;
  onSetUpdatePriceCallback: (callback: {callback: (itemId: string, price: number) => void, itemId: string} | null) => void;
  lineItems: any[];
  setLineItems: React.Dispatch<React.SetStateAction<any[]>>;
  currentQuote?: any;
  selectedCustomer?: any;
}

export const LineItems: React.FC<LineItemsProps> = ({
  onProductSelect,
  onShowCostAnalysis,
  onShowMultiYearPricing,
  supplyPeriodMonths = 12,
  onSetUpdatePriceCallback,
  lineItems,
  setLineItems,
  currentQuote,
  selectedCustomer
}) => {
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [newItemSku, setNewItemSku] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [showPriceBreakModal, setShowPriceBreakModal] = useState<string | null>(null);
  const [showSupersessionModal, setShowSupersessionModal] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<string | null>(null);
  const [showCSVUploadModal, setShowCSVUploadModal] = useState(false);
  const [csvUploadMode, setCsvUploadMode] = useState<'add' | 'update'>('add');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showLostDetailsModal, setShowLostDetailsModal] = useState<string | null>(null);
  const [customerAddresses, setCustomerAddresses] = useState<any[]>([]);

  // Filter state
  const [filterProductNumber, setFilterProductNumber] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterExpiredCost, setFilterExpiredCost] = useState<'all' | 'expired' | 'valid'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'lost'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Ref for search input
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { addLineItem, updateLineItem } = useQuote();
  const { inventory, reserveInventory, getNextAvailableDate } = useInventory();
  const { customers } = useCustomer();
  const { deleteRecord } = useDeletion();
  const { products } = useProducts();

  const getLineItemCostDates = (item: any) => {
    if (item.cost_effective_from && item.cost_effective_to) {
      return {
        from: item.cost_effective_from,
        to: item.cost_effective_to
      };
    }

    const product = products.find(p => p.sku === item.sku);
    if (product?.cost_effective_from && product?.cost_effective_to) {
      return {
        from: product.cost_effective_from,
        to: product.cost_effective_to
      };
    }

    return { from: null, to: null };
  };

  const isLineItemCostExpired = (item: any): boolean => {
    const dates = getLineItemCostDates(item);
    if (!dates.to) return false;
    const endDate = new Date(dates.to);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
  };

  // Filter line items
  const filteredLineItems = lineItems.filter(item => {
    // Product Number filter
    if (filterProductNumber && !item.sku.toLowerCase().includes(filterProductNumber.toLowerCase())) {
      return false;
    }

    // Supplier filter
    if (filterSupplier && !item.supplier.toLowerCase().includes(filterSupplier.toLowerCase())) {
      return false;
    }

    // Expired Cost filter
    if (filterExpiredCost !== 'all') {
      const isExpired = isLineItemCostExpired(item);
      if (filterExpiredCost === 'expired' && !isExpired) return false;
      if (filterExpiredCost === 'valid' && isExpired) return false;
    }

    // Status filter
    if (filterStatus !== 'all') {
      const itemStatus = item.status || 'pending';
      if (filterStatus !== itemStatus.toLowerCase()) return false;
    }

    return true;
  });

  // Get unique suppliers for filter dropdown
  const uniqueSuppliers = Array.from(new Set(lineItems.map(item => item.supplier))).sort();

  // Clear all filters
  const clearFilters = () => {
    setFilterProductNumber('');
    setFilterSupplier('');
    setFilterExpiredCost('all');
    setFilterStatus('all');
  };

  // Check if any filters are active
  const hasActiveFilters = filterProductNumber || filterSupplier || filterExpiredCost !== 'all' || filterStatus !== 'all';

  // Create lost_details table on component mount if it doesn't exist
  React.useEffect(() => {
    // Migration files should be run manually in Supabase SQL Editor
    // No automatic table creation needed here
  }, []);

  // Hotkey listener for Shift+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'S' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const allProducts = products.map(product => ({
    sku: product.sku,
    name: product.name,
    supplier: product.supplier,
    price: product.list_price,
    unitCost: product.unit_cost,
    stock: product.inventory_levels?.[0]?.quantity_on_hand || 0,
    status: product.status,
    leadTime: product.lead_time_text || `${product.lead_time_days} days`,
    category: product.category,
    warehouse: product.warehouse
  }));

  const [crossReferences, setCrossReferences] = useState<any[]>([]);

  useEffect(() => {
    loadCrossReferences();
  }, []);

  useEffect(() => {
    if (selectedCustomer?.customer_number) {
      loadCustomerAddresses(selectedCustomer.customer_number);
    } else {
      setCustomerAddresses([]);
    }
  }, [selectedCustomer]);

  const loadCrossReferences = async () => {
    try {
      const { data, error } = await supabase
        .from('cross_references')
        .select('*');

      if (error) throw error;
      setCrossReferences(data || []);
    } catch (error) {
      console.error('Error loading cross references:', error);
    }
  };

  const loadCustomerAddresses = async (customerNumber: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_number', customerNumber)
        .eq('is_shipping', true)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setCustomerAddresses(data || []);
    } catch (error) {
      console.error('Error loading customer addresses:', error);
      setCustomerAddresses([]);
    }
  };

  const supplierPriceBreaks = {
    'GM-12635273': [
      { minQty: 1, maxQty: 3, unitCost: 98.50, description: 'Standard pricing', discount: 0 },
      { minQty: 4, maxQty: 9, unitCost: 92.00, description: '4+ units - 6.6% discount', discount: 6.6 },
      { minQty: 10, maxQty: 999, unitCost: 85.50, description: '10+ units - 13.2% discount', discount: 13.2 }
    ],
    'TOY-04465-02190': [
      { minQty: 1, maxQty: 4, unitCost: 52.80, description: 'Standard pricing', discount: 0 },
      { minQty: 5, maxQty: 19, unitCost: 48.00, description: '5+ units - 9% discount', discount: 9 },
      { minQty: 20, maxQty: 999, unitCost: 44.50, description: '20+ units - 15.7% discount', discount: 15.7 }
    ]
  };

  const getOptimalPriceBreak = (sku: string, quantity: number) => {
    const priceBreaks = supplierPriceBreaks[sku as keyof typeof supplierPriceBreaks];
    if (!priceBreaks) return null;
    
    return priceBreaks.find(pb => quantity >= pb.minQty && quantity <= pb.maxQty) || priceBreaks[0];
  };

  const hasRelationships = (sku: string) => {
    const product = products.find(p => p.sku === sku);
    return product && product.status === 'superseded';
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleBulkAction = async (action: string) => {
    const statusMap = {
      'price-request': 'Price Request',
      'lead-time-request': 'Lead Time Request',
      'new-item-request': 'Item Load',
      'no-quote': 'No Quote',
      'reserve-inventory': 'Reserved'
    };

    if (action === 'price-request') {
      await createPriceRequests();
      return;
    }

    const newStatus = statusMap[action as keyof typeof statusMap];
    if (newStatus) {
      setLineItems(prev => prev.map(item =>
        selectedItems.includes(item.id)
          ? { ...item, status: newStatus }
          : item
      ));
    }

    if (action === 'reserve-inventory') {
      selectedItems.forEach(itemId => {
        const item = lineItems.find(li => li.id === itemId);
        if (item && item.reserveQty > 0) {
          reserveInventory(item.sku, item.reserveQty, 'current-quote', itemId);
        }
      });
    }
  };

  const createPriceRequests = async () => {
    if (!currentQuote || !selectedCustomer) {
      alert('Please select a customer and save the quote first');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to create price requests');
        return;
      }

      const selectedLineItems = lineItems.filter(item => selectedItems.includes(item.id));

      if (selectedLineItems.length === 0) {
        alert('No items selected');
        return;
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const hasUnsavedItems = selectedLineItems.some(item => !uuidRegex.test(item.id));

      if (hasUnsavedItems) {
        alert('Please save the quote first before requesting pricing. Some line items have not been saved to the database yet.');
        return;
      }

      for (const item of selectedLineItems) {
        const product = products.find(p => p.sku === item.sku);

        const priceRequestData = {
          quote_id: currentQuote.id,
          quote_line_item_id: item.id,
          product_number: item.sku || 'UNKNOWN',
          description: item.name || 'No description',
          supplier_name: item.supplier || product?.supplier || null,
          buyer_name: product?.buyer || null,
          customer_name: selectedCustomer.name,
          quote_number: currentQuote.quote_number,
          quote_type: currentQuote.quote_type || 'Daily Quote',
          item_quantity: item.qty || 1,
          status: 'pending',
          requested_by: user.id
        };

        console.log('Creating price request with data:', priceRequestData);

        const { data: priceRequest, error: priceRequestError } = await supabase
          .from('price_requests')
          .insert(priceRequestData)
          .select()
          .single();

        if (priceRequestError) {
          console.error('Price request error:', priceRequestError);
          throw new Error(`Failed to create price request: ${priceRequestError.message}`);
        }

        if (!priceRequest) {
          throw new Error('Price request created but no data returned');
        }

        const { error: updateError } = await supabase
          .from('quote_line_items')
          .update({
            status: 'price_request',
            price_request_id: priceRequest.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (updateError) {
          console.error('Line item update error:', updateError);
          throw new Error(`Failed to update line item: ${updateError.message}`);
        }
      }

      setLineItems(prev => prev.map(item =>
        selectedItems.includes(item.id)
          ? { ...item, status: 'Price Request' }
          : item
      ));
      setSelectedItems([]);

      alert(`Successfully created ${selectedLineItems.length} price request(s)`);
    } catch (error: any) {
      console.error('Error creating price requests:', error);
      alert(`Failed to create price requests: ${error.message || 'Unknown error'}`);
    }
  };

  const handleStatusChange = (itemId: string, newStatus: string) => {
    if (newStatus === 'Lost') {
      setShowLostDetailsModal(itemId);
    } else {
      setLineItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      ));
    }
  };

  const handleLostDetailsCancel = () => {
    setShowLostDetailsModal(null);
  };

  const handleLostDetailsSave = (itemId: string, lostDetails: any) => {
    // Update the line item status to Lost
    setLineItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, status: 'Lost' } : item
    ));
    
    // Close the modal
    setShowLostDetailsModal(null);
    
    // Here you would typically save the lost details to the database
    console.log('Lost details saved:', lostDetails);
  };

  const handlePriceEdit = (itemId: string, newPrice: number) => {
    setLineItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            price: newPrice, 
            subtotal: newPrice * item.qty 
          } 
        : item
    ));
    setEditingPrice(null);
  };

  const handleSkuSearch = (value: string) => {
    setNewItemSku(value);
    if (value.length > 1) {
      const productResults = allProducts.filter(product =>
        product.sku.toLowerCase().includes(value.toLowerCase()) ||
        product.name.toLowerCase().includes(value.toLowerCase())
      );

      const crossRefResults = crossReferences.filter(ref =>
        ref.customer_part_number?.toLowerCase().includes(value.toLowerCase()) ||
        ref.supplier_part_number?.toLowerCase().includes(value.toLowerCase()) ||
        ref.internal_part_number?.toLowerCase().includes(value.toLowerCase())
      ).map(ref => {
        const product = allProducts.find(p => p.sku === ref.internal_part_number);
        return product ? {
          ...product,
          matchedReference: ref,
          displayName: `${product.name} (Cross-Ref: ${ref.customer_part_number || ref.supplier_part_number})`
        } : null;
      }).filter(Boolean);

      const combinedResults = [...productResults];
      crossRefResults.forEach(crossRef => {
        if (!combinedResults.find(p => p.sku === crossRef.sku)) {
          combinedResults.push(crossRef);
        }
      });

      setSearchResults(combinedResults);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleProductSelect = (product: any) => {
    const optimalPriceBreak = getOptimalPriceBreak(product.sku, 1);
    const unitCost = optimalPriceBreak ? optimalPriceBreak.unitCost : (product.unitCost || product.price * 0.7);
    const inventoryItem = inventory.find(item => item.sku === product.sku);

    const newItem = {
      id: `local-${product.sku}-${Date.now()}`,
      sku: product.sku,
      name: product.name,
      supplier: product.supplier,
      category: product.category || 'General',
      qty: 1,
      reserveQty: 0,
      price: 0,
      cost: unitCost,
      subtotal: 0,
      stock: inventoryItem?.quantityOnHand || product.stock || 0,
      available: getNextAvailableDate(product.sku, 1),
      cost_effective_from: product.cost_effective_from,
      cost_effective_to: product.cost_effective_to,
      buyer: product.buyer,
      status: 'Pending',
      leadTime: product.leadTime || '10 days',
      quotedLeadTime: '',
      warehouse: 'wh-main',
      reserved: '0 / 1 units',
      shippingInstructions: '',
      crossReference: product.matchedReference || null,
      customerPartNumber: product.matchedReference?.customer_part_number || '',
      crossReferenceType: product.matchedReference?.type || '',
      selectedPriceBreak: optimalPriceBreak,
      stockingRequired: false,
      partStatus: product.status,
      supersessionInfo: product.supersessionInfo,
      application: product.application
    };

    setLineItems(prev => [...prev, newItem]);
    setNewItemSku('');
    setShowSearchResults(false);
  };

  const handleCSVUpload = (items: any[], mode: 'add' | 'update') => {
    if (mode === 'add') {
      items.forEach(item => {
        setLineItems(prev => [...prev, item]);
      });
    } else {
      // Update mode - match by ID or SKU
      items.forEach(updateItem => {
        setLineItems(prev => prev.map(existingItem => {
          // Match by ID first (if it's a valid database ID), then by SKU
          const matches = updateItem.id === existingItem.id ||
                         (updateItem.sku === existingItem.sku && !updateItem.id);

          if (matches) {
            return {
              ...existingItem,
              ...updateItem,
              id: existingItem.id, // Preserve original ID
              subtotal: updateItem.price * updateItem.qty
            };
          }
          return existingItem;
        }));
      });
    }
    setShowCSVUploadModal(false);
  };

  const exportToCSV = () => {
    if (lineItems.length === 0) {
      alert('No line items to export');
      return;
    }

    // Define CSV headers
    const headers = [
      'id',
      'sku',
      'name',
      'supplier',
      'category',
      'qty',
      'price',
      'cost',
      'status',
      'leadTime',
      'quotedLeadTime',
      'shippingInstructions',
      'ship_to_address_id',
      'customerPartNumber',
      'warehouse',
      'stock',
      'available'
    ];

    // Create CSV rows
    const rows = lineItems.map(item => [
      item.id || '',
      item.sku || '',
      item.name || '',
      item.supplier || '',
      item.category || '',
      item.qty || '',
      item.price || '',
      item.cost || '',
      item.status || '',
      item.leadTime || '',
      item.quotedLeadTime || '',
      item.shippingInstructions || '',
      item.ship_to_address_id || '',
      item.customerPartNumber || '',
      item.warehouse || '',
      item.stock || '',
      item.available || ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape commas and quotes in cell values
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `line_items_${currentQuote?.quote_number || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteItem = (itemId: string) => {
    setShowDeleteModal(itemId);
  };

  const confirmDeleteItem = async () => {
    if (!showDeleteModal) return;

    setDeleteLoading(true);
    try {
      const itemToDelete = lineItems.find(item => item.id === showDeleteModal);
      console.log('🗑️ Deleting line item:', itemToDelete);

      // Check if this is a local item (starts with "local-") or a database UUID
      const isLocalItem = showDeleteModal.startsWith('local-');

      if (isLocalItem) {
        // Just remove from local state
        console.log('📝 Deleting local-only line item (not yet in database)');
        setLineItems(prev => prev.filter(item => item.id !== showDeleteModal));
      } else {
        // This is a database record - delete from database
        console.log('📤 Deleting from database:', showDeleteModal);
        const result = await deleteRecord('quote_line_items', showDeleteModal, {
          type: 'hard',
          reason: 'User deleted line item from quote'
        });

        if (!result.success) {
          console.error('❌ Database deletion failed:', result.errors);
        } else {
          console.log('✅ Line item deleted from database successfully');
          // Remove from local state only after successful database deletion
          setLineItems(prev => prev.filter(item => item.id !== showDeleteModal));
        }
      }

    } catch (error) {
      console.error('❌ Error deleting line item:', error);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(null);
    }
  };

  const handlePriceBreakSelect = (itemId: string, priceBreak: any) => {
    setLineItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            cost: priceBreak.unitCost,
            price: Math.round(priceBreak.unitCost * 1.25),
            subtotal: Math.round(priceBreak.unitCost * 1.25) * item.qty,
            selectedPriceBreak: priceBreak
          } 
        : item
    ));
    setShowPriceBreakModal(null);
  };

  const handleSupersessionSelect = (itemId: string, replacement: any) => {
    setLineItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item,
            originalCustomerSku: item.originalCustomerSku || item.sku,
            originalCustomerName: item.originalCustomerName || item.name,
            sku: replacement.sku,
            name: replacement.name,
            supplier: replacement.supplier,
            cost: replacement.cost,
            price: Math.round(replacement.cost * 1.25),
            subtotal: Math.round(replacement.cost * 1.25) * item.qty,
            stock: replacement.stock,
            leadTime: replacement.leadTime,
            isReplacement: true,
            replacementType: replacement.relationshipType,
            replacementReason: replacement.reason
          } 
        : item
    ));
    setShowSupersessionModal(null);
  };

  const updateItemPrice = (itemId: string, newPrice: number) => {
    setLineItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            price: newPrice, 
            subtotal: newPrice * item.qty 
          } 
        : item
    ));
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Header Section - Simplified */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Line Items</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Add and configure products for this quote</p>
          </div>
          
          {/* Action Buttons - Simplified */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products... (Shift+S)"
                value={newItemSku}
                onChange={(e) => handleSkuSearch(e.target.value)}
                className="w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {searchResults.map((product) => (
                    <button
                      key={product.sku}
                      onClick={() => handleProductSelect(product)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{product.sku}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{product.displayName || product.name}</div>
                      <div className="text-xs text-blue-600">{product.supplier} • ${product.price.toLocaleString()}</div>
                      {product.matchedReference && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900 px-2 py-0.5 rounded">
                            Cross-Ref: {product.matchedReference.customer_part_number || product.matchedReference.supplier_part_number}
                          </span>
                          {product.matchedReference.type && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {product.matchedReference.type}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowProductModal(true)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Browse Catalog
            </button>

            {lineItems.length > 0 && (
              <>
                <button
                  onClick={exportToCSV}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2 inline" />
                  Export CSV
                </button>

                <button
                  onClick={() => {
                    setCsvUploadMode('update');
                    setShowCSVUploadModal(true);
                  }}
                  className="px-3 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2 inline" />
                  Update CSV
                </button>
              </>
            )}

            <button
              onClick={() => {
                setCsvUploadMode('add');
                setShowCSVUploadModal(true);
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4 mr-2 inline" />
              Import CSV
            </button>
          </div>
        </div>
        
        {/* Bulk Actions - Only show when items selected */}
        {selectedItems.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('price-request')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Request Pricing
                </button>
                <button
                  onClick={() => handleBulkAction('lead-time-request')}
                  className="px-3 py-1 border border-blue-600 text-blue-600 rounded text-sm hover:bg-blue-50 transition-colors"
                >
                  Request Lead Time
                </button>
                <button
                  onClick={() => setSelectedItems([])}
                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Section */}
        <div className="mt-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </button>

          {showFilters && (
            <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Product Number Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Number
                  </label>
                  <input
                    type="text"
                    value={filterProductNumber}
                    onChange={(e) => setFilterProductNumber(e.target.value)}
                    placeholder="Filter by SKU..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Supplier Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Supplier
                  </label>
                  <select
                    value={filterSupplier}
                    onChange={(e) => setFilterSupplier(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Suppliers</option>
                    {uniqueSuppliers.map(supplier => (
                      <option key={supplier} value={supplier}>{supplier}</option>
                    ))}
                  </select>
                </div>

                {/* Expired Cost Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cost Status
                  </label>
                  <select
                    value={filterExpiredCost}
                    onChange={(e) => setFilterExpiredCost(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Costs</option>
                    <option value="valid">Valid Costs</option>
                    <option value="expired">Expired Costs</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
              {hasActiveFilters && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Showing {filteredLineItems.length} of {lineItems.length} items
                  </span>
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-1 px-3 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expired Cost Alert */}
      {lineItems.some(item => isLineItemCostExpired(item)) && (
        <div className="mx-6 mt-4 mb-2 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800 mb-1">Expired Product Costs Detected</h3>
            <p className="text-sm text-red-700">
              One or more line items have expired cost effective dates. Please review and update the affected products to reflect current pricing.
            </p>
          </div>
        </div>
      )}

      {/* Data Table - Clean and Focused */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-12 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedItems(lineItems.map(item => item.id));
                    } else {
                      setSelectedItems([]);
                    }
                  }}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredLineItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <tr className={`transition-colors ${
                  expandedItem === item.id ? 'bg-blue-50 dark:bg-blue-900/20' :
                  index % 2 === 0 ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-650'
                } ${
                  selectedItems.includes(item.id) ? 'ring-2 ring-blue-500 ring-inset' : ''
                }`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleItemSelect(item.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  
                  {/* Product Column - Primary Information */}
                  <td className="px-4 py-4">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="mt-1 p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                          expandedItem === item.id ? 'rotate-180' : ''
                        }`} />
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm text-gray-900">{item.sku}</span>
                          {hasRelationships(item.sku) && (
                            <button
                              onClick={() => setShowSupersessionModal(item.id)}
                              className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
                              title="Alternatives Available"
                            >
                              <AlertCircle className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 truncate">{item.name}</div>
                        <div className="text-xs text-blue-600">{item.supplier}</div>
                        
                        {/* Status Indicators - Minimal */}
                        <div className="flex items-center space-x-2 mt-1">
                          {item.isReplacement && (
                            <span className="text-xs px-1 py-0.5 bg-orange-100 text-orange-700 rounded">
                              Replacement
                            </span>
                          )}
                          {item.selectedPriceBreak && item.selectedPriceBreak.discount > 0 && (
                            <span className="text-xs px-1 py-0.5 bg-green-100 text-green-700 rounded">
                              {item.selectedPriceBreak.discount}% discount
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Quantity - Editable */}
                  <td className="px-4 py-4 text-center">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        const newQty = parseInt(e.target.value) || 1;
                        const optimalPriceBreak = getOptimalPriceBreak(item.sku, newQty);
                        const newCost = optimalPriceBreak ? optimalPriceBreak.unitCost : item.cost;
                        
                        setLineItems(prev => prev.map(li => 
                          li.id === item.id 
                            ? { 
                                ...li, 
                                qty: newQty, 
                                cost: newCost,
                                subtotal: li.price * newQty,
                                available: getNextAvailableDate(li.sku, newQty),
                                selectedPriceBreak: optimalPriceBreak
                              } 
                            : li
                        ));
                      }}
                      className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="1"
                    />
                  </td>
                  
                  {/* Unit Price - Editable with Margin Indicator */}
                  <td className="px-4 py-4 text-right">
                    {editingPrice === item.id ? (
                      <input
                        type="number"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(parseFloat(e.target.value) || 0)}
                        onBlur={() => handlePriceEdit(item.id, tempPrice)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handlePriceEdit(item.id, tempPrice);
                          }
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-right text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        autoFocus
                        step="0.01"
                      />
                    ) : (
                      <div>
                        <button
                          onClick={() => {
                            setEditingPrice(item.id);
                            setTempPrice(item.price);
                          }}
                          className="text-right hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                        >
                          {item.price === 0 ? (
                            <span className="text-gray-400 italic text-sm">Enter price</span>
                          ) : (
                            <span className="font-medium text-sm">${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          )}
                        </button>
                        {item.price > 0 && item.cost > 0 && (
                          <div className={`text-xs mt-1 ${
                            ((item.price - item.cost) / item.price) * 100 >= 20 ? 'text-green-600' :
                            ((item.price - item.cost) / item.price) * 100 >= 10 ? 'text-gray-600' : 'text-red-600'
                          }`}>
                            {(((item.price - item.cost) / item.price) * 100).toFixed(1)}% margin
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  
                  {/* Unit Cost - With Price Break Indicator */}
                  <td className={`px-4 py-4 text-right ${isLineItemCostExpired(item) ? 'bg-red-50' : ''}`}>
                    <button
                      onClick={() => setShowPriceBreakModal(item.id)}
                      className={`text-right px-2 py-1 rounded transition-colors group ${
                        isLineItemCostExpired(item)
                          ? 'hover:bg-red-100'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className={`font-medium text-sm ${
                        isLineItemCostExpired(item) ? 'text-red-700' : ''
                      }`}>
                        ${item.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <ChevronDown className={`h-3 w-3 inline ml-1 ${
                        isLineItemCostExpired(item)
                          ? 'text-red-500 group-hover:text-red-700'
                          : 'text-gray-400 group-hover:text-gray-600'
                      }`} />
                    </button>
                    {isLineItemCostExpired(item) && (
                      <div className="flex items-center justify-end space-x-1 mt-1">
                        <AlertCircle className="h-3 w-3 text-red-600" />
                        <span className="text-xs text-red-600 font-medium">EXPIRED</span>
                      </div>
                    )}
                  </td>
                  
                  {/* Subtotal */}
                  <td className="px-4 py-4 text-right">
                    <span className="font-semibold text-gray-900 text-sm">
                      ${item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  
                  {/* Stock - Simple Indicator */}
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        item.stock > 10 ? 'bg-green-500' : 
                        item.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm text-gray-700">{item.stock}</span>
                    </div>
                  </td>
                  
                  {/* Lead Time - Editable */}
                  <td className="px-4 py-4 text-center">
                    <input
                      type="text"
                      value={item.quotedLeadTime || ''}
                      onChange={(e) => {
                        setLineItems(prev => prev.map(li => 
                          li.id === item.id ? { ...li, quotedLeadTime: e.target.value } : li
                        ));
                      }}
                      placeholder="Enter lead time"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  
                  {/* Status - Clean Dropdown */}
                  <td className="px-4 py-4 text-center">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs focus:ring-2 focus:ring-blue-500 ${
                        item.status === 'Won' ? 'bg-green-50 text-green-800 border-green-300' :
                        item.status === 'Lost' ? 'bg-red-50 text-red-800 border-red-300' :
                        item.status === 'Price Request' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                        'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                      <option value="Price Request">Price Request</option>
                      <option value="Lead Time Request">Lead Time Request</option>
                      <option value="No Quote">No Quote</option>
                    </select>
                  </td>
                  
                  {/* Actions - Essential Only */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      {supplyPeriodMonths > 12 && (
                        <button
                          onClick={() => onShowMultiYearPricing && onShowMultiYearPricing(item)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="Multi-Year Pricing"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onProductSelect(item);
                          onSetUpdatePriceCallback({
                            callback: updateItemPrice,
                            itemId: item.id
                          });
                          onShowCostAnalysis(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Cost Analysis"
                      >
                        <Calculator className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowHistoryModal(item.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="View History"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded Details - Clean Layout */}
                {expandedItem === item.id && (
                  <tr className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                    <td colSpan={10} className="px-6 py-4">
                      <div className="space-y-4">
                        {/* Price Request Info */}
                        <PriceRequestInfo itemId={item.id} />

                        {/* Cross-Reference Info */}
                        {item.crossReference && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">Cross-Reference Information</h4>
                              {item.crossReference.type && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100">
                                  {item.crossReference.type}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              {item.crossReference.customer_part_number && (
                                <div>
                                  <span className="text-blue-700 dark:text-blue-300 font-medium">Customer Part:</span>
                                  <div className="text-blue-900 dark:text-blue-100">{item.crossReference.customer_part_number}</div>
                                </div>
                              )}
                              {item.crossReference.supplier_part_number && (
                                <div>
                                  <span className="text-blue-700 dark:text-blue-300 font-medium">Supplier Part:</span>
                                  <div className="text-blue-900 dark:text-blue-100">{item.crossReference.supplier_part_number}</div>
                                </div>
                              )}
                              <div>
                                <span className="text-blue-700 dark:text-blue-300 font-medium">Internal Part:</span>
                                <div className="text-blue-900 dark:text-blue-100">{item.crossReference.internal_part_number}</div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Replacement Info */}
                        {item.isReplacement && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <h4 className="font-medium text-sm text-orange-900 mb-2">Product Replacement</h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-orange-700 font-medium">Original Request:</span>
                                <div className="text-orange-900">{item.originalCustomerSku}</div>
                                <div className="text-orange-800">{item.originalCustomerName}</div>
                              </div>
                              <div>
                                <span className="text-orange-700 font-medium">Replacement Reason:</span>
                                <div className="text-orange-900">{item.replacementReason}</div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Ship-To Address */}
                        {customerAddresses.length > 0 && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Ship-To Address
                            </label>
                            <select
                              value={item.ship_to_address_id || ''}
                              onChange={(e) => {
                                setLineItems(prev => prev.map(li =>
                                  li.id === item.id ? { ...li, ship_to_address_id: e.target.value || null } : li
                                ));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                              <option value="">Use customer's primary address</option>
                              {customerAddresses.map((address) => (
                                <option key={address.id} value={address.id}>
                                  {address.address_line_1}, {address.city}, {address.state} {address.postal_code}
                                  {address.is_primary && ' (Primary)'}
                                </option>
                              ))}
                            </select>
                            {item.ship_to_address_id && (() => {
                              const selectedAddress = customerAddresses.find(a => a.id === item.ship_to_address_id);
                              if (!selectedAddress) return null;
                              return (
                                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                                  <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">Selected Ship-To Address:</div>
                                  <div className="text-blue-800 dark:text-blue-200">
                                    {selectedAddress.address_line_1}
                                    {selectedAddress.address_line_2 && <><br/>{selectedAddress.address_line_2}</>}
                                    {selectedAddress.address_line_3 && <><br/>{selectedAddress.address_line_3}</>}
                                    <br/>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postal_code}
                                    <br/>{selectedAddress.country}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Shipping Instructions */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Shipping Instructions
                          </label>
                          <textarea
                            value={item.shippingInstructions || ''}
                            onChange={(e) => {
                              setLineItems(prev => prev.map(li =>
                                li.id === item.id ? { ...li, shippingInstructions: e.target.value } : li
                              ));
                            }}
                            placeholder="Enter any special shipping requirements..."
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        
                        {/* Cost Effective Dates */}
                        {(() => {
                          const dates = getLineItemCostDates(item);
                          if (!dates.from && !dates.to) return null;

                          return (
                            <div className={`border rounded-lg p-3 ${
                              isLineItemCostExpired(item)
                                ? 'bg-red-50 border-red-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className={`font-medium text-sm ${
                                  isLineItemCostExpired(item) ? 'text-red-900' : 'text-gray-900'
                                }`}>
                                  Cost Effective Period
                                </h4>
                                {isLineItemCostExpired(item) && (
                                  <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-medium">
                                    EXPIRED
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                {dates.from && (
                                  <div>
                                    <span className={`font-medium ${
                                      isLineItemCostExpired(item) ? 'text-red-700' : 'text-gray-700'
                                    }`}>
                                      Effective From:
                                    </span>
                                    <div className={isLineItemCostExpired(item) ? 'text-red-900' : 'text-gray-600'}>
                                      {new Date(dates.from).toLocaleDateString()}
                                    </div>
                                  </div>
                                )}
                                {dates.to && (
                                  <div>
                                    <span className={`font-medium ${
                                      isLineItemCostExpired(item) ? 'text-red-700' : 'text-gray-700'
                                    }`}>
                                      Effective To:
                                    </span>
                                    <div className={isLineItemCostExpired(item) ? 'text-red-900' : 'text-gray-600'}>
                                      {new Date(dates.to).toLocaleDateString()}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {isLineItemCostExpired(item) && (
                                <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
                                  <strong>Warning:</strong> This cost has expired. Please update the product cost to reflect current pricing.
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Additional Details */}
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="font-medium text-gray-700">Warehouse:</span>
                            <div className="text-gray-600">{item.warehouse}</div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Available Date:</span>
                            <div className="text-gray-600">{item.available}</div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Reserved:</span>
                            <div className="text-gray-600">{item.reserved}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            
            {/* Empty State */}
            {lineItems.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <Package className="h-16 w-16 text-gray-300" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No items added yet</h3>
                      <p className="text-sm text-gray-600 mb-4">Start building your quote by adding products</p>
                      <button
                        onClick={() => setShowProductModal(true)}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Product
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* No Results State */}
            {lineItems.length > 0 && filteredLineItems.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <Filter className="h-16 w-16 text-gray-300" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No items match your filters</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Try adjusting your filter criteria</p>
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modals */}
      {showProductModal && (
        <ProductModal 
          onClose={() => setShowProductModal(false)} 
          onProductSelect={handleProductSelect}
        />
      )}
      
      {showPriceBreakModal && (
        (() => {
          const item = lineItems.find(item => item.id === showPriceBreakModal);
          return item ? (
            <PriceBreakModal
              item={item}
              onClose={() => setShowPriceBreakModal(null)}
              onPriceBreakSelect={handlePriceBreakSelect}
            />
          ) : null;
        })()
      )}
     
      {showSupersessionModal && (
        <SupersessionModal
          item={lineItems.find(item => item.id === showSupersessionModal)}
          onClose={() => setShowSupersessionModal(null)}
          onSelectReplacement={handleSupersessionSelect}
        />
      )}
      
      {showHistoryModal && (
        <HistoryModal
          item={lineItems.find(item => item.id === showHistoryModal)}
          currentQuoteId={currentQuote?.id}
          customerId={selectedCustomer?.id}
          onClose={() => setShowHistoryModal(null)}
        />
      )}
      
      {showCSVUploadModal && (
        <CSVUploadModal
          onClose={() => setShowCSVUploadModal(false)}
          onUpload={handleCSVUpload}
          mode={csvUploadMode}
          existingLineItems={lineItems}
        />
      )}
      
      {showDeleteModal && (
        <DeleteConfirmationModal
          isOpen={true}
          onClose={() => setShowDeleteModal(null)}
          onConfirm={confirmDeleteItem}
          title="Delete Line Item"
          message="Are you sure you want to delete this line item from the quote?"
          itemName={lineItems.find(item => item.id === showDeleteModal)?.name || 'Unknown Item'}
          deleteType="hard"
          loading={deleteLoading}
          cascadeWarning="This will permanently remove the line item from the quote and cannot be undone."
        />
      )}
      
      {showLostDetailsModal && (
        <LostDetailsModal
          lineItem={lineItems.find(item => item.id === showLostDetailsModal)}
          onClose={handleLostDetailsCancel}
          onSave={handleLostDetailsSave}
          isOpen={true}
        />
      )}
    </div>
  );
};