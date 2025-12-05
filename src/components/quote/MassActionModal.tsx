import React, { useState } from 'react';
import { X, Users, CheckCircle, XCircle, Clock, Package, RotateCcw, AlertTriangle } from 'lucide-react';

interface MassActionModalProps {
  selectedItems: string[];
  lineItems: any[];
  onClose: () => void;
  onApplyAction: (action: string) => void;
}

export const MassActionModal: React.FC<MassActionModalProps> = ({ 
  selectedItems, 
  lineItems, 
  onClose, 
  onApplyAction 
}) => {
  const [selectedAction, setSelectedAction] = useState<string>('');

  const selectedLineItems = lineItems.filter(item => selectedItems.includes(item.id));

  const actions = [
    {
      id: 'price-request',
      label: 'Price Request',
      description: 'Request updated pricing from suppliers',
      icon: Clock,
      color: 'blue'
    },
    {
      id: 'lead-time-request',
      label: 'Lead Time Request',
      description: 'Request updated lead times from suppliers',
      icon: Clock,
      color: 'green'
    },
    {
      id: 'new-item-request',
      label: 'New Item Request',
      description: 'Request new item setup and pricing',
      icon: Package,
      color: 'purple'
    },
    {
      id: 'reserve-inventory',
      label: 'Reserve Inventory',
      description: 'Reserve available inventory for these items',
      icon: RotateCcw,
      color: 'orange'
    },
    {
      id: 'won',
      label: 'Mark as Won',
      description: 'Mark selected items as won opportunities',
      icon: CheckCircle,
      color: 'green'
    },
    {
      id: 'lost',
      label: 'Mark as Lost',
      description: 'Mark selected items as lost opportunities',
      icon: XCircle,
      color: 'red'
    },
    {
      id: 'no-quote',
      label: 'No Quote',
      description: 'Mark items as not to be quoted',
      icon: AlertTriangle,
      color: 'gray'
    }
  ];

  const handleApply = () => {
    if (selectedAction) {
      onApplyAction(selectedAction);
      onClose();
    }
  };

  const getColorClasses = (color: string, selected: boolean) => {
    const baseClasses = selected ? 'border-2' : 'border';
    
    switch (color) {
      case 'blue':
        return `${baseClasses} ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'} hover:bg-blue-50`;
      case 'green':
        return `${baseClasses} ${selected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'} hover:bg-green-50`;
      case 'purple':
        return `${baseClasses} ${selected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'} hover:bg-purple-50`;
      case 'orange':
        return `${baseClasses} ${selected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'} hover:bg-orange-50`;
      case 'red':
        return `${baseClasses} ${selected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'} hover:bg-red-50`;
      case 'gray':
        return `${baseClasses} ${selected ? 'border-gray-500 bg-gray-50' : 'border-gray-200 hover:border-gray-300'} hover:bg-gray-50`;
      default:
        return `${baseClasses} border-gray-200 hover:border-gray-300 hover:bg-gray-50`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Mass Actions</h3>
            <p className="text-sm text-gray-600 mt-1">
              Apply actions to {selectedItems.length} selected line items
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
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">Selected Items ({selectedItems.length})</span>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
              <div className="space-y-2">
                {selectedLineItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{item.sku}</span>
                      <span className="text-gray-600 ml-2">{item.name}</span>
                    </div>
                    <div className="text-gray-500">
                      Qty: {item.qty} • ${item.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-4">Select Action</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {actions.map((action) => {
                const Icon = action.icon;
                const isSelected = selectedAction === action.id;
                
                return (
                  <button
                    key={action.id}
                    onClick={() => setSelectedAction(action.id)}
                    className={`p-4 rounded-lg text-left transition-all ${getColorClasses(action.color, isSelected)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${
                        action.color === 'blue' ? 'text-blue-600' :
                        action.color === 'green' ? 'text-green-600' :
                        action.color === 'purple' ? 'text-purple-600' :
                        action.color === 'orange' ? 'text-orange-600' :
                        action.color === 'red' ? 'text-red-600' :
                        'text-gray-600'
                      }`} />
                      <div>
                        <div className="font-medium text-gray-900">{action.label}</div>
                        <div className="text-sm text-gray-600 mt-1">{action.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedAction && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Action Preview</span>
              </div>
              <p className="text-sm text-blue-800">
                {actions.find(a => a.id === selectedAction)?.label} will be applied to {selectedItems.length} selected items.
              </p>
            </div>
          )}
        </div>
        
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedAction}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedAction
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Apply Action
          </button>
        </div>
      </div>
    </div>
  );
};