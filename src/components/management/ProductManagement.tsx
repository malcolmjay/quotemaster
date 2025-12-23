import React, { useState, useEffect } from 'react';
import { Search, Edit2, Plus, Filter, X, Download, Upload, RefreshCw } from 'lucide-react';
import { supabase, getAllProducts } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import ProductEditModal from './ProductEditModal';
import { HelpTooltip } from '../common/HelpTooltip';

type Product = Database['public']['Tables']['products']['Row'];

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    category: '',
    supplier: '',
    status: '',
    itemType: '',
    categorySet: '',
    warehouse: ''
  });

  const [uniqueValues, setUniqueValues] = useState({
    categories: [] as string[],
    suppliers: [] as string[],
    itemTypes: [] as string[],
    categorySets: [] as string[],
    warehouses: [] as string[]
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, filters, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();

      setProducts(data || []);
      extractUniqueValues(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractUniqueValues = (prods: Product[]) => {
    const categories = [...new Set(prods.map(p => p.category).filter(Boolean))].sort();
    const suppliers = [...new Set(prods.map(p => p.supplier).filter(Boolean))].sort();
    const itemTypes = [...new Set(prods.map(p => p.item_type).filter(Boolean))].sort();
    const categorySets = [...new Set(prods.map(p => p.category_set).filter(Boolean))].sort();
    const warehouses = [...new Set(prods.map(p => p.warehouse).filter(Boolean))].sort();

    setUniqueValues({ categories, suppliers, itemTypes, categorySets, warehouses });
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.sku?.toLowerCase().includes(term) ||
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.long_description?.toLowerCase().includes(term)
      );
    }

    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }
    if (filters.supplier) {
      filtered = filtered.filter(p => p.supplier === filters.supplier);
    }
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.itemType) {
      filtered = filtered.filter(p => p.item_type === filters.itemType);
    }
    if (filters.categorySet) {
      filtered = filtered.filter(p => p.category_set === filters.categorySet);
    }
    if (filters.warehouse) {
      filtered = filtered.filter(p => p.warehouse === filters.warehouse);
    }

    setFilteredProducts(filtered);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setShowEditModal(true);
  };

  const handleSave = () => {
    loadProducts();
    setShowEditModal(false);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      supplier: '',
      status: '',
      itemType: '',
      categorySet: '',
      warehouse: ''
    });
    setSearchTerm('');
  };

  const hasActiveFilters = Object.values(filters).some(v => v) || searchTerm;

  const exportToCSV = () => {
    const headers = [
      'SKU', 'Name', 'Description', 'Category', 'Supplier', 'Supplier Email', 'Unit Cost', 'List Price',
      'Lead Time Days', 'Status', 'Category Set', 'Item Type', 'Unit of Measure', 'MOQ',
      'Weight', 'Length', 'Width', 'Height', 'Country of Origin', 'Rep Code'
    ];

    const rows = filteredProducts.map(p => [
      p.sku,
      p.name,
      p.description || '',
      p.category,
      p.supplier,
      p.supplier_email || '',
      p.unit_cost,
      p.list_price,
      p.lead_time_days,
      p.status,
      p.category_set || '',
      p.item_type || '',
      p.unit_of_measure || '',
      p.moq || '',
      p.weight || '',
      p.length || '',
      p.width || '',
      p.height || '',
      p.country_of_origin || '',
      p.rep_code || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#428bca]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#333]">Product Management</h2>
          <p className="text-[#666] mt-1">
            {filteredProducts.length} of {products.length} products
          </p>
        </div>
        <div className="flex gap-2">
          <HelpTooltip content="Export filtered products to CSV including all details like pricing, lead times, and supplier information.">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] border border-transparent hover:border-[#d4d4d4] rounded"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </HelpTooltip>
          <HelpTooltip content="Reload product data from the database to see the latest updates.">
            <button
              onClick={loadProducts}
              className="flex items-center gap-2 px-4 py-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] border border-transparent hover:border-[#d4d4d4] rounded"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </HelpTooltip>
          <HelpTooltip content="Create a new product record with SKU, pricing, supplier details, and inventory information.">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-[#428bca] hover:bg-[#3276b1] text-white rounded"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </HelpTooltip>
        </div>
      </div>

      <div className="bg-white rounded border border-[#d4d4d4] p-4 space-y-4">
        <div className="flex gap-4">
          <HelpTooltip content="Search products by SKU, name, or description. Searches across all product fields for comprehensive results.">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#999] w-5 h-5" />
              <input
                type="text"
                placeholder="Search by SKU, name, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-transparent"
              />
            </div>
          </HelpTooltip>
          <HelpTooltip content="Apply filters for category, supplier, status, item type, category set, or warehouse to narrow results.">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded ${
                showFilters ? 'bg-[#428bca] border-[#428bca] text-white' : 'text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] border-transparent hover:border-[#d4d4d4]'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </HelpTooltip>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] border border-transparent hover:border-[#d4d4d4] rounded"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-[#d4d4d4]">
            <div>
              <label className="block text-sm font-medium text-[#333] mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca]"
              >
                <option value="">All</option>
                {uniqueValues.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333] mb-1">Supplier</label>
              <select
                value={filters.supplier}
                onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca]"
              >
                <option value="">All</option>
                {uniqueValues.suppliers.map(sup => (
                  <option key={sup} value={sup}>{sup}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333] mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca]"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333] mb-1">Item Type</label>
              <select
                value={filters.itemType}
                onChange={(e) => setFilters({ ...filters, itemType: e.target.value })}
                className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca]"
              >
                <option value="">All</option>
                {uniqueValues.itemTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333] mb-1">Category Set</label>
              <select
                value={filters.categorySet}
                onChange={(e) => setFilters({ ...filters, categorySet: e.target.value })}
                className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca]"
              >
                <option value="">All</option>
                {uniqueValues.categorySets.map(set => (
                  <option key={set} value={set}>{set}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333] mb-1">Warehouse</label>
              <select
                value={filters.warehouse}
                onChange={(e) => setFilters({ ...filters, warehouse: e.target.value })}
                className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca]"
              >
                <option value="">All</option>
                {uniqueValues.warehouses.map(wh => (
                  <option key={wh} value={wh}>{wh}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded border border-[#d4d4d4] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f9f9f9] border-b border-[#d4d4d4]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Supplier Email</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#666] uppercase tracking-wider">Unit Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#666] uppercase tracking-wider">List Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#666] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4d4d4]">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-[#f9f9f9]">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#333]">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#333]">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{product.name}</div>
                      {(product as any).price_breaks && (product as any).price_breaks.length > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#d9edf7] text-[#31708f]">
                          {(product as any).price_breaks.length} Price {(product as any).price_breaks.length === 1 ? 'Break' : 'Breaks'}
                        </span>
                      )}
                    </div>
                    {product.description && (
                      <div className="text-[#999] text-xs mt-1 max-w-xs truncate">
                        {product.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333]">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333]">
                    {product.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#666]">
                    {product.supplier_email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333] text-right">
                    ${product.unit_cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333] text-right">
                    ${product.list_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.status === 'active' ? 'bg-[#dff0d8] text-[#3c763d]' :
                      product.status === 'inactive' ? 'bg-[#fcf8e3] text-[#8a6d3b]' :
                      'bg-[#f2dede] text-[#a94442]'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <HelpTooltip content="Update product details including pricing, descriptions, lead times, and supplier information.">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-[#428bca] hover:text-[#3276b1] inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    </HelpTooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#999]">No products found</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 text-[#428bca] hover:text-[#3276b1]"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {showEditModal && (
        <ProductEditModal
          product={selectedProduct}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
