import React, { useState, useEffect } from 'react';
import { Search, Edit2, Plus, Filter, X, Download, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import CrossReferenceEditModal from './CrossReferenceEditModal';

type CrossReference = Database['public']['Tables']['cross_references']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

interface CrossReferenceWithDetails extends CrossReference {
  customer_name?: string;
  product_name?: string;
  product_sku?: string;
}

export default function CrossReferenceManagement() {
  const [crossReferences, setCrossReferences] = useState<CrossReferenceWithDetails[]>([]);
  const [filteredReferences, setFilteredReferences] = useState<CrossReferenceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReference, setSelectedReference] = useState<CrossReferenceWithDetails | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    customer: '',
    supplier: '',
    type: ''
  });

  const [uniqueValues, setUniqueValues] = useState({
    customers: [] as { id: string; name: string }[],
    suppliers: [] as string[],
    types: [] as string[]
  });

  useEffect(() => {
    loadCrossReferences();
  }, []);

  useEffect(() => {
    filterReferences();
  }, [searchTerm, filters, crossReferences]);

  const loadCrossReferences = async () => {
    try {
      setLoading(true);

      const [{ data: refs, error: refsError }, { data: customers, error: customersError }, { data: products, error: productsError }] = await Promise.all([
        supabase.from('cross_references').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('id, name'),
        supabase.from('products').select('id, name, sku')
      ]);

      if (refsError) throw refsError;
      if (customersError) throw customersError;
      if (productsError) throw productsError;

      const customerMap = new Map(customers?.map(c => [c.id, c.name]) || []);
      const productMap = new Map(products?.map(p => [p.id, { name: p.name, sku: p.sku }]) || []);
      const productBySkuMap = new Map(products?.map(p => [p.sku, { name: p.name, id: p.id }]) || []);

      const refsWithDetails = (refs || []).map(ref => {
        const internalProduct = productBySkuMap.get(ref.internal_part_number);
        return {
          ...ref,
          customer_name: ref.customer_id ? customerMap.get(ref.customer_id) : undefined,
          product_name: ref.product_id ? productMap.get(ref.product_id)?.name : internalProduct?.name,
          product_sku: ref.product_id ? productMap.get(ref.product_id)?.sku : undefined
        };
      });

      setCrossReferences(refsWithDetails);
      extractUniqueValues(refsWithDetails, customers || []);
    } catch (error) {
      console.error('Error loading cross references:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractUniqueValues = (refs: CrossReferenceWithDetails[], customers: Customer[]) => {
    const suppliers = [...new Set(refs.map(r => r.supplier).filter(Boolean))].sort();
    const types = [...new Set(refs.map(r => r.type).filter(Boolean))].sort();
    const customerList = customers.map(c => ({ id: c.id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name));

    setUniqueValues({ customers: customerList, suppliers, types });
  };

  const filterReferences = () => {
    let filtered = crossReferences;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.customer_part_number?.toLowerCase().includes(term) ||
        r.supplier_part_number?.toLowerCase().includes(term) ||
        r.internal_part_number?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term) ||
        r.customer_name?.toLowerCase().includes(term) ||
        r.product_name?.toLowerCase().includes(term) ||
        r.product_sku?.toLowerCase().includes(term)
      );
    }

    if (filters.customer) {
      filtered = filtered.filter(r => r.customer_id === filters.customer);
    }
    if (filters.supplier) {
      filtered = filtered.filter(r => r.supplier === filters.supplier);
    }
    if (filters.type) {
      filtered = filtered.filter(r => r.type === filters.type);
    }

    setFilteredReferences(filtered);
  };

  const handleEdit = (reference: CrossReferenceWithDetails) => {
    setSelectedReference(reference);
    setShowEditModal(true);
  };

  const handleCreate = () => {
    setSelectedReference(null);
    setShowEditModal(true);
  };

  const handleSave = () => {
    loadCrossReferences();
    setShowEditModal(false);
  };

  const clearFilters = () => {
    setFilters({
      customer: '',
      supplier: '',
      type: ''
    });
    setSearchTerm('');
  };

  const hasActiveFilters = Object.values(filters).some(v => v) || searchTerm;

  const exportToCSV = () => {
    const headers = [
      'Customer', 'Customer Part Number', 'Internal Part Number', 'Supplier Part Number',
      'Product SKU', 'Product Name', 'Supplier', 'Type', 'Description', 'Usage Frequency', 'Last Used'
    ];

    const rows = filteredReferences.map(r => [
      r.customer_name || '',
      r.customer_part_number,
      r.internal_part_number,
      r.supplier_part_number || '',
      r.product_sku || '',
      r.product_name || '',
      r.supplier || '',
      r.type || '',
      r.description || '',
      r.usage_frequency,
      r.last_used_at ? new Date(r.last_used_at).toLocaleDateString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cross-references-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0]">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#428bca]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Oro-style Header */}
      <div className="bg-white border-b border-[#d4d4d4] sticky top-0 z-40">
        <div className="px-5 py-3">
          {/* Breadcrumb */}
          <div className="text-xs text-[#999] mb-2">
            Management / Cross References
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-normal text-[#333]">
                Cross Reference Management
              </h1>
              <p className="text-xs text-[#666] mt-1">
                {filteredReferences.length} of {crossReferences.length} cross references
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded border border-transparent hover:border-[#d4d4d4] transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={loadCrossReferences}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded border border-transparent hover:border-[#d4d4d4] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#428bca] hover:bg-[#3276b1] text-white text-sm font-medium rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Cross Reference
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 space-y-4">
        {/* Search and Filters Panel */}
        <div className="bg-white rounded border border-[#d4d4d4] p-4 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#999] w-5 h-5" />
              <input
                type="text"
                placeholder="Search by part numbers, customer, product, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-transparent text-[#333]"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded transition-colors ${
                showFilters
                  ? 'bg-[#428bca] border-[#428bca] text-white'
                  : 'border-[#d4d4d4] text-[#666] hover:text-[#333] hover:bg-[#f5f5f5]'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] border border-transparent hover:border-[#d4d4d4] rounded transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#d4d4d4]">
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Customer</label>
                <select
                  value={filters.customer}
                  onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
                  className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] text-[#333]"
                >
                  <option value="">All</option>
                  {uniqueValues.customers.map(cust => (
                    <option key={cust.id} value={cust.id}>{cust.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Supplier</label>
                <select
                  value={filters.supplier}
                  onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] text-[#333]"
                >
                  <option value="">All</option>
                  {uniqueValues.suppliers.map(sup => (
                    <option key={sup} value={sup}>{sup}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] text-[#333]"
                >
                  <option value="">All</option>
                  {uniqueValues.types.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Table Panel */}
        <div className="bg-white rounded border border-[#d4d4d4] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fafafa] border-b border-[#d4d4d4]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#999] uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#999] uppercase tracking-wider">Customer Part #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#999] uppercase tracking-wider">Internal Part #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#999] uppercase tracking-wider">Supplier Part #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#999] uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#999] uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#999] uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#999] uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#999] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee]">
                {filteredReferences.map((reference) => (
                  <tr key={reference.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333]">
                      {reference.customer_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#333]">
                      {reference.customer_part_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#333]">
                      {reference.internal_part_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333]">
                      {reference.supplier_part_number || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#333]">
                      {reference.product_sku ? (
                        <div>
                          <div className="font-medium">{reference.product_sku}</div>
                          {reference.product_name && (
                            <div className="text-[#999] text-xs">{reference.product_name}</div>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333]">
                      {reference.supplier || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333]">
                      {reference.type ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-[#428bca] text-white">
                          {reference.type}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333] text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{reference.usage_frequency}</span>
                        {reference.last_used_at && (
                          <span className="text-xs text-[#999]">
                            {new Date(reference.last_used_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(reference)}
                        className="text-[#428bca] hover:text-[#3276b1] inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReferences.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#666]">No cross references found</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-[#428bca] hover:text-[#3276b1] transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <CrossReferenceEditModal
          reference={selectedReference}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
