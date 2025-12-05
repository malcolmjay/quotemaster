import React, { useState } from 'react';
import { Upload, Download, X, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface PriceRequestUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface CSVRow {
  product_number: string;
  description: string;
  customer_name: string;
  quote_number: string;
  quote_type: string;
  item_quantity: string;
  supplier_name?: string;
  buyer_name?: string;
  supplier_pricing?: string;
  effective_start_date?: string;
  effective_end_date?: string;
  moq?: string;
  supplier_quote_number?: string;
  status?: string;
}

export const PriceRequestUpload: React.FC<PriceRequestUploadProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [results, setResults] = useState<{ inserted: number; updated: number; errors: string[] } | null>(null);
  const { user } = useAuth();

  const downloadTemplate = () => {
    const template = [
      'product_number,description,customer_name,quote_number,quote_type,item_quantity,supplier_name,buyer_name,supplier_pricing,effective_start_date,effective_end_date,moq,supplier_quote_number,status',
      'PART-001,Sample Product Description,ACME Corp,Q-2025-001,Standard,100,Supplier Inc,John Doe,25.50,2025-01-01,2025-12-31,50,SQ-12345,pending',
      'PART-002,Another Product,ACME Corp,Q-2025-001,Standard,200,,,,,,,,pending'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'price_requests_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must contain a header row and at least one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      rows.push(row as CSVRow);
    }

    return rows;
  };

  const validateRow = (row: CSVRow, rowIndex: number): string | null => {
    if (!row.product_number) return `Row ${rowIndex + 2}: product_number is required`;
    if (!row.description) return `Row ${rowIndex + 2}: description is required`;
    if (!row.customer_name) return `Row ${rowIndex + 2}: customer_name is required`;
    if (!row.quote_number) return `Row ${rowIndex + 2}: quote_number is required`;
    if (!row.quote_type) return `Row ${rowIndex + 2}: quote_type is required`;
    if (!row.item_quantity) return `Row ${rowIndex + 2}: item_quantity is required`;

    const quantity = parseFloat(row.item_quantity);
    if (isNaN(quantity) || quantity <= 0) {
      return `Row ${rowIndex + 2}: item_quantity must be a positive number`;
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setError(null);
    setSuccess(null);
    setResults(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      const errors: string[] = [];
      const validRows: any[] = [];

      rows.forEach((row, index) => {
        const validationError = validateRow(row, index);
        if (validationError) {
          errors.push(validationError);
        } else {
          const priceRequestData: any = {
            product_number: row.product_number,
            description: row.description,
            customer_name: row.customer_name,
            quote_number: row.quote_number,
            quote_type: row.quote_type,
            item_quantity: parseFloat(row.item_quantity),
            supplier_name: row.supplier_name || null,
            buyer_name: row.buyer_name || null,
            supplier_pricing: row.supplier_pricing ? parseFloat(row.supplier_pricing) : null,
            effective_start_date: row.effective_start_date || null,
            effective_end_date: row.effective_end_date || null,
            moq: row.moq ? parseFloat(row.moq) : null,
            supplier_quote_number: row.supplier_quote_number || null,
            status: row.status || 'pending',
            requested_by: user.id,
            requested_at: new Date().toISOString(),
          };

          validRows.push(priceRequestData);
        }
      });

      if (errors.length > 0) {
        setResults({ inserted: 0, updated: 0, errors });
        setError(`Found ${errors.length} validation error(s)`);
        setUploading(false);
        return;
      }

      let insertedCount = 0;
      let updatedCount = 0;

      for (const rowData of validRows) {
        const { data: existing, error: checkError } = await supabase
          .from('price_requests')
          .select('id')
          .eq('product_number', rowData.product_number)
          .eq('quote_number', rowData.quote_number)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existing) {
          const { error: updateError } = await supabase
            .from('price_requests')
            .update({
              ...rowData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (updateError) throw updateError;
          updatedCount++;
        } else {
          const { error: insertError } = await supabase
            .from('price_requests')
            .insert(rowData);

          if (insertError) throw insertError;
          insertedCount++;
        }
      }

      setResults({ inserted: insertedCount, updated: updatedCount, errors: [] });
      setSuccess(`Successfully processed ${insertedCount + updatedCount} price requests (${insertedCount} new, ${updatedCount} updated)`);

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Error uploading price requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload price requests');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Upload className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Upload Price Requests
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Upload Instructions
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Download the CSV template to see the required format</li>
              <li>Fill in all required fields: product_number, description, customer_name, quote_number, quote_type, item_quantity</li>
              <li>Optional fields: supplier_name, buyer_name, supplier_pricing, dates, moq, supplier_quote_number, status</li>
              <li>The upload will perform an upsert based on product_number + quote_number combination</li>
              <li>Existing records will be updated, new records will be inserted</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV Template</span>
            </button>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {file ? file.name : 'Choose a CSV file or drag it here'}
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                  {results && results.errors.length > 0 && (
                    <ul className="mt-2 text-sm text-red-700 dark:text-red-300 space-y-1">
                      {results.errors.slice(0, 10).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                      {results.errors.length > 10 && (
                        <li>... and {results.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">{success}</p>
                  {results && (
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {results.inserted} inserted, {results.updated} updated
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
