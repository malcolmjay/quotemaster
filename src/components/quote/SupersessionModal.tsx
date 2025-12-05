import React, { useState } from 'react';
import { X, AlertTriangle, ArrowRight, Package, Info } from 'lucide-react';
import { automotiveTestParts, supersessionMap } from '../../data/automotive-test-data';

interface SupersessionModalProps {
  item: any;
  onClose: () => void;
  onSelectReplacement: (itemId: string, replacement: any) => void;
}

export const SupersessionModal: React.FC<SupersessionModalProps> = ({ item, onClose, onSelectReplacement }) => {
  const [selectedTab, setSelectedTab] = useState<'supersessions' | 'alternates'>('supersessions');

  // Get supersession data from automotive test data
  const getSupersessions = () => {
    const currentPart = automotiveTestParts.find(p => p.partNumber === item.sku);
    if (!currentPart || !currentPart.supersessionInfo?.newPartNumber) return [];
    
    const replacementPart = automotiveTestParts.find(p => p.partNumber === currentPart.supersessionInfo?.newPartNumber);
    if (!replacementPart) return [];
    
    return [{
      id: replacementPart.partNumber,
      sku: replacementPart.partNumber,
      name: replacementPart.description,
      supplier: replacementPart.manufacturer,
      stock: replacementPart.stock,
      price: replacementPart.listPrice,
      cost: replacementPart.unitCost,
      leadTime: `${replacementPart.leadTimeDays} days`,
      relationshipType: 'supersession',
      reason: currentPart.supersessionInfo?.reason || 'Product superseded',
      effectiveDate: '2024-01-01'
    }];
  };

  // Get alternate parts from same category
  const getAlternates = () => {
    const currentPart = automotiveTestParts.find(p => p.partNumber === item.sku);
    if (!currentPart) return [];
    
    return automotiveTestParts
      .filter(p => 
        p.category === currentPart.category && 
        p.partNumber !== item.sku &&
        p.status === 'Active'
      )
      .slice(0, 3) // Limit to 3 alternates
      .map(part => ({
        id: part.partNumber,
        sku: part.partNumber,
        name: part.description,
        supplier: part.manufacturer,
        stock: part.stock,
        price: part.listPrice,
        cost: part.unitCost,
        leadTime: `${part.leadTimeDays} days`,
        relationshipType: 'alternate',
        reason: 'Compatible alternative part',
        compatibility: '100% compatible'
      }));
  };

  const supersessions = getSupersessions();
  const alternates = getAlternates();
  const currentData = selectedTab === 'supersessions' ? supersessions : alternates;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Product Relationships</h3>
            <p className="text-sm text-gray-600 mt-1">
              Original Request: {item.sku} - {item.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Original Customer Request</span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700">SKU:</span>
                <div className="font-semibold text-blue-900">{item.sku}</div>
              </div>
              <div>
                <span className="text-blue-700">Product Name:</span>
                <div className="font-semibold text-blue-900">{item.name}</div>
              </div>
              <div>
                <span className="text-blue-700">Quantity:</span>
                <div className="font-semibold text-blue-900">{item.qty} units</div>
              </div>
              <div>
                <span className="text-blue-700">Current Status:</span>
                <div className="font-semibold text-blue-900">{item.stock > 0 ? 'In Stock' : 'Out of Stock'}</div>
              </div>
            </div>
          </div>

          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setSelectedTab('supersessions')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === 'supersessions'
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Supersessions ({supersessions.length})</span>
              </div>
            </button>
            <button
              onClick={() => setSelectedTab('alternates')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === 'alternates'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Alternates ({alternates.length})</span>
              </div>
            </button>
          </div>

          {selectedTab === 'supersessions' && supersessions.length > 0 && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-2 text-orange-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Supersession Available</span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                This product has been superseded by a newer version. Consider selecting the replacement for better availability and support.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {currentData.map((replacement) => (
              <div
                key={replacement.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-lg text-gray-900">{replacement.sku}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        replacement.relationshipType === 'supersession'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {replacement.relationshipType === 'supersession' ? 'Supersession' : 'Alternate'}
                      </span>
                      {replacement.stock > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Out of Stock
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-3">{replacement.name}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-600">Supplier:</span>
                        <div className="font-medium text-blue-600">{replacement.supplier}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Stock:</span>
                        <div className="font-medium text-gray-900">{replacement.stock} units</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Price:</span>
                        <div className="font-medium text-gray-900">${replacement.price.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Lead Time:</span>
                        <div className="font-medium text-gray-900">{replacement.leadTime}</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Info className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Relationship Details</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{replacement.reason}</p>
                      {replacement.compatibility && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Compatibility:</span> {replacement.compatibility}
                        </p>
                      )}
                      {replacement.effectiveDate && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Effective Date:</span> {replacement.effectiveDate}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Cost Difference:</span>
                          <span className={`font-medium ${
                            replacement.cost < item.cost ? 'text-green-600' : 
                            replacement.cost > item.cost ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {replacement.cost < item.cost ? '-' : replacement.cost > item.cost ? '+' : ''}
                            ${Math.abs(replacement.cost - item.cost).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Total Impact:</span>
                          <span className={`font-medium ${
                            replacement.cost < item.cost ? 'text-green-600' : 
                            replacement.cost > item.cost ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {replacement.cost < item.cost ? '-' : replacement.cost > item.cost ? '+' : ''}
                            ${Math.abs((replacement.cost - item.cost) * item.qty).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onSelectReplacement(item.id, replacement)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <span>Select Replacement</span>
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {currentData.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {selectedTab} available
              </h3>
              <p className="text-gray-600">
                There are currently no {selectedTab} for this product.
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Keep Original
          </button>
        </div>
      </div>
    </div>
  );
};