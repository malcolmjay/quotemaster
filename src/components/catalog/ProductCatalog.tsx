import React, { useState } from 'react';
import { Search, Package, Star, ShoppingCart } from 'lucide-react';
import { automotiveTestParts } from '../../data/automotive-test-data';
import { HelpTooltip } from '../common/HelpTooltip';

export const ProductCatalog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Transform automotive test data to match expected product format
  const products = automotiveTestParts.map(part => ({
    sku: part.partNumber,
    name: part.description,
    category: part.category.toLowerCase().replace(' ', '-'),
    stock: part.stock,
    price: part.listPrice,
    leadTime: `${part.leadTimeDays} days`,
    supplier: part.manufacturer,
    image: getImageForCategory(part.category),
    status: part.status,
    supersessionInfo: part.supersessionInfo,
    application: part.application
  }));

  function getImageForCategory(category: string): string {
    switch (category.toLowerCase()) {
      case 'engine':
        return 'https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg?auto=compress&cs=tinysrgb&w=400';
      case 'electrical':
        return 'https://images.pexels.com/photos/97075/pexels-photo-97075.jpeg?auto=compress&cs=tinysrgb&w=400';
      case 'brakes':
        return 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=400';
      case 'suspension':
        return 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=400';
      case 'filters':
        return 'https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg?auto=compress&cs=tinysrgb&w=400';
      default:
        return 'https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg?auto=compress&cs=tinysrgb&w=400';
    }
  }

  const categories = [
    'All Categories',
    'engine',
    'electrical',
    'brakes',
    'suspension',
    'filters'
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Product Catalog</h2>
            <p className="text-gray-600 mt-1">Browse and manage your product inventory</p>
          </div>
          <div className="text-sm text-gray-500">
            {filteredProducts.length} of {products.length} products
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <HelpTooltip content="Search products by SKU, name, description, or supplier. Type at least 2 characters to see results.">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by SKU, name, description"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </HelpTooltip>

          <HelpTooltip content="Filter products by category to narrow down the catalog to specific product types.">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </HelpTooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.sku} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="mb-4">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg bg-gray-100"
              />
            </div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{product.sku}</h3>
                <p className="text-gray-600 text-sm mb-2">{product.name}</p>
                {product.application && (
                  <p className="text-gray-500 text-xs mb-2">{product.application}</p>
                )}
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  {product.category}
                </span>
                {product.status === 'Superseded' && (
                  <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs ml-2">
                    Superseded
                  </span>
                )}
                {product.status === 'Replacement' && (
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs ml-2">
                    Replacement
                  </span>
                )}
              </div>
              <button className="p-2 text-gray-400 hover:text-yellow-500 transition-colors">
                <Star className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Stock</span>
                <span className="flex items-center text-green-600 font-medium">
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    product.stock > 10 ? 'bg-green-500' : 
                    product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></span>
                  {product.stock.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Price</span>
                <span className="font-semibold text-gray-900">
                  ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Lead Time</span>
                <span className="text-sm text-gray-700">{product.leadTime}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Supplier</span>
                <span className="text-sm font-medium text-blue-600 truncate max-w-32" title={product.supplier}>
                  {product.supplier}
                </span>
              </div>
            </div>

            <HelpTooltip content="Add this product to the current quote as a new line item with the displayed pricing.">
              <button
                className={`w-full flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                  product.status === 'Superseded'
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                disabled={product.status === 'Superseded' && product.stock === 0}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {product.status === 'Superseded' ? 'View Replacement' : 'Select'}
              </button>
            </HelpTooltip>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or category filter. 
            {selectedCategory !== 'All Categories' && (
              <button 
                onClick={() => setSelectedCategory('All Categories')}
                className="text-blue-600 hover:text-blue-700 underline ml-1"
              >
                Show all categories
              </button>
            )}
          </p>
        </div>
      )}
    </div>
  );
};