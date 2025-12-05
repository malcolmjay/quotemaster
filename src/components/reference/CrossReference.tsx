import React, { useState } from 'react';
import { Search, Building, Truck, Hash, Download, Upload } from 'lucide-react';

export const CrossReference: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');

  const crossReferences = [
    {
      id: 1,
      customerPartNumber: 'DOD-SRV-001',
      customerName: 'Department of Defense - Pentagon',
      supplierPartNumber: 'DELL-R7525-001',
      supplierName: 'Dell Technologies',
      internalPartNumber: 'INT-SRV-R7525',
      description: 'Dell PowerEdge R7525 Server - 2U Rack Mount',
      lastUsed: '2025-01-15',
      frequency: 12
    },
    {
      id: 2,
      customerPartNumber: 'DOD-NET-048',
      customerName: 'Department of Defense - Pentagon',
      supplierPartNumber: 'CISCO-C9300-48P',
      supplierName: 'Cisco Systems',
      internalPartNumber: 'INT-NET-C9300',
      description: 'Cisco Catalyst 9300 48-Port Ethernet Switch',
      lastUsed: '2025-01-10',
      frequency: 8
    },
    {
      id: 3,
      customerPartNumber: 'NASA-SEC-100F',
      customerName: 'NASA - Johnson Space Center',
      supplierPartNumber: 'FORTINET-FG-100F',
      supplierName: 'Fortinet Inc.',
      internalPartNumber: 'INT-SEC-FG100F',
      description: 'Fortinet FortiGate 100F Next-Gen Firewall',
      lastUsed: '2024-12-20',
      frequency: 5
    },
    {
      id: 4,
      customerPartNumber: 'AF-SRV-ML110',
      customerName: 'US Air Force - Pentagon',
      supplierPartNumber: 'HPE-ML110-GEN10',
      supplierName: 'Hewlett Packard Enterprise',
      internalPartNumber: 'INT-SRV-ML110',
      description: 'HPE ProLiant ML110 Gen10 Tower Server',
      lastUsed: '2024-11-30',
      frequency: 3
    }
  ];

  const filteredReferences = crossReferences.filter(ref => {
    const searchLower = searchTerm.toLowerCase();
    if (searchType === 'customer') {
      return ref.customerPartNumber.toLowerCase().includes(searchLower) || 
             ref.customerName.toLowerCase().includes(searchLower);
    } else if (searchType === 'supplier') {
      return ref.supplierPartNumber.toLowerCase().includes(searchLower) || 
             ref.supplierName.toLowerCase().includes(searchLower);
    } else if (searchType === 'internal') {
      return ref.internalPartNumber.toLowerCase().includes(searchLower);
    }
    return ref.customerPartNumber.toLowerCase().includes(searchLower) ||
           ref.supplierPartNumber.toLowerCase().includes(searchLower) ||
           ref.internalPartNumber.toLowerCase().includes(searchLower) ||
           ref.description.toLowerCase().includes(searchLower) ||
           ref.customerName.toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cross Reference Database</h2>
            <p className="text-gray-600 mt-1">Search and manage part number cross-references across customers, suppliers, and internal systems</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by part numbers, descriptions, or company names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All References</option>
            <option value="customer">Customer Parts</option>
            <option value="supplier">Supplier Parts</option>
            <option value="internal">Internal Parts</option>
          </select>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          Showing {filteredReferences.length} of {crossReferences.length} cross references
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Building className="h-4 w-4" />
                    <span>Customer</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Truck className="h-4 w-4" />
                    <span>Supplier</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Hash className="h-4 w-4" />
                    <span>Internal</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReferences.map((ref) => (
                <tr key={ref.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{ref.customerPartNumber}</div>
                      <div className="text-sm text-gray-600">{ref.customerName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{ref.supplierPartNumber}</div>
                      <div className="text-sm text-blue-600">{ref.supplierName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                      {ref.internalPartNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{ref.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">Last Used: {ref.lastUsed}</div>
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {ref.frequency} times
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReferences.length === 0 && (
          <div className="p-8 text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cross references found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or search type filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};