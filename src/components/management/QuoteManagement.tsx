import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, Calendar, User, DollarSign, Eye, Edit, Trash2, Download, FileDown } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { Pagination } from '../common/Pagination';
import { useDeletion } from '../../hooks/useDeletion';
import { getPaginatedQuotes } from '../../lib/supabase';

interface DisplayQuote {
  id: string;
  quote_number: string;
  customer: string;
  requestingUser: string;
  createdDate: string;
  validUntil: string;
  totalValue: number;
  status: string;
  lineItems: number;
  margin: number;
  quote: any;
}

export const QuoteManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [displayQuotes, setDisplayQuotes] = useState<DisplayQuote[]>([]);
  const pageSize = 25;

  const { customers, setSelectedCustomer } = useCustomer();
  const { deleteRecord } = useDeletion();

  useEffect(() => {
    loadQuotes();
  }, [currentPage, searchTerm, statusFilter]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getPaginatedQuotes({
        page: currentPage,
        pageSize,
        searchTerm,
        filters: { status: statusFilter },
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      const transformed = result.data.map((quote: any) => {
        const customer = quote.customers || customers.find((c: any) => c.id === quote.customer_id);
        const lineItems = quote.quote_line_items || [];
        const totalCost = quote.total_cost || 0;
        const totalPrice = quote.total_value || 0;
        const margin = quote.total_margin || 0;

        return {
          id: quote.id,
          quote_number: quote.quote_number,
          customer: customer?.name || 'Unknown Customer',
          requestingUser: 'N/A',
          createdDate: new Date(quote.created_at).toLocaleDateString(),
          validUntil: quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'Not set',
          totalValue: totalPrice,
          status: quote.quote_status.charAt(0).toUpperCase() + quote.quote_status.slice(1).replace('_', ' '),
          lineItems: lineItems.length,
          margin: Number(margin),
          quote: quote
        };
      });

      setDisplayQuotes(transformed);
      setTotalItems(result.total);
    } catch (err) {
      console.error('Error loading quotes:', err);
      setError('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    'Draft': 'bg-gray-100 text-gray-800',
    'Pending approval': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800'
  };

  const handleEditQuote = (quote: DisplayQuote) => {
    const customer = customers.find((c: any) => c.id === quote.quote.customer_id);
    if (customer) {
      setSelectedCustomer(customer);
    }

    window.location.hash = 'quote-builder';
    setTimeout(() => {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }, 50);
  };

  const generatePDF = (quote: DisplayQuote) => {
    const customer = customers.find((c: any) => c.id === quote.quote.customer_id);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quote ${quote.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
          .quote-title { font-size: 20px; margin-top: 10px; }
          .info-section { margin-bottom: 30px; }
          .info-row { display: flex; margin-bottom: 10px; }
          .info-label { font-weight: bold; width: 150px; }
          .line-items { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .line-items th, .line-items td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .line-items th { background-color: #f8f9fa; font-weight: bold; }
          .total-section { margin-top: 30px; text-align: right; }
          .total-row { margin-bottom: 10px; }
          .total-final { font-size: 18px; font-weight: bold; border-top: 2px solid #2563eb; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">QuoteMaster Pro</div>
          <div class="quote-title">Quote ${quote.id}</div>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Customer:</span>
            <span>${customer?.name || 'Unknown Customer'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Requesting User:</span>
            <span>${quote.requestingUser}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Quote Type:</span>
            <span>${quote.quote.quote_type || 'Daily Quote'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Created Date:</span>
            <span>${quote.createdDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Valid Until:</span>
            <span>${quote.validUntil}</span>
          </div>
        </div>

        <table class="line-items">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Supplier</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${(quote.quote.quote_line_items || []).map((item: any) => `
              <tr>
                <td>${item.sku}</td>
                <td>${item.product_name}</td>
                <td>${item.supplier}</td>
                <td>${item.quantity}</td>
                <td>$${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>$${item.subtotal.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <strong>Line Items: ${quote.lineItems}</strong>
          </div>
          <div class="total-row">
            <strong>Margin: ${quote.margin}%</strong>
          </div>
          <div class="total-final">
            <strong>Total: $${quote.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleDeleteQuote = (quoteId: string) => {
    setShowDeleteModal(quoteId);
  };

  const confirmDeleteQuote = async () => {
    if (!showDeleteModal) return;

    setDeleteLoading(true);
    try {
      const result = await deleteRecord('quotes', showDeleteModal, {
        type: 'hard',
        reason: 'User deleted quote from management interface'
      });

      if (result.success) {
        loadQuotes();
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quote Management</h2>
            <p className="text-gray-600 mt-1">View and manage all quotes and their current status</p>
          </div>

          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <FileText className="h-4 w-4 mr-2" />
              New Quote
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotes by number or customer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-sm text-gray-600">Loading quotes...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">Error loading quotes: {error}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value & Margin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{quote.quote_number}</div>
                      <div className="text-sm text-gray-600">{quote.lineItems} line items</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{quote.customer}</div>
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-3 w-3 mr-1" />
                        {quote.requestingUser}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        Created: {quote.createdDate}
                      </div>
                      <div className="text-sm text-gray-600">
                        Valid until: {quote.validUntil}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center font-medium text-gray-900">
                        <DollarSign className="h-3 w-3 mr-1" />
                        ${quote.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-green-600">
                        {quote.margin.toFixed(1)}% margin
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[quote.status as keyof typeof statusColors]}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditQuote(quote)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => generatePDF(quote)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                        title="Generate PDF"
                      >
                        <FileDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && displayQuotes.length === 0 && (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or status filter.</p>
          </div>
        )}

        {!loading && displayQuotes.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={pageSize}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {showDeleteModal && (
        <DeleteConfirmationModal
          isOpen={true}
          onClose={() => setShowDeleteModal(null)}
          onConfirm={confirmDeleteQuote}
          title="Delete Quote"
          message="Are you sure you want to delete this quote? This action will also delete all associated line items."
          itemName={displayQuotes.find(q => q.id === showDeleteModal)?.quote_number || 'Unknown Quote'}
          deleteType="hard"
          loading={deleteLoading}
          cascadeWarning="Deleting this quote will also permanently remove all line items, reservations, and cost analysis data associated with it."
        />
      )}
    </div>
  );
};
