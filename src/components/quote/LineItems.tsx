import React, { useState, useRef, useEffect } from 'react';
import { Package, Plus, Upload, Search, ChevronDown, Trash2, Calendar, AlertCircle, Eye, Calculator, FileCheck, Filter, X, Download, ChevronRight } from 'lucide-react';
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
import { supabase } from '../../lib/supabase';

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

  type PriceBreak = { quantity: number; price: number };

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

  if (loading || !priceRequest) return null;

  return (
    <div className={`rounded p-3 ${isPriceExpired ? 'bg-[#f2dede] border border-[#ebccd1]' : 'bg-[#dff0d8] border border-[#d6e9c6]'}`}>
      <div className="flex items-center gap-2 mb-2">
        {isPriceExpired ? (
          <AlertCircle className="h-4 w-4 text-[#a94442]" />
        ) : (
          <FileCheck className="h-4 w-4 text-[#3c763d]" />
        )}
        <span className={`text-xs font-medium ${isPriceExpired ? 'text-[#a94442]' : 'text-[#3c763d]'}`}>
          {isPriceExpired ? 'Expired Pricing' : 'Confirmed Pricing'}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[#666]">Supplier Price:</span>
          <div className="font-semibold text-[#333]">${priceRequest.supplier_pricing?.toFixed(2)}</div>
        </div>
        <div>
          <span className="text-[#666]">MOQ:</span>
          <div className="font-semibold text-[#333]">{priceRequest.moq || 'N/A'}</div>
        </div>
        <div>
          <span className="text-[#666]">Valid Until:</span>
          <div className={`font-semibold ${isPriceExpired ? 'text-[#a94442]' : 'text-[#333]'}`}>
            {priceRequest.effective_end_date || 'N/A'}
          </div>
        </div>
        {priceBreaks.length > 0 && (
          <div>
            <span className="text-[#666]">Price Breaks:</span>
            <div className="flex gap-1 mt-0.5">
              {priceBreaks.slice(0, 2).map((pb, i) => (
                <span key={i} className={`px-1.5 py-0.5 rounded text-xs ${isPriceExpired ? 'bg-[#f2dede]' : 'bg-[#dff0d8]'}`}>
                  {pb.quantity}+ @ ${pb.price}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
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
  const [filterProductNumber, setFilterProductNumber] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterExpiredCost, setFilterExpiredCost] = useState<'all' | 'expired' | 'valid'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'lost'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const { addLineItem, updateLineItem } = useQuote();
  const { inventory, reserveInventory, getNextAvailableDate } = useInventory();
  const { deleteRecord } = useDeletion();
  const { products } = useProducts();

  const getLineItemCostDates = (item: any) => {
    if (item.cost_effective_from && item.cost_effective_to) {
      return { from: item.cost_effective_from, to: item.cost_effective_to };
    }
    const product = products.find(p => p.sku === item.sku);
    if (product?.cost_effective_from && product?.cost_effective_to) {
      return { from: product.cost_effective_from, to: product.cost_effective_to };
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

  const filteredLineItems = lineItems.filter(item => {
    if (filterProductNumber && !item.sku.toLowerCase().includes(filterProductNumber.toLowerCase())) return false;
    if (filterSupplier && !item.supplier.toLowerCase().includes(filterSupplier.toLowerCase())) return false;
    if (filterExpiredCost !== 'all') {
      const isExpired = isLineItemCostExpired(item);
      if (filterExpiredCost === 'expired' && !isExpired) return false;
      if (filterExpiredCost === 'valid' && isExpired) return false;
    }
    if (filterStatus !== 'all') {
      const itemStatus = item.status || 'pending';
      if (filterStatus !== itemStatus.toLowerCase()) return false;
    }
    return true;
  });

  const uniqueSuppliers = Array.from(new Set(lineItems.map(item => item.supplier))).sort();
  const clearFilters = () => {
    setFilterProductNumber('');
    setFilterSupplier('');
    setFilterExpiredCost('all');
    setFilterStatus('all');
  };
  const hasActiveFilters = filterProductNumber || filterSupplier || filterExpiredCost !== 'all' || filterStatus !== 'all';

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
    const loadCrossReferences = async () => {
      try {
        const { data, error } = await supabase.from('cross_references').select('*');
        if (error) throw error;
        setCrossReferences(data || []);
      } catch (error) {
        console.error('Error loading cross references:', error);
      }
    };
    loadCrossReferences();
  }, []);

  useEffect(() => {
    if (selectedCustomer?.customer_number) {
      const loadCustomerAddresses = async () => {
        try {
          const { data, error } = await supabase
            .from('customer_addresses')
            .select('*')
            .eq('customer_number', selectedCustomer.customer_number)
            .eq('is_shipping', true)
            .order('is_primary', { ascending: false });
          if (error) throw error;
          setCustomerAddresses(data || []);
        } catch (error) {
          console.error('Error loading customer addresses:', error);
          setCustomerAddresses([]);
        }
      };
      loadCustomerAddresses();
    } else {
      setCustomerAddresses([]);
    }
  }, [selectedCustomer]);

  const supplierPriceBreaks: Record<string, Array<{ minQty: number; maxQty: number; unitCost: number; description: string; discount: number }>> = {
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
    const priceBreaks = supplierPriceBreaks[sku];
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
    const statusMap: Record<string, string> = {
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

    const newStatus = statusMap[action];
    if (newStatus) {
      setLineItems(prev => prev.map(item =>
        selectedItems.includes(item.id) ? { ...item, status: newStatus } : item
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
        alert('Please save the quote first before requesting pricing.');
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

        const { data: priceRequest, error: priceRequestError } = await supabase
          .from('price_requests')
          .insert(priceRequestData)
          .select()
          .single();

        if (priceRequestError) throw new Error(`Failed to create price request: ${priceRequestError.message}`);

        await supabase
          .from('quote_line_items')
          .update({ status: 'price_request', price_request_id: priceRequest.id, updated_at: new Date().toISOString() })
          .eq('id', item.id);
      }

      setLineItems(prev => prev.map(item =>
        selectedItems.includes(item.id) ? { ...item, status: 'Price Request' } : item
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

  const handlePriceEdit = (itemId: string, newPrice: number) => {
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, price: newPrice, subtotal: newPrice * item.qty } : item
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
        if (crossRef && !combinedResults.find(p => p.sku === crossRef.sku)) {
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
      items.forEach(item => setLineItems(prev => [...prev, item]));
    } else {
      items.forEach(updateItem => {
        setLineItems(prev => prev.map(existingItem => {
          const matches = updateItem.id === existingItem.id || (updateItem.sku === existingItem.sku && !updateItem.id);
          if (matches) {
            return { ...existingItem, ...updateItem, id: existingItem.id, subtotal: updateItem.price * updateItem.qty };
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

    const headers = ['id', 'sku', 'name', 'supplier', 'category', 'qty', 'price', 'cost', 'status', 'leadTime', 'quotedLeadTime', 'shippingInstructions', 'ship_to_address_id', 'customerPartNumber', 'warehouse', 'stock', 'available'];
    const rows = lineItems.map(item => [
      item.id || '', item.sku || '', item.name || '', item.supplier || '', item.category || '', item.qty || '',
      item.price || '', item.cost || '', item.status || '', item.leadTime || '', item.quotedLeadTime || '',
      item.shippingInstructions || '', item.ship_to_address_id || '', item.customerPartNumber || '', item.warehouse || '',
      item.stock || '', item.available || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

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
    setActionMenuOpen(null);
  };

  const confirmDeleteItem = async () => {
    if (!showDeleteModal) return;
    setDeleteLoading(true);
    try {
      const isLocalItem = showDeleteModal.startsWith('local-');
      if (isLocalItem) {
        setLineItems(prev => prev.filter(item => item.id !== showDeleteModal));
      } else {
        const result = await deleteRecord('quote_line_items', showDeleteModal, { type: 'hard', reason: 'User deleted line item from quote' });
        if (result.success) {
          setLineItems(prev => prev.filter(item => item.id !== showDeleteModal));
        }
      }
    } catch (error) {
      console.error('Error deleting line item:', error);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(null);
    }
  };

  const handlePriceBreakSelect = (itemId: string, priceBreak: any) => {
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? {
        ...item, cost: priceBreak.unitCost, price: Math.round(priceBreak.unitCost * 1.25),
        subtotal: Math.round(priceBreak.unitCost * 1.25) * item.qty, selectedPriceBreak: priceBreak
      } : item
    ));
    setShowPriceBreakModal(null);
  };

  const handleSupersessionSelect = (itemId: string, replacement: any) => {
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? {
        ...item, originalCustomerSku: item.originalCustomerSku || item.sku, originalCustomerName: item.originalCustomerName || item.name,
        sku: replacement.sku, name: replacement.name, supplier: replacement.supplier, cost: replacement.cost,
        price: Math.round(replacement.cost * 1.25), subtotal: Math.round(replacement.cost * 1.25) * item.qty,
        stock: replacement.stock, leadTime: replacement.leadTime, isReplacement: true,
        replacementType: replacement.relationshipType, replacementReason: replacement.reason
      } : item
    ));
    setShowSupersessionModal(null);
  };

  const updateItemPrice = (itemId: string, newPrice: number) => {
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, price: newPrice, subtotal: newPrice * item.qty } : item
    ));
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const expiredCount = lineItems.filter(item => isLineItemCostExpired(item)).length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded border border-[#d4d4d4] dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#d4d4d4] dark:border-slate-700 bg-[#f0f0f0] dark:bg-slate-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#d9edf7] flex items-center justify-center">
              <Package className="w-5 h-5 text-[#31708f]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#333] dark:text-white">Line Items</h3>
              <p className="text-xs text-[#666] dark:text-slate-400">
                {lineItems.length} items
                {expiredCount > 0 && <span className="text-[#a94442] ml-1">({expiredCount} expired)</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999]" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Add product (Shift+S)"
                value={newItemSku}
                onChange={(e) => handleSkuSearch(e.target.value)}
                className="w-56 pl-9 pr-3 py-2 bg-white dark:bg-slate-700 border border-[#d4d4d4] dark:border-slate-600 rounded text-sm focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca]"
              />
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-[#d4d4d4] dark:border-slate-700 rounded shadow-lg z-20 max-h-64 overflow-y-auto">
                  {searchResults.slice(0, 10).map((product) => (
                    <button
                      key={product.sku}
                      onClick={() => handleProductSelect(product)}
                      className="w-full px-3 py-2.5 text-left hover:bg-[#f0f0f0] dark:hover:bg-slate-700 border-b border-[#e8e8e8] dark:border-slate-700 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-[#333] dark:text-white">{product.sku}</div>
                          <div className="text-xs text-[#666] truncate">{product.name}</div>
                        </div>
                        <div className="text-xs text-[#428bca]">${product.price?.toLocaleString()}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowProductModal(true)}
              className="px-3 py-2 text-sm text-[#333] dark:text-slate-300 hover:bg-[#e8e8e8] dark:hover:bg-slate-700 rounded transition-colors"
            >
              Browse
            </button>

            <div className="h-5 w-px bg-[#d4d4d4] dark:bg-slate-600" />

            <button
              onClick={() => { setCsvUploadMode('add'); setShowCSVUploadModal(true); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#428bca] hover:bg-[#3276b1] text-white text-sm font-medium rounded transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>

            {lineItems.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#333] dark:text-slate-300 hover:bg-[#e8e8e8] dark:hover:bg-slate-700 rounded transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
        </div>

        {selectedItems.length > 0 && (
          <div className="mt-3 flex items-center justify-between py-2 px-3 bg-[#d9edf7] dark:bg-blue-900/20 rounded border border-[#bce8f1]">
            <span className="text-sm font-medium text-[#31708f] dark:text-blue-200">
              {selectedItems.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => handleBulkAction('price-request')} className="px-3 py-1.5 bg-[#428bca] text-white text-xs font-medium rounded hover:bg-[#3276b1]">
                Request Pricing
              </button>
              <button onClick={() => handleBulkAction('lead-time-request')} className="px-3 py-1.5 border border-[#428bca] text-[#428bca] text-xs font-medium rounded hover:bg-[#d9edf7]">
                Request Lead Time
              </button>
              <button onClick={() => setSelectedItems([])} className="px-3 py-1.5 text-[#666] text-xs hover:bg-[#e8e8e8] rounded">
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition-colors ${
              hasActiveFilters ? 'bg-[#d9edf7] text-[#31708f] border border-[#bce8f1]' : 'text-[#666] hover:bg-[#e8e8e8] dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && <span className="ml-1 px-1.5 py-0.5 bg-[#428bca] text-white text-xs rounded-full">{[filterProductNumber, filterSupplier, filterExpiredCost !== 'all', filterStatus !== 'all'].filter(Boolean).length}</span>}
          </button>

          {showFilters && (
            <>
              <input
                type="text"
                value={filterProductNumber}
                onChange={(e) => setFilterProductNumber(e.target.value)}
                placeholder="SKU"
                className="w-28 px-2.5 py-1.5 text-xs border border-[#d4d4d4] dark:border-slate-600 rounded bg-white dark:bg-slate-700"
              />
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-[#d4d4d4] dark:border-slate-600 rounded bg-white dark:bg-slate-700"
              >
                <option value="">All Suppliers</option>
                {uniqueSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={filterExpiredCost}
                onChange={(e) => setFilterExpiredCost(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs border border-[#d4d4d4] dark:border-slate-600 rounded bg-white dark:bg-slate-700"
              >
                <option value="all">All Costs</option>
                <option value="valid">Valid</option>
                <option value="expired">Expired</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs border border-[#d4d4d4] dark:border-slate-600 rounded bg-white dark:bg-slate-700"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="lost">Lost</option>
              </select>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="px-2 py-1.5 text-xs text-[#666] hover:text-[#333]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {expiredCount > 0 && (
        <div className="mx-5 mt-4 p-3 bg-[#f2dede] dark:bg-red-900/20 border border-[#ebccd1] dark:border-red-800 rounded flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-[#a94442] flex-shrink-0" />
          <p className="text-xs text-[#a94442] dark:text-red-300">
            <span className="font-medium">{expiredCount} item(s) have expired costs.</span> Review pricing before submitting.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f0f0f0] dark:bg-slate-700/50 border-b border-[#d4d4d4] dark:border-slate-700">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  className="rounded border-[#d4d4d4] text-[#428bca]"
                  checked={selectedItems.length === lineItems.length && lineItems.length > 0}
                  onChange={(e) => setSelectedItems(e.target.checked ? lineItems.map(item => item.id) : [])}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] dark:text-slate-400 uppercase tracking-wide">Product</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-[#666] dark:text-slate-400 uppercase tracking-wide w-20">Qty</th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-[#666] dark:text-slate-400 uppercase tracking-wide w-24">Price</th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-[#666] dark:text-slate-400 uppercase tracking-wide w-24">Cost</th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-[#666] dark:text-slate-400 uppercase tracking-wide w-28">Subtotal</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-[#666] dark:text-slate-400 uppercase tracking-wide w-16">Stock</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-[#666] dark:text-slate-400 uppercase tracking-wide w-24">Lead</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-[#666] dark:text-slate-400 uppercase tracking-wide w-28">Status</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-[#666] dark:text-slate-400 uppercase tracking-wide w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8e8e8] dark:divide-slate-700">
            {filteredLineItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <tr className={`transition-colors ${
                  expandedItem === item.id ? 'bg-[#d9edf7]/50 dark:bg-blue-900/10' :
                  selectedItems.includes(item.id) ? 'bg-[#d9edf7]/30 dark:bg-blue-900/5' :
                  'hover:bg-[#f5f5f5] dark:hover:bg-slate-700/50'
                } ${isLineItemCostExpired(item) ? 'bg-[#f2dede]/30 dark:bg-red-900/10' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleItemSelect(item.id)}
                      className="rounded border-[#d4d4d4] text-[#428bca]"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleExpanded(item.id)} className="p-0.5 hover:bg-[#e8e8e8] dark:hover:bg-slate-700 rounded">
                        {expandedItem === item.id ? <ChevronDown className="w-4 h-4 text-[#999]" /> : <ChevronRight className="w-4 h-4 text-[#999]" />}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-[#333] dark:text-white">{item.sku}</span>
                          {hasRelationships(item.sku) && (
                            <button onClick={() => setShowSupersessionModal(item.id)} className="text-[#f0ad4e]" title="Alternatives available">
                              <AlertCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {item.isReplacement && <span className="px-1.5 py-0.5 bg-[#fcf8e3] text-[#8a6d3b] text-xs rounded border border-[#faebcc]">Replacement</span>}
                        </div>
                        <div className="text-xs text-[#666] dark:text-slate-400 truncate max-w-xs">{item.name}</div>
                        <div className="text-xs text-[#428bca]">{item.supplier}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3 text-center">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        const newQty = parseInt(e.target.value) || 1;
                        const optimalPriceBreak = getOptimalPriceBreak(item.sku, newQty);
                        const newCost = optimalPriceBreak ? optimalPriceBreak.unitCost : item.cost;
                        setLineItems(prev => prev.map(li =>
                          li.id === item.id ? { ...li, qty: newQty, cost: newCost, subtotal: li.price * newQty, available: getNextAvailableDate(li.sku, newQty), selectedPriceBreak: optimalPriceBreak } : li
                        ));
                      }}
                      className="w-16 px-2 py-1.5 border border-[#d4d4d4] dark:border-slate-600 rounded text-center text-sm bg-white dark:bg-slate-700"
                      min="1"
                    />
                  </td>

                  <td className="px-3 py-3 text-right">
                    {editingPrice === item.id ? (
                      <input
                        type="number"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(parseFloat(e.target.value) || 0)}
                        onBlur={() => handlePriceEdit(item.id, tempPrice)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePriceEdit(item.id, tempPrice)}
                        className="w-20 px-2 py-1 border border-[#428bca] rounded text-right text-sm"
                        autoFocus
                        step="0.01"
                      />
                    ) : (
                      <button
                        onClick={() => { setEditingPrice(item.id); setTempPrice(item.price); }}
                        className="w-full text-right hover:bg-[#e8e8e8] dark:hover:bg-slate-700 px-2 py-1 rounded"
                      >
                        {item.price === 0 ? (
                          <span className="text-[#999] text-sm italic">Enter</span>
                        ) : (
                          <>
                            <span className="font-medium text-sm text-[#333]">${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            {item.cost > 0 && (
                              <div className={`text-xs ${((item.price - item.cost) / item.price) * 100 >= 20 ? 'text-[#3c763d]' : ((item.price - item.cost) / item.price) * 100 >= 10 ? 'text-[#666]' : 'text-[#a94442]'}`}>
                                {(((item.price - item.cost) / item.price) * 100).toFixed(1)}%
                              </div>
                            )}
                          </>
                        )}
                      </button>
                    )}
                  </td>

                  <td className={`px-3 py-3 text-right ${isLineItemCostExpired(item) ? 'bg-[#f2dede] dark:bg-red-900/20' : ''}`}>
                    <button onClick={() => setShowPriceBreakModal(item.id)} className="text-right hover:bg-[#e8e8e8] dark:hover:bg-slate-700 px-2 py-1 rounded group">
                      <span className={`font-medium text-sm ${isLineItemCostExpired(item) ? 'text-[#a94442]' : 'text-[#333]'}`}>
                        ${item.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <ChevronDown className="w-3 h-3 inline ml-0.5 text-[#999]" />
                    </button>
                    {isLineItemCostExpired(item) && <div className="text-xs text-[#a94442] font-medium mt-0.5">EXPIRED</div>}
                  </td>

                  <td className="px-3 py-3 text-right">
                    <span className="font-semibold text-sm text-[#333] dark:text-white">
                      ${item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.stock > 10 ? 'bg-[#5cb85c]' : item.stock > 0 ? 'bg-[#f0ad4e]' : 'bg-[#d9534f]'}`}></div>
                      <span className="text-sm text-[#333] dark:text-slate-300">{item.stock}</span>
                    </div>
                  </td>

                  <td className="px-3 py-3 text-center">
                    <input
                      type="text"
                      value={item.quotedLeadTime || ''}
                      onChange={(e) => setLineItems(prev => prev.map(li => li.id === item.id ? { ...li, quotedLeadTime: e.target.value } : li))}
                      placeholder={item.leadTime}
                      className="w-20 px-2 py-1 border border-[#d4d4d4] dark:border-slate-600 rounded text-center text-xs bg-white dark:bg-slate-700"
                    />
                  </td>

                  <td className="px-3 py-3 text-center">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`px-2 py-1 border rounded text-xs font-medium ${
                        item.status === 'Won' ? 'bg-[#dff0d8] text-[#3c763d] border-[#d6e9c6]' :
                        item.status === 'Lost' ? 'bg-[#f2dede] text-[#a94442] border-[#ebccd1]' :
                        item.status === 'Price Request' ? 'bg-[#d9edf7] text-[#31708f] border-[#bce8f1]' :
                        'bg-[#f5f5f5] text-[#333] border-[#d4d4d4] dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                      <option value="Price Request">Price Request</option>
                      <option value="Lead Time Request">Lead Time</option>
                      <option value="No Quote">No Quote</option>
                    </select>
                  </td>

                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { onProductSelect(item); onSetUpdatePriceCallback({ callback: updateItemPrice, itemId: item.id }); onShowCostAnalysis(true); }}
                        className="p-1.5 hover:bg-[#e8e8e8] dark:hover:bg-slate-700 rounded transition-colors"
                        title="Cost Analysis"
                      >
                        <Calculator className="w-4 h-4 text-[#666] dark:text-slate-400" />
                      </button>
                      <button
                        onClick={() => setShowHistoryModal(item.id)}
                        className="p-1.5 hover:bg-[#e8e8e8] dark:hover:bg-slate-700 rounded transition-colors"
                        title="View History"
                      >
                        <Eye className="w-4 h-4 text-[#666] dark:text-slate-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 hover:bg-[#f2dede] dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-[#a94442] dark:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>

                {expandedItem === item.id && (
                  <tr className="bg-[#f5f5f5]/50 dark:bg-slate-700/30">
                    <td colSpan={10} className="px-6 py-4">
                      <div className="space-y-3">
                        <PriceRequestInfo itemId={item.id} />

                        {item.crossReference && (
                          <div className="bg-[#d9edf7] dark:bg-blue-900/20 border border-[#bce8f1] dark:border-blue-800 rounded p-3">
                            <div className="text-xs font-medium text-[#31708f] dark:text-blue-200 mb-1">Cross-Reference</div>
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              {item.crossReference.customer_part_number && <div><span className="text-[#666]">Customer Part:</span> <span className="text-[#333]">{item.crossReference.customer_part_number}</span></div>}
                              {item.crossReference.supplier_part_number && <div><span className="text-[#666]">Supplier Part:</span> <span className="text-[#333]">{item.crossReference.supplier_part_number}</span></div>}
                              <div><span className="text-[#666]">Internal:</span> <span className="text-[#333]">{item.crossReference.internal_part_number}</span></div>
                            </div>
                          </div>
                        )}

                        {item.isReplacement && (
                          <div className="bg-[#fcf8e3] border border-[#faebcc] rounded p-3">
                            <div className="text-xs font-medium text-[#8a6d3b] mb-1">Replacement Details</div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div><span className="text-[#666]">Original:</span> <span className="text-[#333]">{item.originalCustomerSku} - {item.originalCustomerName}</span></div>
                              <div><span className="text-[#666]">Reason:</span> <span className="text-[#333]">{item.replacementReason}</span></div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          {customerAddresses.length > 0 && (
                            <div>
                              <label className="block text-xs font-medium text-[#666] mb-1">Ship-To Address</label>
                              <select
                                value={item.ship_to_address_id || ''}
                                onChange={(e) => setLineItems(prev => prev.map(li => li.id === item.id ? { ...li, ship_to_address_id: e.target.value || null } : li))}
                                className="w-full px-3 py-2 border border-[#d4d4d4] dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700"
                              >
                                <option value="">Primary address</option>
                                {customerAddresses.map((addr) => (
                                  <option key={addr.id} value={addr.id}>
                                    {addr.address_line_1}, {addr.city}, {addr.state}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-medium text-[#666] mb-1">Shipping Instructions</label>
                            <textarea
                              value={item.shippingInstructions || ''}
                              onChange={(e) => setLineItems(prev => prev.map(li => li.id === item.id ? { ...li, shippingInstructions: e.target.value } : li))}
                              placeholder="Special instructions..."
                              rows={2}
                              className="w-full px-3 py-2 border border-[#d4d4d4] dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700"
                            />
                          </div>
                        </div>

                        {getLineItemCostDates(item).to && (
                          <div className={`rounded p-3 ${isLineItemCostExpired(item) ? 'bg-[#f2dede] border border-[#ebccd1]' : 'bg-[#f5f5f5] border border-[#d4d4d4]'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-[#666]">Cost Effective Period</span>
                              {isLineItemCostExpired(item) && <span className="text-xs text-[#a94442] font-medium">EXPIRED</span>}
                            </div>
                            <div className="text-xs text-[#666] mt-1">
                              {getLineItemCostDates(item).from && new Date(getLineItemCostDates(item).from!).toLocaleDateString()} to {new Date(getLineItemCostDates(item).to!).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {lineItems.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <Package className="h-12 w-12 text-[#d4d4d4] mb-3" />
                    <h3 className="text-sm font-medium text-[#333] dark:text-white mb-1">No items yet</h3>
                    <p className="text-sm text-[#666] mb-4">Add products to build your quote</p>
                    <div className="flex gap-2">
                      <button onClick={() => setShowProductModal(true)} className="px-4 py-2 bg-[#428bca] text-white text-sm rounded hover:bg-[#3276b1]">
                        <Plus className="h-4 w-4 mr-1.5 inline" /> Add Product
                      </button>
                      <button onClick={() => { setCsvUploadMode('add'); setShowCSVUploadModal(true); }} className="px-4 py-2 border border-[#d4d4d4] text-[#333] text-sm rounded hover:bg-[#f0f0f0]">
                        <Upload className="h-4 w-4 mr-1.5 inline" /> Import CSV
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {lineItems.length > 0 && filteredLineItems.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <Filter className="h-10 w-10 text-[#d4d4d4] mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-[#333] dark:text-white mb-1">No matches</h3>
                  <p className="text-sm text-[#666] mb-3">Adjust your filters</p>
                  <button onClick={clearFilters} className="px-3 py-1.5 text-sm text-[#428bca] hover:bg-[#d9edf7] rounded">Clear Filters</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showProductModal && <ProductModal onClose={() => setShowProductModal(false)} onProductSelect={handleProductSelect} />}
      {showPriceBreakModal && (() => {
        const item = lineItems.find(i => i.id === showPriceBreakModal);
        return item ? <PriceBreakModal item={item} onClose={() => setShowPriceBreakModal(null)} onPriceBreakSelect={handlePriceBreakSelect} /> : null;
      })()}
      {showSupersessionModal && <SupersessionModal item={lineItems.find(i => i.id === showSupersessionModal)} onClose={() => setShowSupersessionModal(null)} onSelectReplacement={handleSupersessionSelect} />}
      {showHistoryModal && <HistoryModal item={lineItems.find(i => i.id === showHistoryModal)} currentQuoteId={currentQuote?.id} customerId={selectedCustomer?.id} onClose={() => setShowHistoryModal(null)} />}
      {showCSVUploadModal && <CSVUploadModal onClose={() => setShowCSVUploadModal(false)} onUpload={handleCSVUpload} mode={csvUploadMode} existingLineItems={lineItems} />}
      {showDeleteModal && <DeleteConfirmationModal isOpen={true} onClose={() => setShowDeleteModal(null)} onConfirm={confirmDeleteItem} title="Delete Line Item" message="Remove this item from the quote?" itemName={lineItems.find(i => i.id === showDeleteModal)?.name || ''} deleteType="hard" loading={deleteLoading} cascadeWarning="This cannot be undone." />}
      {showLostDetailsModal && <LostDetailsModal lineItem={lineItems.find(i => i.id === showLostDetailsModal)} onClose={() => setShowLostDetailsModal(null)} onSave={(id, details) => { setLineItems(prev => prev.map(i => i.id === id ? { ...i, status: 'Lost' } : i)); setShowLostDetailsModal(null); }} isOpen={true} />}
    </div>
  );
};
