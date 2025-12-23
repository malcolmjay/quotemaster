import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, Calendar, User, DollarSign, Eye, Edit, Trash2, Download, FileDown } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useSupabaseQuote } from '../../context/SupabaseQuoteContext';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { Pagination } from '../common/Pagination';
import { useDeletion } from '../../hooks/useDeletion';
import { getPaginatedQuotes } from '../../lib/supabase';
import { HelpTooltip } from '../common/HelpTooltip';

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

  const { setSelectedCustomer } = useCustomer();
  const { setCurrentQuote } = useSupabaseQuote();
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
        const customer = quote.customers;
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
    'Draft': 'bg-[#f5f5f5] text-[#333] border border-[#d4d4d4]',
    'Pending approval': 'bg-amber-100 text-amber-800 border border-amber-300',
    'Approved': 'bg-green-100 text-green-800 border border-green-300'
  };

  const handleEditQuote = (quote: DisplayQuote) => {
    console.log('Edit quote clicked:', quote.quote.quote_number);
    console.log('Customer data:', quote.quote.customers);

    const customer = quote.quote.customers;
    if (customer) {
      setSelectedCustomer(customer);
      console.log('Customer set:', customer.name);
    } else {
      console.warn('No customer data found in quote');
    }

    setCurrentQuote(quote.quote);

    window.location.hash = 'quote-builder';
    setTimeout(() => {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }, 50);
  };

  const generatePDF = (quote: DisplayQuote) => {
    const customer = quote.quote.customers;
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
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Oro-style Header */}
      <div className="bg-white border-b border-[#d4d4d4] sticky top-0 z-40">
        <div className="px-5 py-3">
          {/* Breadcrumb */}
          <div className="text-xs text-[#999] mb-2">
            Sales / Quote Management
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-normal text-[#333]">Quote Management</h1>
              <p className="text-sm text-[#666] mt-1">View and manage all quotes and their current status</p>
            </div>

            <div className="flex items-center gap-2">
              <HelpTooltip content="Export filtered quotes to CSV for reporting or analysis.">
                <button className="inline-flex items-center px-4 py-1.5 text-sm text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded border border-transparent hover:border-[#d4d4d4] transition-colors">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </HelpTooltip>
              <HelpTooltip content="Navigate to the quote builder to create a new quote.">
                <button className="inline-flex items-center px-4 py-1.5 bg-[#428bca] hover:bg-[#3276b1] text-white text-sm font-medium rounded transition-colors">
                  <FileText className="h-4 w-4 mr-2" />
                  New Quote
                </button>
              </HelpTooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 space-y-4">
        {/* Search and Filter Panel */}
        <div className="bg-white rounded border border-[#d4d4d4] p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <HelpTooltip content="Search quotes by quote number or customer name. Find quotes quickly for review or editing.">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#999]" />
                <input
                  type="text"
                  placeholder="Search quotes by number or customer..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca]"
                />
              </div>
            </HelpTooltip>

            <HelpTooltip content="Filter quotes by status: Draft (being edited), Pending Approval (awaiting manager review), or Approved (ready to book).">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-[#999]" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] text-[#333]"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </HelpTooltip>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#428bca]"></div>
              <span className="ml-3 text-sm text-[#666]">Loading quotes...</span>
            </div>
          )}

          {error && (
            <div className="bg-[#f2dede] border border-[#ebccd1] rounded p-4 mt-4">
              <p className="text-sm text-[#a94442]">Error loading quotes: {error}</p>
            </div>
          )}
        </div>

        {/* Quotes Table */}
        <div className="bg-white rounded border border-[#d4d4d4] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#fafafa] border-b border-[#d4d4d4]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Quote Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Timeline</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Value & Margin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#d4d4d4]">
              {displayQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-[#333]">{quote.quote_number}</div>
                      <div className="text-sm text-[#666]">{quote.lineItems} line items</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-[#333]">{quote.customer}</div>
                      <div className="flex items-center text-sm text-[#666]">
                        <User className="h-3 w-3 mr-1" />
                        {quote.requestingUser}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-[#666]">
                        <Calendar className="h-3 w-3 mr-1" />
                        Created: {quote.createdDate}
                      </div>
                      <div className="text-sm text-[#666]">
                        Valid until: {quote.validUntil}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center font-medium text-[#333]">
                        <DollarSign className="h-3 w-3 mr-1" />
                        ${quote.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-[#3c763d]">
                        {quote.margin.toFixed(1)}% margin
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${statusColors[quote.status as keyof typeof statusColors]}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <HelpTooltip content="View detailed quote information including all line items, pricing, and status.">
                        <button className="p-1.5 text-[#428bca] hover:bg-[#e8e8e8] rounded transition-colors" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                      </HelpTooltip>
                      <HelpTooltip content="Open this quote in the quote builder to modify line items, pricing, or details.">
                        <button
                          onClick={() => handleEditQuote(quote)}
                          className="p-1.5 text-[#666] hover:bg-[#e8e8e8] rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </HelpTooltip>
                      <HelpTooltip content="Create a PDF version of the quote for printing or emailing to the customer.">
                        <button
                          onClick={() => generatePDF(quote)}
                          className="p-1.5 text-[#5cb85c] hover:bg-[#e8e8e8] rounded transition-colors"
                          title="Generate PDF"
                        >
                          <FileDown className="h-4 w-4" />
                        </button>
                      </HelpTooltip>
                      <HelpTooltip content="Permanently delete this quote and all associated line items. This cannot be undone.">
                        <button
                          onClick={() => handleDeleteQuote(quote.id)}
                          className="p-1.5 text-[#d9534f] hover:bg-[#e8e8e8] rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </HelpTooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

          {!loading && displayQuotes.length === 0 && (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-[#d4d4d4] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#333] mb-2">No quotes found</h3>
              <p className="text-[#666]">Try adjusting your search criteria or status filter.</p>
            </div>
          )}

          {!loading && displayQuotes.length > 0 && (
            <div className="border-t border-[#d4d4d4]">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={pageSize}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
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
