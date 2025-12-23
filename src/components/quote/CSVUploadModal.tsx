import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';

interface CSVUploadModalProps {
  onClose: () => void;
  onUpload: (items: any[], mode: 'add' | 'update') => void;
  mode?: 'add' | 'update';
  existingLineItems?: any[];
  selectedCustomer?: any;
}

export const CSVUploadModal: React.FC<CSVUploadModalProps> = ({
  onClose,
  onUpload,
  mode = 'add',
  existingLineItems = [],
  selectedCustomer
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setErrors(['Please select a CSV file']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(selectedFile);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      setErrors(['CSV file must contain at least a header row and one data row']);
      return;
    }

    // Parse CSV properly handling quoted values
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.trim().toLowerCase());

    // Different required fields based on mode
    const requiredHeaders = mode === 'update' ? ['sku'] : ['sku', 'qty'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h) && !headers.includes(h.replace('qty', 'quantity')));

    if (missingHeaders.length > 0) {
      setErrors([`Missing required columns: ${missingHeaders.join(', ')}`]);
      return;
    }

    const data: any[] = [];
    const parseErrors: string[] = [];
    const updatedCount = { matched: 0, notFound: 0 };

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Validate required fields
      if (!row.sku) {
        parseErrors.push(`Row ${i + 1}: SKU is required`);
        continue;
      }

      // Handle quantity field (can be 'qty' or 'quantity')
      const qtyValue = row.qty || row.quantity;
      const quantity = qtyValue ? parseInt(qtyValue) : (mode === 'update' ? undefined : 1);

      if (mode === 'add' && (isNaN(quantity!) || quantity! <= 0)) {
        parseErrors.push(`Row ${i + 1}: Quantity must be a positive number`);
        continue;
      }

      // For update mode, check if item exists
      if (mode === 'update') {
        const existingItem = existingLineItems.find(item =>
          item.id === row.id || item.sku === row.sku
        );
        if (!existingItem) {
          updatedCount.notFound++;
          parseErrors.push(`Row ${i + 1}: Line item with SKU "${row.sku}" not found in current quote`);
          continue;
        }
        updatedCount.matched++;
      }

      // Create line item object
      const lineItem: any = {
        id: mode === 'update' ? row.id : `${row.sku}-${Date.now()}-${i}`,
        sku: row.sku,
        name: row.name || `Product ${row.sku}`,
        supplier: row.supplier || 'Unknown Supplier',
        category: row.category || 'General',
        qty: quantity || 1,
        reserveQty: parseInt(row.reserveqty || '0'),
        price: parseFloat(row.price || '0'),
        cost: parseFloat(row.cost || '0'),
        subtotal: parseFloat(row.price || '0') * (quantity || 1),
        stock: parseInt(row.stock || '0'),
        available: row.available || new Date().toISOString().split('T')[0],
        status: row.status || 'Pending',
        leadTime: row.leadtime || row.leadTime || '10 days',
        quotedLeadTime: row.quotedleadtime || row.quotedLeadTime || '',
        warehouse: row.warehouse || selectedCustomer?.primary_warehouse || '',
        reserved: '0 / ' + (quantity || 1) + ' units',
        shippingInstructions: row.shippinginstructions || row.shippingInstructions || '',
        ship_to_address_id: row.ship_to_address_id || null,
        customerPartNumber: row.customerpartnumber || row.customerPartNumber || '',
        stockingRequired: row.stockingrequired === 'true' || false
      };

      data.push(lineItem);
    }

    if (parseErrors.length > 0 && mode === 'add') {
      setErrors(parseErrors);
      return;
    }

    if (mode === 'update' && updatedCount.matched === 0) {
      setErrors(['No matching line items found. Make sure the SKUs in your CSV match items in the current quote.']);
      return;
    }

    setParsedData(data);
    setStep('preview');
  };

  const handleUpload = () => {
    onUpload(parsedData, mode);
    setStep('complete');
  };

  const downloadTemplate = () => {
    const template = `sku,name,supplier,category,quantity,reserveqty,price,cost,stock,available,status,leadtime,quotedleadtime,warehouse,shippinginstructions,stockingrequired
CISCO-C9300-48P,Cisco Catalyst 9300 48-Port Switch,Cisco Systems,cat-networking,2,0,3500,3400,48,2025-01-25,Pending,10 days,,wh-main,,false
DELL-R7525-001,Dell PowerEdge R7525 Server,Dell Technologies,cat-servers,1,0,4500,4300,22,2025-01-29,Pending,14 days,,wh-main,,false`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'line_items_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {mode === 'update' ? 'Update Line Items via CSV' : 'CSV Upload'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {mode === 'update'
                ? 'Upload a CSV file to update existing line items in your quote'
                : 'Upload a CSV file to add multiple line items to your quote'}
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
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Upload CSV File</h4>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </button>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    Drop your CSV file here, or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-600">
                    Supports CSV files with line item data
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-900">Upload Errors</span>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">CSV Format Requirements</span>
                </div>
                <div className="text-sm text-blue-800 space-y-1">
                  {mode === 'update' ? (
                    <>
                      <p><strong>Required columns:</strong> sku (to match existing items)</p>
                      <p><strong>Updatable columns:</strong> name, supplier, category, qty, price, cost, status, leadTime, quotedLeadTime, shippingInstructions, ship_to_address_id, etc.</p>
                      <p><strong>Tip:</strong> Use "Export CSV" first to get the current data with all columns in the correct format, then modify and re-upload.</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Required columns:</strong> sku, quantity</p>
                      <p><strong>Optional columns:</strong> name, supplier, category, price, cost, stock, leadtime, etc.</p>
                      <p><strong>Example:</strong> sku,name,quantity,price</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">
                  {mode === 'update' ? 'Preview Updates' : 'Preview Import Data'}
                </h4>
                <div className="text-sm text-gray-600">
                  {parsedData.length} item{parsedData.length > 1 ? 's' : ''} ready to {mode === 'update' ? 'update' : 'import'}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900">
                    CSV parsed successfully! Review the data below before {mode === 'update' ? 'updating' : 'importing'}.
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parsedData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">{item.sku}</td>
                          <td className="px-4 py-2 text-gray-600">{item.name}</td>
                          <td className="px-4 py-2 text-blue-600">{item.supplier}</td>
                          <td className="px-4 py-2 text-center">{item.qty}</td>
                          <td className="px-4 py-2 text-right">${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {mode === 'update' ? 'Update Complete!' : 'Import Complete!'}
              </h3>
              <p className="text-gray-600 mb-6">
                {mode === 'update'
                  ? `Successfully updated ${parsedData.length} line item${parsedData.length > 1 ? 's' : ''} in your quote.`
                  : `Successfully imported ${parsedData.length} line item${parsedData.length > 1 ? 's' : ''} to your quote.`}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {step !== 'complete' && (
          <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {step === 'preview' && (
              <button
                onClick={handleUpload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {mode === 'update' ? 'Update' : 'Import'} {parsedData.length} Item{parsedData.length > 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};