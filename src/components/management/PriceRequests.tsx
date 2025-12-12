import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Plus, Search, Filter, CreditCard as Edit, ChevronDown, ChevronUp, Upload, Download } from 'lucide-react';
import { PriceRequestEntry } from './PriceRequestEntry';
import { PriceRequestUpload } from './PriceRequestUpload';

type PriceRequest = Database['public']['Tables']['price_requests']['Row'];
type PriceBreak = {
  quantity: number;
  price: number;
};

type SortField = 'requested_at' | 'product_number' | 'customer_name' | 'supplier_name' | 'buyer_name' | 'status';
type SortDirection = 'asc' | 'desc';

export function PriceRequests() {
  const [priceRequests, setPriceRequests] = useState<PriceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PriceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<PriceRequest | null>(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [buyerFilter, setBuyerFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('requested_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Ref for search input
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPriceRequests();
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

  useEffect(() => {
    applyFiltersAndSort();
  }, [priceRequests, searchTerm, buyerFilter, supplierFilter, customerFilter, statusFilter, sortField, sortDirection]);

  const loadPriceRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('price_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setPriceRequests(data || []);
    } catch (error) {
      console.error('Error loading price requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...priceRequests];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(req =>
        req.product_number?.toLowerCase().includes(term) ||
        req.description?.toLowerCase().includes(term) ||
        req.customer_name?.toLowerCase().includes(term) ||
        req.supplier_name?.toLowerCase().includes(term) ||
        req.buyer_name?.toLowerCase().includes(term) ||
        req.quote_number?.toLowerCase().includes(term)
      );
    }

    // Apply specific filters
    if (buyerFilter) {
      filtered = filtered.filter(req =>
        req.buyer_name?.toLowerCase().includes(buyerFilter.toLowerCase())
      );
    }

    if (supplierFilter) {
      filtered = filtered.filter(req =>
        req.supplier_name?.toLowerCase().includes(supplierFilter.toLowerCase())
      );
    }

    if (customerFilter) {
      filtered = filtered.filter(req =>
        req.customer_name?.toLowerCase().includes(customerFilter.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Convert to lowercase for string comparison
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const openEntryForm = (request?: PriceRequest) => {
    setEditingRequest(request || null);
    setShowEntryForm(true);
  };

  const closeEntryForm = () => {
    setShowEntryForm(false);
    setEditingRequest(null);
  };

  const handleFormSave = async () => {
    await loadPriceRequests();
    closeEntryForm();
  };

  const handleUploadSuccess = async () => {
    await loadPriceRequests();
    setShowUploadModal(false);
  };

  const exportToCSV = () => {
    const headers = [
      'product_number',
      'description',
      'customer_name',
      'quote_number',
      'quote_type',
      'item_quantity',
      'supplier_name',
      'buyer_name',
      'supplier_pricing',
      'effective_start_date',
      'effective_end_date',
      'moq',
      'supplier_quote_number',
      'status'
    ];

    const csvRows = [headers.join(',')];

    filteredRequests.forEach(request => {
      const row = [
        request.product_number || '',
        request.description || '',
        request.customer_name || '',
        request.quote_number || '',
        request.quote_type || '',
        request.item_quantity?.toString() || '',
        request.supplier_name || '',
        request.buyer_name || '',
        request.supplier_pricing?.toString() || '',
        request.effective_start_date || '',
        request.effective_end_date || '',
        request.moq?.toString() || '',
        request.supplier_quote_number || '',
        request.status || ''
      ];

      const escapedRow = row.map(field => {
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      });

      csvRows.push(escapedRow.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `price_requests_export_${timestamp}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setBuyerFilter('');
    setSupplierFilter('');
    setCustomerFilter('');
    setStatusFilter('all');
  };

  // Get unique values for filter dropdowns
  const uniqueBuyers = Array.from(new Set(priceRequests.map(r => r.buyer_name).filter(Boolean))).sort();
  const uniqueSuppliers = Array.from(new Set(priceRequests.map(r => r.supplier_name).filter(Boolean))).sort();
  const uniqueCustomers = Array.from(new Set(priceRequests.map(r => r.customer_name).filter(Boolean))).sort();

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <ChevronUp className="w-4 h-4 inline ml-1" /> :
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#666]">Loading price requests...</div>
      </div>
    );
  }

  if (showEntryForm) {
    return (
      <PriceRequestEntry
        onClose={closeEntryForm}
        onSave={handleFormSave}
        existingRequest={editingRequest}
      />
    );
  }

  const pendingCount = priceRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#333]">Price Requests</h2>
          <p className="text-sm text-[#999] mt-1">
            {pendingCount} pending • {filteredRequests.length} of {priceRequests.length} total
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportToCSV}
            disabled={filteredRequests.length === 0}
            className="flex items-center space-x-2 px-4 py-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] border border-transparent hover:border-[#d4d4d4] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={`Export ${filteredRequests.length} filtered record(s)`}
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#5cb85c] hover:bg-[#4cae4c] text-white rounded transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload CSV</span>
          </button>
          <button
            onClick={() => openEntryForm()}
            className="flex items-center space-x-2 px-4 py-2 bg-[#428bca] hover:bg-[#3276b1] text-white rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Request</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded border border-[#d4d4d4] p-4 space-y-3">
        <div className="flex items-center gap-3">
          {/* Global Search */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-[#999]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product, customer, supplier, buyer, or quote... (Shift+S)"
              className="w-full pl-10 pr-4 py-2 border border-[#d4d4d4] rounded bg-white text-[#333] focus:ring-2 focus:ring-[#428bca]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-[#d4d4d4] rounded bg-white text-[#333] focus:ring-2 focus:ring-[#428bca]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          {/* Toggle Advanced Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded transition-colors ${
              showFilters || buyerFilter || supplierFilter || customerFilter
                ? 'border-[#428bca] bg-[#d9edf7] text-[#31708f]'
                : 'border-[#d4d4d4] text-[#666] hover:text-[#333] hover:bg-[#f5f5f5]'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-[#d4d4d4]">
            <div>
              <label className="block text-xs font-medium text-[#666] mb-1">
                Buyer
              </label>
              <select
                value={buyerFilter}
                onChange={(e) => setBuyerFilter(e.target.value)}
                className="w-full px-3 py-2 border border-[#d4d4d4] rounded bg-white text-[#333] text-sm focus:ring-2 focus:ring-[#428bca]"
              >
                <option value="">All Buyers</option>
                {uniqueBuyers.map(buyer => (
                  <option key={buyer} value={buyer}>{buyer}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#666] mb-1">
                Supplier
              </label>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full px-3 py-2 border border-[#d4d4d4] rounded bg-white text-[#333] text-sm focus:ring-2 focus:ring-[#428bca]"
              >
                <option value="">All Suppliers</option>
                {uniqueSuppliers.map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#666] mb-1">
                Customer
              </label>
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full px-3 py-2 border border-[#d4d4d4] rounded bg-white text-[#333] text-sm focus:ring-2 focus:ring-[#428bca]"
              >
                <option value="">All Customers</option>
                {uniqueCustomers.map(customer => (
                  <option key={customer} value={customer}>{customer}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-[#428bca] hover:text-[#3276b1]"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Compact Table */}
      <div className="bg-white rounded border border-[#d4d4d4] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f0f0f0] border-b border-[#d4d4d4]">
              <tr>
                <th
                  onClick={() => handleSort('status')}
                  className="px-3 py-3 text-left font-medium text-[#666] cursor-pointer hover:bg-[#e8e8e8]"
                >
                  Status <SortIcon field="status" />
                </th>
                <th
                  onClick={() => handleSort('product_number')}
                  className="px-3 py-3 text-left font-medium text-[#666] cursor-pointer hover:bg-[#e8e8e8]"
                >
                  Product # <SortIcon field="product_number" />
                </th>
                <th className="px-3 py-3 text-left font-medium text-[#666]">
                  Description
                </th>
                <th
                  onClick={() => handleSort('customer_name')}
                  className="px-3 py-3 text-left font-medium text-[#666] cursor-pointer hover:bg-[#e8e8e8]"
                >
                  Customer <SortIcon field="customer_name" />
                </th>
                <th
                  onClick={() => handleSort('supplier_name')}
                  className="px-3 py-3 text-left font-medium text-[#666] cursor-pointer hover:bg-[#e8e8e8]"
                >
                  Supplier <SortIcon field="supplier_name" />
                </th>
                <th className="px-3 py-3 text-left font-medium text-[#666]">
                  Supplier Email
                </th>
                <th className="px-3 py-3 text-left font-medium text-[#666]">
                  Currency
                </th>
                <th
                  onClick={() => handleSort('buyer_name')}
                  className="px-3 py-3 text-left font-medium text-[#666] cursor-pointer hover:bg-[#e8e8e8]"
                >
                  Buyer <SortIcon field="buyer_name" />
                </th>
                <th className="px-3 py-3 text-right font-medium text-[#666]">
                  Qty
                </th>
                <th className="px-3 py-3 text-right font-medium text-[#666]">
                  Price
                </th>
                <th className="px-3 py-3 text-center font-medium text-[#666]">
                  Attachment
                </th>
                <th className="px-3 py-3 text-left font-medium text-[#666]">
                  Quote #
                </th>
                <th
                  onClick={() => handleSort('requested_at')}
                  className="px-3 py-3 text-left font-medium text-[#666] cursor-pointer hover:bg-[#e8e8e8]"
                >
                  Date <SortIcon field="requested_at" />
                </th>
                <th className="px-3 py-3 text-center font-medium text-[#666]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4d4d4]">
              {currentRequests.map((request) => (
                <tr
                  key={request.id}
                  className="hover:bg-[#f9f9f9] transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'completed'
                          ? 'bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6]'
                          : 'bg-[#fcf8e3] text-[#8a6d3b] border border-[#faebcc]'
                      }`}
                    >
                      {request.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-[#333]">
                    {request.product_number}
                  </td>
                  <td className="px-3 py-2.5 text-[#666] max-w-xs truncate" title={request.description || ''}>
                    {request.description}
                  </td>
                  <td className="px-3 py-2.5 text-[#666]">
                    {request.customer_name}
                  </td>
                  <td className="px-3 py-2.5 text-[#666]">
                    {request.supplier_name || '-'}
                  </td>
                  <td className="px-3 py-2.5 text-[#666] text-sm">
                    {request.supplier_email || '-'}
                  </td>
                  <td className="px-3 py-2.5 text-[#666] text-sm">
                    {request.supplier_currency || 'USD'}
                  </td>
                  <td className="px-3 py-2.5 text-[#666]">
                    {request.buyer_name || '-'}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#666]">
                    {request.item_quantity}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-[#333]">
                    {request.supplier_pricing ? `${request.supplier_currency || '$'}${request.supplier_pricing.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {request.attachment_url ? (
                      <a
                        href={request.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-[#428bca] hover:text-[#3276b1] hover:underline"
                        title={request.attachment_name || 'View attachment'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </a>
                    ) : (
                      <span className="text-[#999]">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[#666] text-xs">
                    {request.quote_number}
                  </td>
                  <td className="px-3 py-2.5 text-[#666] text-xs">
                    {request.requested_at ? new Date(request.requested_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => openEntryForm(request)}
                      className="inline-flex items-center justify-center p-1.5 text-[#428bca] hover:text-[#3276b1] hover:bg-[#f5f5f5] rounded transition-colors"
                      title="Edit Request"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12 text-[#999]">
            {searchTerm || buyerFilter || supplierFilter || customerFilter || statusFilter !== 'all'
              ? 'No price requests match your search criteria'
              : 'No price requests found'}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-[#d4d4d4] px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-[#666]">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-[#d4d4d4] rounded text-sm text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-[#666]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-[#d4d4d4] rounded text-sm text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <PriceRequestUpload
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
