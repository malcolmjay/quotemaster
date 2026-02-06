import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Package,
  Search,
  BarChart3,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  User,
  Calculator,
  Eye,
  RotateCcw,
  Trophy,
  X,
  ShoppingCart,
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  Building,
  Truck,
  Hash,
  DollarSign,
  Calendar,
  TrendingUp,
  Info,
  Play,
  Pause,
  Shield,
  Edit3,
  GitBranch,
  Database,
  Settings,
  Bot,
  ListTodo,
  MessageSquare,
  Bell,
  Cog,
  Users,
  MapPin,
  Mail,
  Warehouse
} from 'lucide-react';

interface TrainingSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  content: React.ReactNode;
}

export const TrainingGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const sections: TrainingSection[] = [
    {
      id: 'overview',
      title: 'System Overview',
      icon: BookOpen,
      description: 'Introduction to QuoteMaster Pro and its key capabilities',
      content: (
        <div className="space-y-6">
          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Welcome to QuoteMaster Pro</h3>
            <p className="text-[#31708f] mb-4">
              QuoteMaster Pro is a comprehensive quote management system designed to integrate seamlessly with your ERP system.
              It provides advanced quoting capabilities with real-time inventory management, cost analysis, and customer analytics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Key Benefits</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Seamless ERP integration</li>
                  <li>• Real-time inventory management</li>
                  <li>• Advanced cost analysis and margin calculation</li>
                  <li>• Professional PDF quote generation</li>
                  <li>• Cross-reference part number lookup</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Main Modules</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Quote Builder - Create and manage quotes</li>
                  <li>• Product Catalog - Browse available products</li>
                  <li>• Cross Reference - Part number lookup</li>
                  <li>• Customer Profile - Analytics and insights</li>
                  <li>• Quote Management - View all quotes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'quote-builder',
      title: 'Quote Builder',
      icon: FileText,
      description: 'Learn how to create comprehensive quotes with line items and cost analysis',
      content: (
        <div className="space-y-6">
          <div className="bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#3c763d] mb-3">Creating Your First Quote</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium text-[#3c763d]">Select Customer & User</h4>
                  <p className="text-[#3c763d] text-sm">Choose the customer and requesting user from the dropdown menus. This information will populate automatically in the quote header.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium text-[#3c763d]">Set Quote Details</h4>
                  <p className="text-[#3c763d] text-sm">Configure quote type (Daily Quote/Bid), validity dates, and optional bid/PO numbers.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium text-[#3c763d]">Add Line Items</h4>
                  <p className="text-[#3c763d] text-sm">Add products using search, product catalog, or CSV upload. Set quantities and pricing for each item.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#d4d4d4] rounded p-6">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Line Item Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-[#333] mb-3">Adding Products</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-[#f5f5f5] rounded">
                    <Search className="h-5 w-5 text-[#428bca]" />
                    <div>
                      <div className="font-medium text-sm text-[#333]">Search Bar</div>
                      <div className="text-xs text-[#666]">Type SKU or product name to search</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-[#f5f5f5] rounded">
                    <Package className="h-5 w-5 text-[#3c763d]" />
                    <div>
                      <div className="font-medium text-sm text-[#333]">Product Catalog</div>
                      <div className="text-xs text-[#666]">Browse all available products</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-[#f5f5f5] rounded">
                    <Upload className="h-5 w-5 text-[#8a6d3b]" />
                    <div>
                      <div className="font-medium text-sm text-[#333]">CSV Upload</div>
                      <div className="text-xs text-[#666]">Bulk import multiple items</div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-[#333] mb-3">Action Icons</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 text-sm text-[#666]">
                    <Calculator className="h-4 w-4 text-[#428bca]" />
                    <span><strong className="text-[#333]">Margin Calculator:</strong> Open cost analysis tool</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-[#666]">
                    <Eye className="h-4 w-4 text-[#666]" />
                    <span><strong className="text-[#333]">View History:</strong> See historical quotes for this product</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-[#666]">
                    <RotateCcw className="h-4 w-4 text-[#8a6d3b]" />
                    <span><strong className="text-[#333]">Reserve Inventory:</strong> Reserve available stock</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-[#666]">
                    <Trophy className="h-4 w-4 text-[#3c763d]" />
                    <span><strong className="text-[#333]">Won:</strong> Mark line item as won</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-[#666]">
                    <X className="h-4 w-4 text-red-600" />
                    <span><strong className="text-[#333]">Lost:</strong> Mark line item as lost</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-[#666]">
                    <ShoppingCart className="h-4 w-4 text-[#428bca]" />
                    <span><strong className="text-[#333]">Convert to Order:</strong> Create sales order</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#fcf8e3] text-[#8a6d3b] border border-[#faebcc] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#8a6d3b] mb-3">Pricing & Margins</h3>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Setting Prices</h4>
                <p className="text-sm text-[#666] mb-3">
                  When products are first added, the selling price is empty. Click on "Enter Price" to set your selling price.
                </p>
                <div className="bg-[#f5f5f5] p-3 rounded text-sm text-[#666]">
                  <strong className="text-[#333]">Margin Calculation:</strong> Margin % = (Selling Price - Cost) / Selling Price × 100
                </div>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Margin Color Coding</h4>
                <div className="space-y-2 text-sm text-[#666]">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span><strong className="text-[#333]">Green:</strong> Margin ≥ 20% (Excellent)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span><strong className="text-[#333]">Yellow:</strong> Margin 10-19% (Good)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span><strong className="text-[#333]">Red:</strong> Margin &lt; 10% (Review needed)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'product-catalog',
      title: 'Product Catalog',
      icon: Package,
      description: 'Browse and search the complete product inventory',
      content: (
        <div className="space-y-6">
          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Product Catalog Features</h3>
            <p className="text-[#31708f] mb-4">
              The Product Catalog provides a visual interface to browse all available products with real-time inventory information.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Search & Filter</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Search by SKU or product name</li>
                  <li>• Filter by product category</li>
                  <li>• Real-time search results</li>
                  <li>• Product count display</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Product Information</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Product images and descriptions</li>
                  <li>• Current stock levels</li>
                  <li>• Pricing information</li>
                  <li>• Lead time estimates</li>
                  <li>• Supplier details</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#d4d4d4] rounded p-6">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Using the Catalog</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium text-[#333]">Browse Products</h4>
                  <p className="text-[#666] text-sm">View products in a grid layout with images, pricing, and availability information.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium text-[#333]">Filter by Category</h4>
                  <p className="text-[#666] text-sm">Use the category dropdown to narrow down products by type (servers, networking, security).</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium text-[#333]">Select Products</h4>
                  <p className="text-[#666] text-sm">Click "Select" to add products directly to your current quote.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'cross-reference',
      title: 'Cross Reference',
      icon: Search,
      description: 'Understand part number cross-referencing and lookup functionality',
      content: (
        <div className="space-y-6">
          <div className="bg-[#fcf8e3] text-[#8a6d3b] border border-[#faebcc] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#8a6d3b] mb-3">Cross-Reference System</h3>
            <p className="text-[#8a6d3b] mb-4">
              The cross-reference system allows you to search for products using customer part numbers, supplier part numbers,
              or internal part numbers, making it easy to find the right products regardless of how they're referenced.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4] text-center">
                <Building className="h-8 w-8 text-[#428bca] mx-auto mb-2" />
                <h4 className="font-medium text-[#333] mb-1">Customer Parts</h4>
                <p className="text-xs text-[#666]">Customer-specific part numbers and references</p>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4] text-center">
                <Truck className="h-8 w-8 text-[#3c763d] mx-auto mb-2" />
                <h4 className="font-medium text-[#333] mb-1">Supplier Parts</h4>
                <p className="text-xs text-[#666]">Manufacturer and distributor part numbers</p>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4] text-center">
                <Hash className="h-8 w-8 text-[#8a6d3b] mx-auto mb-2" />
                <h4 className="font-medium text-[#333] mb-1">Internal Parts</h4>
                <p className="text-xs text-[#666]">Company-specific SKU management</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#d4d4d4] rounded p-6">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Cross-Reference Features</h3>
            <div className="space-y-4">
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">Search Capabilities</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Universal search across all part number types</li>
                  <li>• Filtered search by reference type</li>
                  <li>• Company name and description search</li>
                  <li>• Usage frequency tracking</li>
                </ul>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">Usage Analytics</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Last used date tracking</li>
                  <li>• Frequency counters</li>
                  <li>• Popular part identification</li>
                  <li>• Export capabilities for analysis</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Cross-Reference in Quote Builder</h3>
            <p className="text-[#31708f] mb-4">
              When you search for products in the Quote Builder using cross-references, the system automatically stores
              and displays the cross-reference information in the expanded line item details.
            </p>
            <div className="bg-white p-4 rounded border border-[#d4d4d4]">
              <h4 className="font-medium text-[#333] mb-2">Automatic Cross-Reference Display</h4>
              <p className="text-sm text-[#666] mb-3">
                When a product is found via cross-reference search, you'll see a purple-highlighted section showing:
              </p>
              <ul className="text-sm text-[#666] space-y-1">
                <li>• Customer Part Number used in search</li>
                <li>• Internal Part Number mapping</li>
                <li>• Supplier Part Number reference</li>
                <li>• Cross-reference relationship details</li>
              </ul>
            </div>
          </div>

          <div className="bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#3c763d] mb-3">Cross Reference Management</h3>
            <p className="text-[#3c763d] mb-4">
              The Cross Reference Management module allows you to create, edit, and maintain part number cross-references for customers and suppliers.
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium text-[#3c763d]">Add New Cross Reference</h4>
                  <p className="text-[#3c763d] text-sm">Click "Add Cross Reference" to create a new mapping between customer, supplier, and internal part numbers.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium text-[#3c763d]">Enter Part Details</h4>
                  <p className="text-[#3c763d] text-sm">Fill in customer part number, supplier part number, internal part number, company name, and optional description.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium text-[#3c763d]">Edit and Update</h4>
                  <p className="text-[#3c763d] text-sm">Use the edit icon to update existing cross-references. Changes are saved immediately.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <h4 className="font-medium text-[#3c763d]">Import Cross References</h4>
                  <p className="text-[#3c763d] text-sm">Use the import function to bulk upload cross-references from ERP or external systems.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'price-requests',
      title: 'Price Requests',
      icon: DollarSign,
      description: 'Submit and track price requests for line items requiring pricing',
      content: (
        <div className="space-y-6">
          <div className="bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#3c763d] mb-3">Price Request System</h3>
            <p className="text-[#3c763d] mb-4">
              The Price Request system allows sales representatives to request pricing for line items that don't have established costs.
              Requests are tracked centrally and can be fulfilled by purchasing or management teams.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Creating Price Requests</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Request from Quote Builder line items</li>
                  <li>• Bulk price requests for multiple items</li>
                  <li>• Manual entry via Price Requests page</li>
                  <li>• CSV upload for multiple requests</li>
                  <li>• Automatic quote and line item linking</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Managing Requests</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• View all pending price requests</li>
                  <li>• Update with cost information</li>
                  <li>• Track request status</li>
                  <li>• Filter by customer or product</li>
                  <li>• Export to spreadsheet</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#d4d4d4] rounded p-6">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Creating Price Requests from Quote Builder</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium text-[#333]">Select Line Items</h4>
                  <p className="text-[#666] text-sm">In Quote Builder, check the boxes next to line items needing pricing.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium text-[#333]">Click Bulk Actions</h4>
                  <p className="text-[#666] text-sm">Open the bulk actions menu and select "Request Price".</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium text-[#333]">Add Notes</h4>
                  <p className="text-[#666] text-sm">Include any special requirements, quantity information, or delivery needs in the notes field.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <h4 className="font-medium text-[#333]">Submit Request</h4>
                  <p className="text-[#666] text-sm">Price request is created and linked to the quote line items. Status updates automatically when pricing is received.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Manual Price Request Entry</h3>
            <p className="text-[#31708f] mb-4">
              Navigate to Price Requests and click "Add Price Request" to manually enter a pricing request.
            </p>
            <div className="bg-white p-4 rounded border border-[#d4d4d4]">
              <h4 className="font-medium text-[#333] mb-2">Required Information</h4>
              <ul className="text-sm text-[#666] space-y-1">
                <li>• Product/Part information</li>
                <li>• Quantity needed</li>
                <li>• Customer name (optional)</li>
                <li>• Target delivery date</li>
                <li>• Special requirements or notes</li>
                <li>• Requestor information (auto-filled)</li>
              </ul>
            </div>
          </div>

          <div className="bg-[#fcf8e3] text-[#8a6d3b] border border-[#faebcc] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#8a6d3b] mb-3">CSV Price Request Upload</h3>
            <p className="text-[#8a6d3b] mb-4">
              Upload multiple price requests at once using a CSV file. This is ideal for large quotes or routine pricing updates.
            </p>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">CSV Format Requirements</h4>
                <p className="text-sm text-[#666] mb-2">Your CSV file should include these columns:</p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Part Number/SKU</li>
                  <li>• Description</li>
                  <li>• Quantity</li>
                  <li>• Customer (optional)</li>
                  <li>• Notes (optional)</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Upload Process</h4>
                <ol className="text-sm text-[#666] space-y-1 list-decimal list-inside">
                  <li>Click "Upload CSV" button</li>
                  <li>Select your properly formatted CSV file</li>
                  <li>Review the preview of items to be imported</li>
                  <li>Confirm to create all price requests</li>
                  <li>Monitor status in Price Requests list</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Fulfilling Price Requests</h3>
            <p className="text-[#31708f] mb-4">
              Purchasing or management teams can update price requests with cost information.
            </p>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Update Request</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Click on a pending price request</li>
                  <li>• Enter the unit cost</li>
                  <li>• Update quantity if needed</li>
                  <li>• Add supplier information</li>
                  <li>• Include lead time details</li>
                  <li>• Mark as "Fulfilled"</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Auto-Update Line Items</h4>
                <p className="text-sm text-[#666]">
                  When a price request is fulfilled and linked to quote line items, the cost automatically updates
                  in the quote, allowing the sales rep to adjust pricing and complete the quote.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#333] mb-3">Price Request Status</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-3 p-3 bg-[#fcf8e3] text-[#8a6d3b] rounded border border-[#faebcc]">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">Pending</div>
                  <div className="text-xs text-[#666]">Awaiting pricing</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-[#d9edf7] text-[#31708f] rounded border border-[#bce8f1]">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">In Progress</div>
                  <div className="text-xs text-[#666]">Being researched</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-[#dff0d8] text-[#3c763d] rounded border border-[#d6e9c6]">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">Fulfilled</div>
                  <div className="text-xs text-[#666]">Pricing provided</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">Cancelled</div>
                  <div className="text-xs text-[#666]">No longer needed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'pending-approvals',
      title: 'Pending Approvals',
      icon: Shield,
      description: 'Review and approve quotes requiring authorization',
      content: (
        <div className="space-y-6">
          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 mb-3">Approval System Overview</h3>
            <p className="text-red-800 mb-4">
              The approval system ensures quotes exceeding role-based limits are reviewed by appropriate authorities before
              being sent to customers. This maintains pricing discipline and protects margins.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Why Approvals?</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Ensure competitive but profitable pricing</li>
                  <li>• Maintain margin standards</li>
                  <li>• Senior oversight on large deals</li>
                  <li>• Risk management for high-value quotes</li>
                  <li>• Compliance with company policies</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Approval Triggers</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Quote value exceeds user's limit</li>
                  <li>• Margin below acceptable threshold</li>
                  <li>• Special pricing or discounts</li>
                  <li>• Custom terms or conditions</li>
                  <li>• Manual approval request</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#d4d4d4] rounded p-6">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Viewing Pending Approvals</h3>
            <p className="text-[#666] mb-4">
              Navigate to "Pending Approvals" to see all quotes requiring your authorization. The list shows:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-[#333] mb-2">Quote Information</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Quote number and date</li>
                  <li>• Customer name</li>
                  <li>• Total quote value</li>
                  <li>• Overall margin percentage</li>
                  <li>• Requesting user/CSR</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-[#333] mb-2">Approval Details</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Why approval is needed</li>
                  <li>• Days pending approval</li>
                  <li>• Priority or urgency flags</li>
                  <li>• Line item count</li>
                  <li>• Special notes or comments</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Reviewing a Quote for Approval</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium text-[#333]">Open Quote Details</h4>
                  <p className="text-[#666] text-sm">Click "View Details" to see the complete quote including all line items, costs, and margins.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium text-[#333]">Review Line Items</h4>
                  <p className="text-[#666] text-sm">Examine each line item's cost, price, and margin. Look for items with low margins or unusual pricing.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium text-[#333]">Check Customer History</h4>
                  <p className="text-[#666] text-sm">Review customer profile for past win rates, margins, and buying patterns.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <h4 className="font-medium text-[#333]">Make Decision</h4>
                  <p className="text-[#666] text-sm">Approve, reject, or request changes. Add comments explaining your decision.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#3c763d] mb-3">Approving Quotes</h3>
            <p className="text-[#3c763d] mb-4">
              When you approve a quote, it returns to the CSR who can then send it to the customer.
            </p>
            <div className="bg-white p-4 rounded border border-[#d4d4d4]">
              <h4 className="font-medium text-[#333] mb-2">Approval Actions</h4>
              <ul className="text-sm text-[#666] space-y-1">
                <li>• Click "Approve" button</li>
                <li>• Add approval comments (optional but recommended)</li>
                <li>• Quote status changes to "Approved"</li>
                <li>• CSR receives notification</li>
                <li>• Quote can now be sent to customer</li>
                <li>• Your approval is logged in audit trail</li>
              </ul>
            </div>
          </div>

          <div className="bg-[#fcf8e3] text-[#8a6d3b] border border-[#faebcc] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#8a6d3b] mb-3">Rejecting or Requesting Changes</h3>
            <p className="text-[#8a6d3b] mb-4">
              If a quote needs revision, you can reject it or request specific changes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Reject Quote</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Click "Reject" button</li>
                  <li>• Provide clear reason for rejection</li>
                  <li>• Suggest specific improvements</li>
                  <li>• Quote returns to CSR for revision</li>
                  <li>• CSR can resubmit after changes</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Request Changes</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Click "Request Changes"</li>
                  <li>• Specify what needs adjustment</li>
                  <li>• Identify problematic line items</li>
                  <li>• Suggest acceptable margins</li>
                  <li>• CSR receives detailed feedback</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Approval Best Practices</h3>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Review Thoroughly</h4>
                <p className="text-sm text-[#666]">
                  Don't just look at the total margin. Review individual line items for outliers, check customer history,
                  and consider strategic value of the opportunity.
                </p>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Respond Promptly</h4>
                <p className="text-sm text-[#666]">
                  Customers are waiting. Try to review and respond to approval requests within 24 hours.
                  Delays can result in lost opportunities.
                </p>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Provide Feedback</h4>
                <p className="text-sm text-[#666]">
                  Always add comments when rejecting or requesting changes. Help CSRs understand your reasoning
                  so they can improve future quotes.
                </p>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Consider Context</h4>
                <p className="text-sm text-[#666]">
                  A lower margin might be acceptable for a strategic account, high-volume opportunity, or to establish
                  a relationship with a new customer.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'customer-profile',
      title: 'Customer Profile',
      icon: BarChart3,
      description: 'View customer analytics, performance metrics, and quote history',
      content: (
        <div className="space-y-6">
          <div className="bg-indigo-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-900 mb-3">Customer Analytics Dashboard</h3>
            <p className="text-indigo-800 mb-4">
              The Customer Profile provides comprehensive analytics and insights about your customers' quoting patterns, 
              win rates, and profitability metrics.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg text-center">
                <TrendingUp className="h-6 w-6 text-[#428bca] mx-auto mb-1" />
                <div className="text-xs font-medium">Average Margin</div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <Trophy className="h-6 w-6 text-[#3c763d] mx-auto mb-1" />
                <div className="text-xs font-medium">Won Margin</div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <X className="h-6 w-6 text-red-600 mx-auto mb-1" />
                <div className="text-xs font-medium">Lost Margin</div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <CheckCircle className="h-6 w-6 text-[#8a6d3b] mx-auto mb-1" />
                <div className="text-xs font-medium">Win Rate</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#d4d4d4] rounded p-6">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Key Metrics Explained</h3>
            <div className="space-y-4">
              <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-4 rounded">
                <h4 className="font-medium text-[#31708f] mb-2">Average Quote Margin</h4>
                <p className="text-sm text-[#31708f]">
                  The average margin percentage across all quotes for this customer, calculated from line item costs and selling prices.
                </p>
              </div>
              <div className="bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6] p-4 rounded">
                <h4 className="font-medium text-[#3c763d] mb-2">Won Opportunities Margin</h4>
                <p className="text-sm text-[#3c763d]">
                  The average margin on quotes that were successfully won, helping identify profitable pricing strategies.
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Lost Opportunities Margin</h4>
                <p className="text-sm text-red-800">
                  The average margin on quotes that were lost, useful for understanding competitive pricing pressures.
                </p>
              </div>
              <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-4 rounded">
                <h4 className="font-medium text-[#31708f] mb-2">Win Rate</h4>
                <p className="text-sm text-[#31708f]">
                  The percentage of quotes that resulted in wins, calculated as (Won Quotes / Total Quotes) × 100.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#333] mb-3">Using Customer Analytics</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-[#428bca] mt-0.5" />
                <div>
                  <h4 className="font-medium text-[#333]">Time Range Selection</h4>
                  <p className="text-sm text-[#666]">Use the 3, 6, or 12-month buttons to adjust the analysis period.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <BarChart3 className="h-5 w-5 text-[#3c763d] mt-0.5" />
                <div>
                  <h4 className="font-medium text-[#333]">Trend Analysis</h4>
                  <p className="text-sm text-[#666]">Charts show quote values and margin trends over time to identify patterns.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <DollarSign className="h-5 w-5 text-[#8a6d3b] mt-0.5" />
                <div>
                  <h4 className="font-medium text-[#333]">Value Metrics</h4>
                  <p className="text-sm text-[#666]">Track total quote values, average quote sizes, and quote frequency.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'quote-management',
      title: 'Quote Management',
      icon: FolderOpen,
      description: 'Manage all quotes, track status, and generate customer deliverables',
      content: (
        <div className="space-y-6">
          <div className="bg-teal-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-teal-900 mb-3">Quote Management Overview</h3>
            <p className="text-teal-800 mb-4">
              The Quote Management module provides a centralized view of all quotes with powerful search, filtering, 
              and management capabilities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Quote Tracking</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• View all quotes in one place</li>
                  <li>• Track quote status and timeline</li>
                  <li>• Monitor quote values and margins</li>
                  <li>• Search by customer or quote ID</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Quote Actions</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Generate PDF quotes for customers</li>
                  <li>• Edit existing quotes</li>
                  <li>• Export quote data</li>
                  <li>• Delete outdated quotes</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#d4d4d4] rounded p-6">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Quote Status Indicators</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-[#f5f5f5] rounded">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">Draft</div>
                  <div className="text-xs text-[#666]">Quote in progress</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">Sent</div>
                  <div className="text-xs text-[#666]">Delivered to customer</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">Won</div>
                  <div className="text-xs text-[#666]">Customer accepted</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">Lost</div>
                  <div className="text-xs text-[#666]">Customer declined</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-[#fcf8e3] text-[#8a6d3b] rounded border border-[#faebcc]">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">Expired</div>
                  <div className="text-xs text-[#666]">Past validity date</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">Accepted</div>
                  <div className="text-xs text-[#666]">Awaiting order</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#fcf8e3] text-[#8a6d3b] border border-[#faebcc] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#8a6d3b] mb-3">PDF Quote Generation</h3>
            <p className="text-[#8a6d3b] mb-4">
              Generate professional PDF quotes that can be sent directly to customers.
            </p>
            <div className="bg-white p-4 rounded border border-[#d4d4d4]">
              <h4 className="font-medium text-[#333] mb-2">PDF Features</h4>
              <ul className="text-sm text-[#666] space-y-1">
                <li>• Professional company branding and layout</li>
                <li>• Complete customer and quote information</li>
                <li>• Detailed line item breakdown with pricing</li>
                <li>• Total calculations and terms</li>
                <li>• Print-ready format for customer delivery</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'product-management',
      title: 'Product Management',
      icon: Edit3,
      description: 'Manage product catalog, pricing, and inventory information',
      content: (
        <div className="space-y-6">
          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Product Management Overview</h3>
            <p className="text-[#31708f] mb-4">
              Product Management allows you to maintain your complete product catalog including SKUs, descriptions,
              pricing, inventory levels, and supplier information.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Product Information</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• SKU and product names</li>
                  <li>• Descriptions and specifications</li>
                  <li>• Categories and classifications</li>
                  <li>• Images and documentation</li>
                  <li>• Supplier details and contacts</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Pricing & Inventory</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Base cost and list prices</li>
                  <li>• Current stock levels</li>
                  <li>• Reserved quantities</li>
                  <li>• Lead time information</li>
                  <li>• Reorder points and quantities</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#3c763d] mb-3">Adding New Products</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3c763d] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium text-[#333]">Click Add Product</h4>
                  <p className="text-[#666] text-sm">Navigate to Product Management and click "Add Product" button.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3c763d] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium text-[#333]">Enter Product Details</h4>
                  <p className="text-[#666] text-sm">Fill in SKU, name, description, category, and other product information.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3c763d] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium text-[#333]">Set Pricing</h4>
                  <p className="text-[#666] text-sm">Enter base cost, list price, and any special pricing information.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3c763d] text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <h4 className="font-medium text-[#333]">Add Inventory Data</h4>
                  <p className="text-[#666] text-sm">Set initial stock quantity, warehouse location, and lead time information.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Editing Products</h3>
            <p className="text-[#31708f] mb-4">
              Click the edit icon next to any product to update its information. All changes are saved immediately.
            </p>
            <div className="bg-white p-4 rounded border border-[#d4d4d4]">
              <h4 className="font-medium text-[#333] mb-2">Common Updates</h4>
              <ul className="text-sm text-[#666] space-y-1">
                <li>• Price adjustments based on supplier changes</li>
                <li>• Inventory level updates</li>
                <li>• Description improvements</li>
                <li>• Category reclassification</li>
                <li>• Supplier contact updates</li>
                <li>• Lead time modifications</li>
              </ul>
            </div>
          </div>

          <div className="bg-[#fcf8e3] text-[#8a6d3b] border border-[#faebcc] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#8a6d3b] mb-3">Bulk Product Import</h3>
            <p className="text-[#8a6d3b] mb-4">
              Use the Product Import feature to upload multiple products at once from your ERP system or CSV files.
              See the Product Import section for detailed instructions.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'customer-management',
      title: 'Customer Management',
      icon: Building,
      description: 'Manage customer information, contacts, and addresses',
      content: (
        <div className="space-y-6">
          <div className="bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#3c763d] mb-3">Customer Management Overview</h3>
            <p className="text-[#3c763d] mb-4">
              Customer Management provides a centralized location to maintain customer accounts, contacts, addresses,
              and important business information.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Customer Information</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Company name and details</li>
                  <li>• Account numbers and IDs</li>
                  <li>• Payment terms</li>
                  <li>• Credit limits</li>
                  <li>• Sales representative assignment</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Contacts & Addresses</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Multiple contact persons</li>
                  <li>• Email and phone numbers</li>
                  <li>• Shipping addresses</li>
                  <li>• Billing addresses</li>
                  <li>• Warehouse locations</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Adding New Customers</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium text-[#333]">Click Add Customer</h4>
                  <p className="text-[#666] text-sm">From Customer Management, click "Add Customer" button.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium text-[#333]">Enter Company Details</h4>
                  <p className="text-[#666] text-sm">Fill in company name, account number, and business information.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium text-[#333]">Add Contacts</h4>
                  <p className="text-[#666] text-sm">Create contact records for key personnel with email and phone.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#428bca] text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <h4 className="font-medium text-[#333]">Add Addresses</h4>
                  <p className="text-[#666] text-sm">Enter shipping and billing addresses with complete details.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Managing Customer Contacts</h3>
            <p className="text-[#31708f] mb-4">
              Each customer can have multiple contacts for different purposes (purchasing, receiving, accounts payable, etc.).
            </p>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Contact Information</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• First and last name</li>
                  <li>• Title/Position</li>
                  <li>• Email address</li>
                  <li>• Phone and mobile numbers</li>
                  <li>• Primary contact designation</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Managing Contacts</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Click customer to view contacts</li>
                  <li>• Add new contacts with "Add Contact" button</li>
                  <li>• Edit existing contacts</li>
                  <li>• Mark one contact as primary</li>
                  <li>• Delete outdated contacts</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#fcf8e3] text-[#8a6d3b] border border-[#faebcc] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#8a6d3b] mb-3">Managing Customer Addresses</h3>
            <p className="text-[#8a6d3b] mb-4">
              Maintain shipping and billing addresses for each customer. Multiple addresses can be stored.
            </p>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Address Types</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Shipping addresses - where products are delivered</li>
                  <li>• Billing addresses - where invoices are sent</li>
                  <li>• Warehouse addresses - customer warehouse locations</li>
                  <li>• Default address designation</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Address Information</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Street address, city, state, ZIP</li>
                  <li>• Country</li>
                  <li>• Attention to/Receiving contact</li>
                  <li>• Special delivery instructions</li>
                  <li>• Warehouse codes (for ERP integration)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 mb-3">Customer Import</h3>
            <p className="text-red-800 mb-4">
              Bulk import customers from your ERP system using the import API or CSV upload functionality.
              This is ideal for initial system setup or periodic synchronization.
            </p>
            <div className="bg-white p-4 rounded border border-[#d4d4d4]">
              <h4 className="font-medium text-[#333] mb-2">Import Methods</h4>
              <ul className="text-sm text-[#666] space-y-1">
                <li>• ERP API integration</li>
                <li>• CSV file upload</li>
                <li>• Manual entry for small volumes</li>
                <li>• Automated nightly synchronization</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'item-relationships',
      title: 'Item Relationships',
      icon: GitBranch,
      description: 'Define relationships between products for supersessions and alternatives',
      content: (
        <div className="space-y-6">
          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Item Relationships Overview</h3>
            <p className="text-[#31708f] mb-4">
              Item Relationships allow you to define connections between products such as supersessions (when a product
              is replaced by a newer model) and alternatives (when multiple products can fulfill the same need).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4] text-center">
                <RotateCcw className="h-8 w-8 text-[#428bca] mx-auto mb-2" />
                <h4 className="font-medium text-[#333] mb-1">Supersessions</h4>
                <p className="text-xs text-[#666]">Product A is replaced by newer Product B</p>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4] text-center">
                <GitBranch className="h-8 w-8 text-[#3c763d] mx-auto mb-2" />
                <h4 className="font-medium text-[#333] mb-1">Alternatives</h4>
                <p className="text-xs text-[#666]">Products that can substitute for each other</p>
              </div>
            </div>
          </div>

          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Supersessions Explained</h3>
            <p className="text-[#31708f] mb-4">
              A supersession occurs when a manufacturer discontinues a product and replaces it with an updated version.
              The system helps you automatically suggest the new part when quoting the old one.
            </p>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Use Cases</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Product model updates and revisions</li>
                  <li>• Discontinued items with direct replacements</li>
                  <li>• Manufacturer part number changes</li>
                  <li>• Technology upgrades and improvements</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">How It Works</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Customer requests discontinued part A</li>
                  <li>• System finds supersession to part B</li>
                  <li>• Quote Builder suggests part B automatically</li>
                  <li>• Notes indicate supersession relationship</li>
                  <li>• Customer gets current product</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#3c763d] mb-3">Creating Supersessions</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3c763d] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium text-[#333]">Navigate to Item Relationships</h4>
                  <p className="text-[#666] text-sm">Click "Item Relationships" in the navigation menu.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3c763d] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium text-[#333]">Add Relationship</h4>
                  <p className="text-[#666] text-sm">Click "Add Relationship" and select "Supersession" as the type.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3c763d] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium text-[#333]">Select Products</h4>
                  <p className="text-[#666] text-sm">Choose the old/superseded product and the new/superseding product.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3c763d] text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <h4 className="font-medium text-[#333]">Add Notes</h4>
                  <p className="text-[#666] text-sm">Include notes about compatibility, differences, or special considerations.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#fcf8e3] text-[#8a6d3b] border border-[#faebcc] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#8a6d3b] mb-3">Alternative Products</h3>
            <p className="text-[#8a6d3b] mb-4">
              Alternatives are products that can substitute for each other. Unlike supersessions, neither is obsolete -
              they're simply different options that meet the same need.
            </p>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">When to Use Alternatives</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Different brands offering same functionality</li>
                  <li>• Various capacity/size options</li>
                  <li>• Different price points for similar products</li>
                  <li>• Stock availability alternatives</li>
                  <li>• Customer preference options</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Alternative Benefits</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Offer options when primary product unavailable</li>
                  <li>• Provide better pricing alternatives</li>
                  <li>• Faster delivery from alternative supplier</li>
                  <li>• Meet specific customer requirements</li>
                  <li>• Improve quote win rates</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 mb-3">Relationship Management</h3>
            <p className="text-red-800 mb-4">
              Keep your relationships current by reviewing and updating them regularly.
            </p>
            <div className="bg-white p-4 rounded border border-[#d4d4d4]">
              <h4 className="font-medium text-[#333] mb-2">Best Practices</h4>
              <ul className="text-sm text-[#666] space-y-1">
                <li>• Update supersessions when manufacturers announce changes</li>
                <li>• Verify alternative products are truly compatible</li>
                <li>• Include detailed notes for CSR guidance</li>
                <li>• Review relationships quarterly for accuracy</li>
                <li>• Remove obsolete relationships</li>
                <li>• Document any special considerations or limitations</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'product-import',
      title: 'Product Import',
      icon: Database,
      description: 'Import products in bulk from ERP systems or CSV files',
      content: (
        <div className="space-y-6">
          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Product Import Overview</h3>
            <p className="text-[#31708f] mb-4">
              Product Import enables bulk loading of product data from external systems. This is essential for initial
              setup and ongoing synchronization with your ERP or inventory management system.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Import Methods</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• ERP API integration</li>
                  <li>• CSV file upload</li>
                  <li>• Automated scheduled imports</li>
                  <li>• Manual triggered imports</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">What Gets Imported</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Product SKUs and names</li>
                  <li>• Descriptions and specifications</li>
                  <li>• Pricing and cost data</li>
                  <li>• Inventory quantities</li>
                  <li>• Supplier information</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#3c763d] mb-3">CSV Import Process</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3c763d] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium text-[#333]">Prepare CSV File</h4>
                  <p className="text-[#666] text-sm">Export product data from your system in CSV format with required columns.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3c763d] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium text-[#333]">Navigate to Product Import</h4>
                  <p className="text-[#666] text-sm">Click "Product Import" in the navigation menu.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3c763d] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium text-[#333]">Upload File</h4>
                  <p className="text-[#666] text-sm">Click "Choose File" and select your CSV. The system will preview the data.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3c763d] text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <h4 className="font-medium text-[#333]">Review and Import</h4>
                  <p className="text-[#666] text-sm">Verify the preview looks correct, then click "Import" to process all products.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">CSV Format Requirements</h3>
            <p className="text-[#31708f] mb-4">
              Your CSV file must include specific columns for successful import. Here are the required and optional fields:
            </p>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Required Columns</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• SKU - Product identifier (must be unique)</li>
                  <li>• Name - Product name/title</li>
                  <li>• Category - Product category</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Optional Columns</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Description - Detailed product description</li>
                  <li>• List Price - Manufacturer suggested price</li>
                  <li>• Cost - Your cost/base price</li>
                  <li>• Stock Quantity - Current inventory level</li>
                  <li>• Lead Time - Days until available</li>
                  <li>• Supplier Name - Vendor information</li>
                  <li>• Supplier Email - Vendor contact</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#fcf8e3] text-[#8a6d3b] border border-[#faebcc] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#8a6d3b] mb-3">ERP API Integration</h3>
            <p className="text-[#8a6d3b] mb-4">
              For automated imports, configure API integration with your ERP system.
            </p>
            <div className="bg-white p-4 rounded border border-[#d4d4d4]">
              <h4 className="font-medium text-[#333] mb-2">API Import Benefits</h4>
              <ul className="text-sm text-[#666] space-y-1">
                <li>• Automatic nightly synchronization</li>
                <li>• Real-time inventory updates</li>
                <li>• Price changes reflected immediately</li>
                <li>• No manual file handling</li>
                <li>• Reduced data entry errors</li>
                <li>• Audit trail of all imports</li>
              </ul>
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 mb-3">Import Best Practices</h3>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Before Importing</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Validate data in your source system first</li>
                  <li>• Test with a small sample file initially</li>
                  <li>• Back up existing data if replacing products</li>
                  <li>• Schedule large imports during off-hours</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">After Importing</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Review import summary for errors</li>
                  <li>• Spot-check random products for accuracy</li>
                  <li>• Verify critical products imported correctly</li>
                  <li>• Update cross-references if needed</li>
                  <li>• Communicate changes to sales team</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      description: 'Configure system settings, approval limits, and integrations',
      content: (
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#333] mb-3">Settings Overview</h3>
            <p className="text-[#666] mb-4">
              The Settings module allows administrators to configure system-wide options, approval workflows,
              ERP integrations, and other operational parameters.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Configuration Options</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Approval limit by role</li>
                  <li>• ERP connection settings</li>
                  <li>• Email notifications</li>
                  <li>• Default quote terms</li>
                  <li>• Company branding</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Integration Settings</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• ERP API configuration</li>
                  <li>• External system connections</li>
                  <li>• Import API authentication</li>
                  <li>• Sync schedules</li>
                  <li>• Webhook configurations</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Approval Limits Configuration</h3>
            <p className="text-[#31708f] mb-4">
              Set maximum quote values that each role can approve without escalation. This ensures proper oversight
              on large or risky quotes.
            </p>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Setting Approval Limits</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Navigate to Settings → Approval Limits</li>
                  <li>• Each role shows current limit</li>
                  <li>• Click edit to change limit amount</li>
                  <li>• Enter new maximum quote value</li>
                  <li>• Save changes - effective immediately</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Recommended Limits</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• CSR: $5,000 - $10,000</li>
                  <li>• Manager: $25,000 - $50,000</li>
                  <li>• Director: $100,000 - $250,000</li>
                  <li>• VP: $500,000 - $1,000,000</li>
                  <li>• President: Unlimited</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#3c763d] mb-3">ERP Integration Configuration</h3>
            <p className="text-[#3c763d] mb-4">
              Configure connections to your ERP system for automated data synchronization.
            </p>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">ERP Connection Settings</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• API base URL</li>
                  <li>• API key and credentials</li>
                  <li>• Organization ID</li>
                  <li>• Sync frequency (hourly, daily)</li>
                  <li>• Data mapping configuration</li>
                  <li>• Authentication credentials</li>
                  <li>• Operating unit selection</li>
                  <li>• Inventory organization</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Import API Settings</h3>
            <p className="text-[#31708f] mb-4">
              Configure authentication and access control for the product, customer, and cross-reference import APIs.
            </p>
            <div className="bg-white p-4 rounded border border-[#d4d4d4]">
              <h4 className="font-medium text-[#333] mb-2">API Configuration</h4>
              <ul className="text-sm text-[#666] space-y-1">
                <li>• Generate API keys for external systems</li>
                <li>• Set rate limits to prevent abuse</li>
                <li>• Configure IP whitelisting</li>
                <li>• Enable/disable specific import endpoints</li>
                <li>• View API usage logs and statistics</li>
                <li>• Manage API key permissions</li>
              </ul>
            </div>
          </div>

          <div className="bg-[#fcf8e3] text-[#8a6d3b] border border-[#faebcc] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#8a6d3b] mb-3">System Preferences</h3>
            <p className="text-[#8a6d3b] mb-4">
              Customize general system behavior and defaults.
            </p>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Quote Defaults</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Default validity period (30, 60, 90 days)</li>
                  <li>• Standard payment terms</li>
                  <li>• Default shipping method</li>
                  <li>• Quote number format/prefix</li>
                  <li>• Default notes and disclaimers</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Display Preferences</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Date format (MM/DD/YYYY, DD/MM/YYYY)</li>
                  <li>• Currency format and symbol</li>
                  <li>• Number decimal places</li>
                  <li>• Pagination page size</li>
                  <li>• Time zone settings</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 mb-3">Security Settings</h3>
            <p className="text-red-800 mb-4">
              Configure security and access control settings.
            </p>
            <div className="bg-white p-4 rounded border border-[#d4d4d4]">
              <h4 className="font-medium text-[#333] mb-2">Security Options</h4>
              <ul className="text-sm text-[#666] space-y-1">
                <li>• Password complexity requirements</li>
                <li>• Session timeout duration</li>
                <li>• Multi-factor authentication settings</li>
                <li>• Failed login attempt limits</li>
                <li>• Audit log retention period</li>
                <li>• Data export permissions</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'user-management',
      title: 'User Management',
      icon: User,
      description: 'Create and manage users with role-based access control',
      content: (
        <div className="space-y-6">
          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">User Management Overview</h3>
            <p className="text-[#31708f] mb-4">
              The User Management module allows administrators to create, manage, and assign roles to users.
              Role-based access control ensures users have appropriate permissions for their responsibilities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">User Administration</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Create users with email and password</li>
                  <li>• Assign roles during user creation</li>
                  <li>• Edit user display names</li>
                  <li>• Enable or disable user accounts</li>
                  <li>• View user activity and status</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Role Management</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Assign multiple roles to users</li>
                  <li>• Modify user roles anytime</li>
                  <li>• Activate or deactivate specific roles</li>
                  <li>• Track role assignment history</li>
                  <li>• Configure approval limits by role</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#d4d4d4] rounded p-6">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Available User Roles</h3>
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-red-900">Admin</h4>
                  <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">Full Access</span>
                </div>
                <p className="text-sm text-red-800">
                  Full system access including user management, configuration settings, and all administrative functions.
                  Can create users, assign roles, and manage system settings.
                </p>
              </div>

              <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-[#31708f]">President</h4>
                  <span className="text-xs bg-[#8a6d3b] text-white px-2 py-1 rounded">Highest Approval</span>
                </div>
                <p className="text-sm text-[#31708f]">
                  Executive level with highest quote approval authority. Can approve quotes of any value and access all customer data.
                </p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-indigo-900">VP</h4>
                  <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">Executive Level</span>
                </div>
                <p className="text-sm text-indigo-800">
                  Vice President level with high approval authority. Can approve large value quotes and manage teams.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-[#31708f]">Director</h4>
                  <span className="text-xs bg-[#428bca] text-white px-2 py-1 rounded">Senior Management</span>
                </div>
                <p className="text-sm text-[#31708f]">
                  Director level with substantial approval limits. Can approve mid to high value quotes and oversee operations.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-[#3c763d]">Manager</h4>
                  <span className="text-xs bg-[#3c763d] text-white px-2 py-1 rounded">Management</span>
                </div>
                <p className="text-sm text-[#3c763d]">
                  Manager level with moderate approval authority. Can approve standard value quotes and manage CSR teams.
                  Can also create users and assign roles.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-[#333]">CSR</h4>
                  <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">Basic User</span>
                </div>
                <p className="text-sm text-gray-800">
                  Customer Service Representative with basic quote creation and management permissions. Can create quotes up to their approval limit.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#3c763d] mb-3">Creating a New User</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3c763d] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium text-[#333]">Click Create User</h4>
                  <p className="text-[#666] text-sm">From the User Management page, click the "Create User" button (Admin or Manager role required).</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3c763d] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium text-[#333]">Enter User Details</h4>
                  <p className="text-[#666] text-sm">Fill in email address (required), password (min 8 characters), and optional display name.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3c763d] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium text-[#333]">Select User Roles</h4>
                  <p className="text-[#666] text-sm">Check one or more roles for the user. Multiple roles can be assigned (e.g., CSR + Manager).</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#3c763d] text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <h4 className="font-medium text-[#333]">Create User</h4>
                  <p className="text-[#666] text-sm">Click "Create User" - the user is created with assigned roles and can log in immediately.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#fcf8e3] text-[#8a6d3b] border border-[#faebcc] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#8a6d3b] mb-3">Managing Existing Users</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Edit User Information</h4>
                <p className="text-sm text-[#666] mb-2">Update user details and settings:</p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Click edit icon next to user</li>
                  <li>• Modify display name</li>
                  <li>• Email cannot be changed after creation</li>
                  <li>• Save changes to update user profile</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Manage User Roles</h4>
                <p className="text-sm text-[#666] mb-2">Assign or modify user roles:</p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Click "Manage Roles" button</li>
                  <li>• View current role assignments</li>
                  <li>• Add new roles or remove existing ones</li>
                  <li>• Activate or deactivate specific roles</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Disable User Account</h4>
                <p className="text-sm text-[#666] mb-2">Temporarily disable user access:</p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Click disable icon (user with X)</li>
                  <li>• Optionally provide reason for disabling</li>
                  <li>• User cannot log in while disabled</li>
                  <li>• User data is preserved</li>
                  <li>• Can be re-enabled anytime</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">View User Status</h4>
                <p className="text-sm text-[#666] mb-2">Monitor user information:</p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Active/Disabled status indicator</li>
                  <li>• Current role assignments with badges</li>
                  <li>• Email address and display name</li>
                  <li>• Last login information</li>
                  <li>• Account creation date</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Approval Limits by Role</h3>
            <p className="text-[#31708f] mb-4">
              Each role can have specific approval limits configured. Users must get approval from higher authorities
              when quote values exceed their limit.
            </p>
            <div className="bg-white p-4 rounded border border-[#d4d4d4]">
              <h4 className="font-medium text-[#333] mb-2">Configuring Approval Limits</h4>
              <ul className="text-sm text-[#666] space-y-1">
                <li>• Navigate to Settings → Approval Limits</li>
                <li>• Set maximum quote value for each role</li>
                <li>• Quotes exceeding limit require approval</li>
                <li>• Approval requests route to appropriate authority</li>
                <li>• Multiple approval levels supported</li>
              </ul>
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 mb-3">Important Security Notes</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-900">Admin Role Privileges</h4>
                  <p className="text-sm text-red-800">
                    Only assign Admin role to trusted users. Admins can create users, modify system settings,
                    and access all data. This role should be limited to IT administrators and executives.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-900">Password Requirements</h4>
                  <p className="text-sm text-red-800">
                    All passwords must be at least 8 characters. Users receive email confirmation and can
                    change their password after first login. Strong passwords are recommended.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-900">Account Deactivation</h4>
                  <p className="text-sm text-red-800">
                    Disable user accounts instead of deleting them to preserve audit trails and data integrity.
                    Disabled users cannot log in but all their historical data remains accessible.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-900">Role Combinations</h4>
                  <p className="text-sm text-red-800">
                    Users can have multiple roles (e.g., CSR + Manager). The highest privilege level applies.
                    Be careful when combining roles to avoid unintended permission elevation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#333] mb-3">Best Practices</h3>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">User Creation</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Assign roles during user creation to streamline onboarding</li>
                  <li>• Use descriptive display names for easy user identification</li>
                  <li>• Verify email addresses before creating accounts</li>
                  <li>• Start new users with minimal roles and expand as needed</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Role Management</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Review user roles periodically to ensure appropriate access</li>
                  <li>• Remove unnecessary roles when user responsibilities change</li>
                  <li>• Document role assignments for audit purposes</li>
                  <li>• Use role-based approval limits to maintain control</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Security</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Disable accounts immediately when employees leave</li>
                  <li>• Regularly audit user list for inactive accounts</li>
                  <li>• Limit Admin role assignments to essential personnel</li>
                  <li>• Monitor user activity for unusual patterns</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ai-agent',
      title: 'AI Database Agent',
      icon: Bot,
      description: 'Learn how to use the AI assistant to query and analyze data',
      content: (
        <div className="space-y-6">
          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">AI Database Agent</h3>
            <p className="text-[#31708f] mb-4">
              The AI Database Agent is an intelligent assistant that can query your database using natural language.
              Ask questions about quotes, customers, inventory, and more without writing SQL.
            </p>
          </div>

          <div className="bg-white p-6 rounded border border-[#d4d4d4]">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Getting Started</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#333] mb-2">Accessing the AI Agent</h4>
                <p className="text-sm text-[#666] mb-2">
                  Click on the "AI Agent" tab in the main navigation to open the chat interface.
                  The AI agent requires a Claude API key to be configured in the system settings.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-[#333] mb-2">Example Questions</h4>
                <ul className="text-sm text-[#666] space-y-2">
                  <li>• "Show me all quotes from last month"</li>
                  <li>• "Which customers have pending approvals?"</li>
                  <li>• "What are the top 5 products by revenue?"</li>
                  <li>• "Show me quotes with margin below 20%"</li>
                  <li>• "Analyze the top quoted parts for customer ABC Corp"</li>
                  <li>• "Create a CSV template for importing line items"</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded border border-[#d4d4d4]">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Key Features</h3>
            <div className="space-y-4">
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">Conversation History</h4>
                <p className="text-sm text-[#666] mb-2">
                  All conversations are saved automatically. Create new conversations or switch between existing ones
                  using the sidebar. You can rename or delete conversations as needed.
                </p>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">File Attachments</h4>
                <p className="text-sm text-[#666] mb-2">
                  Upload files (images, PDFs, CSVs, etc.) to provide context to the AI. Click the paperclip icon
                  to attach files to your message.
                </p>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">Download Results</h4>
                <p className="text-sm text-[#666] mb-2">
                  When the AI generates data tables, you can download the results as CSV or JSON files.
                  If the AI creates templates (like CSV import templates), download buttons will appear automatically.
                </p>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">SQL Query Inspection</h4>
                <p className="text-sm text-[#666] mb-2">
                  View the SQL queries the AI generates by clicking "View SQL Query" below assistant responses.
                  This helps you understand how the data is being retrieved.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#fcf8e3] text-[#8a6d3b] border border-[#faebcc] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#8a6d3b] mb-3">Tips for Best Results</h3>
            <ul className="text-sm text-[#8a6d3b] space-y-2">
              <li>• Be specific with your questions and include relevant details</li>
              <li>• Reference specific date ranges, customers, or products when needed</li>
              <li>• Ask follow-up questions to refine results</li>
              <li>• Use the conversation history to build on previous queries</li>
              <li>• Download data for further analysis in Excel or other tools</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'tasks-manager',
      title: 'Tasks & Task Manager',
      icon: ListTodo,
      description: 'Learn how to create and manage tasks for quotes and line items',
      content: (
        <div className="space-y-6">
          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Task Management System</h3>
            <p className="text-[#31708f] mb-4">
              The task management system helps you track action items, follow-ups, and to-dos for quotes and line items.
              Tasks can be assigned to users with due dates and priorities.
            </p>
          </div>

          <div className="bg-white p-6 rounded border border-[#d4d4d4]">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Creating Tasks</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#333] mb-2">From Quote Builder</h4>
                <p className="text-sm text-[#666] mb-2">
                  In the Quote Builder, click the "Tasks" button in the header to open the task manager.
                  Tasks are automatically linked to the current quote.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-[#333] mb-2">Task Fields</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• <strong>Title:</strong> Brief description of the task</li>
                  <li>• <strong>Description:</strong> Detailed information about what needs to be done</li>
                  <li>• <strong>Assigned To:</strong> Select a user to be responsible for the task</li>
                  <li>• <strong>Due Date:</strong> Set a deadline for task completion</li>
                  <li>• <strong>Priority:</strong> Choose from Low, Medium, High, or Urgent</li>
                  <li>• <strong>Line Item:</strong> Optionally link the task to a specific line item</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded border border-[#d4d4d4]">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Managing Tasks</h3>
            <div className="space-y-4">
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">Task Status</h4>
                <p className="text-sm text-[#666] mb-2">Tasks have three states:</p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• <strong>Pending:</strong> Task is not yet started</li>
                  <li>• <strong>In Progress:</strong> Task is actively being worked on</li>
                  <li>• <strong>Completed:</strong> Task is finished</li>
                </ul>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">Filtering Tasks</h4>
                <p className="text-sm text-[#666] mb-2">
                  Use the filter dropdown to view:
                </p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• All tasks</li>
                  <li>• Only pending tasks</li>
                  <li>• Only completed tasks</li>
                  <li>• Tasks assigned to you</li>
                </ul>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">Task Actions</h4>
                <p className="text-sm text-[#666] mb-2">
                  Click on a task to view details, edit, or mark as complete. Use the trash icon to delete tasks
                  that are no longer needed.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#3c763d] mb-3">Task Best Practices</h3>
            <ul className="text-sm text-[#3c763d] space-y-2">
              <li>• Create tasks for follow-ups on pending quotes</li>
              <li>• Assign tasks to appropriate team members</li>
              <li>• Set realistic due dates to ensure timely completion</li>
              <li>• Use High/Urgent priority for time-sensitive items</li>
              <li>• Link tasks to specific line items when applicable</li>
              <li>• Update task status regularly to track progress</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'messages-notifications',
      title: 'Messages & Notifications',
      icon: Bell,
      description: 'Learn about the messaging and notification system',
      content: (
        <div className="space-y-6">
          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Communication System</h3>
            <p className="text-[#31708f] mb-4">
              QuoteMaster Pro includes a built-in messaging and notification system to facilitate communication
              between team members about quotes, line items, and approvals.
            </p>
          </div>

          <div className="bg-white p-6 rounded border border-[#d4d4d4]">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Messages</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#333] mb-2">Sending Messages</h4>
                <p className="text-sm text-[#666] mb-2">
                  In the Quote Builder, click the "Messages" button to open the message panel. Messages can be
                  associated with:
                </p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• The entire quote</li>
                  <li>• Specific line items</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-[#333] mb-2">Message Features</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Real-time message display</li>
                  <li>• Automatic user attribution</li>
                  <li>• Timestamp tracking</li>
                  <li>• Context-aware messaging (quote or line item level)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-[#333] mb-2">Viewing Messages</h4>
                <p className="text-sm text-[#666] mb-2">
                  Messages appear in chronological order with the newest at the bottom. The message panel
                  shows all messages for the current context (quote or selected line item).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded border border-[#d4d4d4]">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Notifications</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#333] mb-2">Notification Bell</h4>
                <p className="text-sm text-[#666] mb-2">
                  The bell icon in the top navigation shows your unread notification count. Click it to view
                  recent notifications.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-[#333] mb-2">Notification Types</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Quote approval requests</li>
                  <li>• Approval actions (approved/rejected)</li>
                  <li>• Price request updates</li>
                  <li>• Task assignments</li>
                  <li>• System alerts</li>
                </ul>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">Managing Notifications</h4>
                <p className="text-sm text-[#666] mb-2">
                  Click "View All Notifications" to open the full notification page where you can:
                </p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Mark individual notifications as read</li>
                  <li>• Mark all notifications as read</li>
                  <li>• Filter by notification type</li>
                  <li>• View notification history</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#fcf8e3] text-[#8a6d3b] border border-[#faebcc] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#8a6d3b] mb-3">Communication Tips</h3>
            <ul className="text-sm text-[#8a6d3b] space-y-2">
              <li>• Use messages to document important decisions</li>
              <li>• Tag line items in messages for specific part discussions</li>
              <li>• Check notifications regularly to stay updated</li>
              <li>• Mark notifications as read to keep your inbox clean</li>
              <li>• Use messages instead of email for quote-related communication</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'master-data-config',
      title: 'Master Data & Configuration',
      icon: Cog,
      description: 'Learn about system setup and master data management',
      content: (
        <div className="space-y-6">
          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">System Setup & Master Data</h3>
            <p className="text-[#31708f] mb-4">
              Before using QuoteMaster Pro effectively, it's essential to set up master data and configure
              system settings. This section covers all configuration screens and data management tools.
            </p>
          </div>

          <div className="bg-white p-6 rounded border border-[#d4d4d4]">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Customer Management</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#333] mb-2 flex items-center space-x-2">
                  <Users className="h-4 w-4 text-[#428bca]" />
                  <span>Customer Records</span>
                </h4>
                <p className="text-sm text-[#666] mb-2">
                  Access via Management → Customer Management. Create and maintain customer master records including:
                </p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• <strong>Basic Information:</strong> Customer number, name, account status</li>
                  <li>• <strong>Sales Data:</strong> Payment terms, credit limit, sales representative</li>
                  <li>• <strong>Primary Warehouse:</strong> Default warehouse for orders</li>
                  <li>• <strong>Customer Notes:</strong> Internal notes about the customer</li>
                  <li>• <strong>ERP Integration:</strong> Customer ID and account ID</li>
                </ul>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2 flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-[#5cb85c]" />
                  <span>Customer Addresses</span>
                </h4>
                <p className="text-sm text-[#666] mb-2">
                  Each customer can have multiple addresses for shipping and billing:
                </p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Address type (Ship-To or Bill-To)</li>
                  <li>• Complete address details</li>
                  <li>• Warehouse assignment for ship-to addresses</li>
                  <li>• Primary address designation</li>
                  <li>• ERP location and site IDs</li>
                </ul>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2 flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-[#f0ad4e]" />
                  <span>Customer Contacts</span>
                </h4>
                <p className="text-sm text-[#666] mb-2">
                  Manage contact persons for each customer:
                </p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• First and last name</li>
                  <li>• Title and role</li>
                  <li>• Email and phone number</li>
                  <li>• Primary contact designation</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded border border-[#d4d4d4]">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Product Management</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#333] mb-2 flex items-center space-x-2">
                  <Package className="h-4 w-4 text-[#428bca]" />
                  <span>Product Master</span>
                </h4>
                <p className="text-sm text-[#666] mb-2">
                  Access via Management → Product Management. Maintain product master data:
                </p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• <strong>SKU:</strong> Unique product identifier (internal part number)</li>
                  <li>• <strong>Product Name:</strong> Description</li>
                  <li>• <strong>Supplier Name:</strong> Primary supplier</li>
                  <li>• <strong>Supplier Email:</strong> For price requests</li>
                  <li>• <strong>Category:</strong> Product classification</li>
                  <li>• <strong>Pricing:</strong> Unit cost, unit price</li>
                  <li>• <strong>Stock:</strong> Quantity on hand</li>
                  <li>• <strong>Lead Time:</strong> Estimated delivery time</li>
                  <li>• <strong>Status:</strong> Active or inactive</li>
                  <li>• <strong>ERP IDs:</strong> Inventory item ID for integration</li>
                </ul>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">Bulk Import</h4>
                <p className="text-sm text-[#666] mb-2">
                  Use Management → Product Import to bulk import products via CSV. Download the template
                  to see required fields and format.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded border border-[#d4d4d4]">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Cross Reference Management</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#333] mb-2 flex items-center space-x-2">
                  <GitBranch className="h-4 w-4 text-[#428bca]" />
                  <span>Part Number Cross References</span>
                </h4>
                <p className="text-sm text-[#666] mb-2">
                  Access via Management → Cross Reference Management. Map customer part numbers to internal SKUs:
                </p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• <strong>Customer:</strong> Which customer uses this part number</li>
                  <li>• <strong>Customer Part Number:</strong> Customer's identifier</li>
                  <li>• <strong>Internal SKU:</strong> Your product SKU</li>
                  <li>• <strong>Description:</strong> Optional notes</li>
                  <li>• <strong>ERP IDs:</strong> Ordered item ID for integration</li>
                </ul>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">Usage</h4>
                <p className="text-sm text-[#666] mb-2">
                  When creating quotes, use the cross-reference lookup to quickly find products using
                  customer part numbers. This is essential for customers who reference their own numbering system.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded border border-[#d4d4d4]">
            <h3 className="text-lg font-semibold text-[#333] mb-4">Item Relationships</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#333] mb-2">Supersession Management</h4>
                <p className="text-sm text-[#666] mb-2">
                  Access via Management → Item Relationships. Define product supersessions and relationships:
                </p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• <strong>Original SKU:</strong> The old or superseded product</li>
                  <li>• <strong>Replacement SKU:</strong> The new or superseding product</li>
                  <li>• <strong>Relationship Type:</strong> Superseded by, replaces, equivalent to</li>
                  <li>• <strong>Effective Date:</strong> When the relationship became active</li>
                  <li>• <strong>Notes:</strong> Additional information about the relationship</li>
                </ul>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">Usage in Quotes</h4>
                <p className="text-sm text-[#666] mb-2">
                  When a product is superseded, the system will suggest the replacement when adding line items.
                  This ensures quotes use current product numbers.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded border border-[#d4d4d4]">
            <h3 className="text-lg font-semibold text-[#333] mb-4">User Management & Roles</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#333] mb-2 flex items-center space-x-2">
                  <Users className="h-4 w-4 text-[#428bca]" />
                  <span>User Accounts</span>
                </h4>
                <p className="text-sm text-[#666] mb-2">
                  Access via Management → User Management. Create and manage user accounts:
                </p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Email address (used for login)</li>
                  <li>• Full name</li>
                  <li>• Phone number</li>
                  <li>• User role assignment</li>
                  <li>• Account status (active/inactive)</li>
                </ul>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2 flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-[#5cb85c]" />
                  <span>Role Management</span>
                </h4>
                <p className="text-sm text-[#666] mb-2">
                  Access via Management → Role Management. Configure roles and permissions:
                </p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• <strong>Sales Rep:</strong> Basic quote creation and management</li>
                  <li>• <strong>Sales Manager:</strong> Approval authority and team oversight</li>
                  <li>• <strong>Admin:</strong> Full system access including configuration</li>
                  <li>• <strong>Purchasing:</strong> Price request and inventory management</li>
                  <li>• <strong>Custom Roles:</strong> Define custom permission sets</li>
                </ul>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">Approval Limits</h4>
                <p className="text-sm text-[#666] mb-2">
                  Set role-based approval limits in Settings → Approval Limits:
                </p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Minimum approval amount (0 = no approval needed below this)</li>
                  <li>• Maximum approval amount (above this, needs higher authority)</li>
                  <li>• Minimum margin percentage required</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded border border-[#d4d4d4]">
            <h3 className="text-lg font-semibold text-[#333] mb-4">System Configuration</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#333] mb-2 flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-[#428bca]" />
                  <span>Configuration Settings</span>
                </h4>
                <p className="text-sm text-[#666] mb-2">
                  Access via Settings. Configure system-wide settings and integrations:
                </p>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">ERP Integration</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• <strong>Base URL:</strong> Your ERP system URL</li>
                  <li>• <strong>API Username:</strong> API user credentials</li>
                  <li>• <strong>API Password:</strong> API authentication</li>
                  <li>• <strong>Organization ID:</strong> Your organization ID</li>
                  <li>• <strong>Warehouse ID:</strong> Primary warehouse identifier</li>
                  <li>• Test connection to verify settings</li>
                </ul>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">Import APIs</h4>
                <p className="text-sm text-[#666] mb-2">
                  Configure external API endpoints for bulk data import:
                </p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• <strong>Product Import API:</strong> Bulk product updates from ERP</li>
                  <li>• <strong>Customer Import API:</strong> Customer master data sync</li>
                  <li>• <strong>Cross Reference Import API:</strong> Part number mapping sync</li>
                  <li>• Authentication (Basic Auth or API Key)</li>
                  <li>• Test each API endpoint configuration</li>
                </ul>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">Quote Export API</h4>
                <p className="text-sm text-[#666] mb-2">
                  Configure where approved quotes should be exported:
                </p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• API endpoint URL for quote submission</li>
                  <li>• Authentication credentials</li>
                  <li>• Automatic export on approval (optional)</li>
                </ul>
              </div>
              <div className="bg-[#f5f5f5] p-4 rounded">
                <h4 className="font-medium text-[#333] mb-2">AI Agent Configuration</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• <strong>Claude API Key:</strong> Required for AI assistant functionality</li>
                  <li>• Obtain from Anthropic's console</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#3c763d] mb-3">Setup Checklist</h3>
            <p className="text-sm text-[#3c763d] mb-3">
              Complete these steps to prepare the system for use:
            </p>
            <ol className="text-sm text-[#3c763d] space-y-2 list-decimal list-inside">
              <li>Configure ERP integration settings and test connection</li>
              <li>Import or create customer master data with addresses and contacts</li>
              <li>Import or create product catalog with pricing and lead times</li>
              <li>Set up cross-references for customers who use their own part numbers</li>
              <li>Define item relationships for superseded parts</li>
              <li>Create user accounts and assign appropriate roles</li>
              <li>Configure approval limits for each role</li>
              <li>Set up import/export API endpoints if using automated data sync</li>
              <li>Configure Claude API key if using AI assistant</li>
              <li>Train users on the system using this guide</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'advanced-features',
      title: 'Advanced Features',
      icon: Info,
      description: 'Learn about advanced functionality and best practices',
      content: (
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#333] mb-3">Advanced Quote Builder Features</h3>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Bulk Operations</h4>
                <p className="text-sm text-[#666] mb-3">
                  Select multiple line items using checkboxes to perform bulk actions:
                </p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Price requests for multiple items</li>
                  <li>• Lead time requests</li>
                  <li>• New item requests</li>
                  <li>• Inventory reservations</li>
                  <li>• Status updates (Won/Lost)</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Inventory Management</h4>
                <p className="text-sm text-[#666] mb-3">
                  Advanced inventory features help manage stock and availability:
                </p>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Real-time stock level checking</li>
                  <li>• Automatic inventory reservations</li>
                  <li>• Reserve quantity validation</li>
                  <li>• Next available date calculation</li>
                  <li>• Lead time tracking</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#31708f] mb-3">Cost Analysis & Margin Calculator</h3>
            <p className="text-[#31708f] mb-4">
              The margin calculator provides sophisticated pricing analysis tools.
            </p>
            <div className="bg-white p-4 rounded border border-[#d4d4d4]">
              <h4 className="font-medium text-[#333] mb-2">Calculator Features</h4>
              <ul className="text-sm text-[#666] space-y-1">
                <li>• Base price reference for list price comparison</li>
                <li>• Overhead rate adjustment (0-50%)</li>
                <li>• Target margin setting</li>
                <li>• Cost breakdown analysis</li>
                <li>• Suggested pricing recommendations</li>
                <li>• Profitability analysis</li>
              </ul>
            </div>
          </div>

          <div className="bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6] p-6 rounded">
            <h3 className="text-lg font-semibold text-[#3c763d] mb-3">Best Practices</h3>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Quote Creation</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Always select customer and user before adding line items</li>
                  <li>• Set appropriate validity dates based on product lead times</li>
                  <li>• Use cross-references when customers provide their part numbers</li>
                  <li>• Review margins before finalizing quotes</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Inventory Management</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Reserve inventory for high-priority quotes</li>
                  <li>• Monitor stock levels for popular items</li>
                  <li>• Use lead time information for delivery planning</li>
                  <li>• Update reserve quantities as needed</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border border-[#d4d4d4]">
                <h4 className="font-medium text-[#333] mb-2">Customer Relations</h4>
                <ul className="text-sm text-[#666] space-y-1">
                  <li>• Generate professional PDFs for customer delivery</li>
                  <li>• Track quote status and follow up appropriately</li>
                  <li>• Use customer analytics to improve win rates</li>
                  <li>• Maintain accurate cross-reference data</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#f0f0f0] pb-6">
      <div className="bg-white sticky top-0 z-10 border-b border-[#d4d4d4] px-6 py-4 mb-6">
        <div className="flex items-center space-x-2 text-sm mb-3">
          <span className="text-[#999]">Training</span>
          <ChevronRight className="h-4 w-4 text-[#999]" />
          <span className="text-[#333]">Training Guide</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#333]">Training Guide</h2>
            <p className="text-[#666] mt-1">Comprehensive guide to using QuoteMaster Pro effectively</p>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-[#428bca]" />
            <span className="text-sm text-[#666]">Interactive Learning</span>
          </div>
        </div>
      </div>

      <div className="px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded border border-[#d4d4d4] p-4">
              <h3 className="font-medium text-[#333] mb-4">Training Sections</h3>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  const isExpanded = expandedSections.includes(section.id);
                  
                  return (
                    <div key={section.id}>
                      <button
                        onClick={() => {
                          setActiveSection(section.id);
                          toggleSection(section.id);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded text-left transition-colors ${
                          isActive
                            ? 'bg-[#428bca] text-white'
                            : 'text-[#666] hover:text-[#333] hover:bg-[#f5f5f5]'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#999]'}`} />
                          <span className="font-medium text-sm">{section.title}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 ml-7">
                          <p className="text-xs text-[#666]">{section.description}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded border border-[#d4d4d4] p-6">
              {sections.find(s => s.id === activeSection)?.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};