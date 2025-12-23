import React from 'react';
import { X } from 'lucide-react';

interface QuotePrintViewProps {
  quote: any;
  customer: any;
  lineItems: any[];
  user: any;
  onClose: () => void;
}

export const QuotePrintView: React.FC<QuotePrintViewProps> = ({
  quote,
  customer,
  lineItems,
  user,
  onClose,
}) => {
  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-auto print:bg-white">
      <div className="min-h-screen p-4 print:p-0">
        <div className="max-w-5xl mx-auto bg-white shadow-2xl print:shadow-none">
          <div className="no-print sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-semibold text-gray-900">Print Preview</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
              >
                Print / Save as PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="print-content p-12 print:p-8">
            <div className="page-header mb-8 pb-6 border-b-4 border-blue-600 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-blue-600 mb-2">Quote</h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Generated: {new Date().toLocaleString()}</div>
                  <div>Created by: {user?.email || 'N/A'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  #{quote?.quote_number || 'DRAFT'}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Status: <span className="font-semibold">{quote?.quote_status?.toUpperCase() || 'DRAFT'}</span></div>
                  <div>Type: {quote?.quote_type || 'Daily Quote'}</div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">
                Customer Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Customer Name</div>
                  <div className="text-sm font-medium text-gray-900">{customer?.name || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Customer Number</div>
                  <div className="text-sm font-medium text-gray-900">{customer?.number || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Primary Warehouse</div>
                  <div className="text-sm font-medium text-gray-900">{customer?.primary_warehouse || 'Not set'}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment Terms</div>
                  <div className="text-sm font-medium text-gray-900">{customer?.payment_terms || 'Standard'}</div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">
                Line Items ({lineItems.length})
              </h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">Item #</th>
                    <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">SKU</th>
                    <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">Supplier</th>
                    <th className="text-right py-3 px-3 font-semibold text-xs uppercase tracking-wider">Qty</th>
                    <th className="text-right py-3 px-3 font-semibold text-xs uppercase tracking-wider">Unit Price</th>
                    <th className="text-right py-3 px-3 font-semibold text-xs uppercase tracking-wider">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-3 px-3 text-center border-b border-gray-200">{index + 1}</td>
                      <td className="py-3 px-3 border-b border-gray-200">{item.sku || 'N/A'}</td>
                      <td className="py-3 px-3 border-b border-gray-200">
                        <div className="font-medium text-gray-900">{item.name || 'N/A'}</div>
                        {item.notes && (
                          <div className="text-xs text-gray-600 mt-1">{item.notes}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 border-b border-gray-200">{item.supplier || 'N/A'}</td>
                      <td className="py-3 px-3 text-right border-b border-gray-200">{item.qty?.toLocaleString() || 0}</td>
                      <td className="py-3 px-3 text-right border-b border-gray-200">${(item.price || 0).toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-semibold border-b border-gray-200">${(item.subtotal || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mb-8">
              <div className="w-full max-w-md">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
                  <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-90">
                    Quote Total
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="opacity-90">Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="opacity-90">Items</span>
                      <span className="font-medium">{lineItems.length}</span>
                    </div>
                    <div className="flex justify-between pt-3 mt-3 border-t-2 border-white/30">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-2xl">${subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {quote?.notes && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">Notes</h2>
                <div className="bg-gray-50 p-4 rounded border border-gray-200 text-sm text-gray-700">
                  {quote.notes}
                </div>
              </div>
            )}

            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
              This is a computer-generated quote. For questions, please contact your sales representative.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
