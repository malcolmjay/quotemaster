/**
 * Product Import Component
 * UI for importing products from ERP into the database
 */

import React, { useState, useEffect } from 'react';
import {
  Upload,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Trash2,
  Clock,
  Database
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImportLog {
  id: string;
  import_type: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  errors: string[] | null;
  import_source: string;
  started_at: string;
  completed_at: string | null;
  status: string;
}

export const ProductImport: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importMode, setImportMode] = useState<'upsert' | 'insert'>('upsert');
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    loadImportLogs();
  }, []);

  const loadImportLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('product_import_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setImportLogs(data || []);
    } catch (error) {
      console.error('Failed to load import logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleImportProducts = async () => {
    setImporting(true);
    setImportResult(null);

    try {
      // Parse JSON input
      let products;
      try {
        products = JSON.parse(jsonInput);
      } catch (error) {
        setImportResult({
          success: false,
          message: 'Invalid JSON format',
        });
        return;
      }

      // Ensure it's an array
      if (!Array.isArray(products)) {
        products = [products];
      }

      // Get Supabase URL and anon key
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Call Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/import-products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products,
          mode: importMode,
        }),
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        setJsonInput(''); // Clear input on success
        loadImportLogs(); // Reload logs
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Import failed',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
    };
    reader.readAsText(file);
  };

  const loadSampleData = () => {
    const sample = [
      {
        sku: 'SAMPLE-001',
        name: 'Sample Product 1',
        description: 'This is a sample product',
        category: 'Electronics',
        supplier: 'Sample Supplier Inc',
        unit_cost: 100.50,
        list_price: 150.00,
        lead_time_days: 14,
        lead_time_text: '2-3 weeks',
        warehouse: 'main',
        status: 'active'
      },
      {
        sku: 'SAMPLE-002',
        name: 'Sample Product 2',
        description: 'Another sample product',
        category: 'Office Supplies',
        supplier: 'Office Depot',
        unit_cost: 25.00,
        list_price: 35.00,
        lead_time_days: 7,
        warehouse: 'main',
        status: 'active'
      }
    ];

    setJsonInput(JSON.stringify(sample, null, 2));
  };

  const downloadTemplate = () => {
    const template = {
      sku: 'REQUIRED - Unique stock keeping unit',
      name: 'REQUIRED - Product name',
      description: 'OPTIONAL - Full product description',
      category: 'REQUIRED - Product category',
      supplier: 'REQUIRED - Supplier name',
      unit_cost: 'REQUIRED - Unit cost (number, default: 0)',
      list_price: 'REQUIRED - List price (number, default: 0)',
      lead_time_days: 'OPTIONAL - Lead time in days (number, default: 0)',
      lead_time_text: 'OPTIONAL - Lead time description',
      warehouse: 'OPTIONAL - Warehouse code (default: main)',
      status: 'OPTIONAL - active, inactive, or discontinued (default: active)'
    };

    const blob = new Blob([JSON.stringify([template], null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-import-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Product Import
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Import product data from your ERP system
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <Download className="h-4 w-4" />
              <span>Download Template</span>
            </button>

            <button
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <Clock className="h-4 w-4" />
              <span>Import History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div
          className={`p-4 rounded-lg ${
            importResult.success
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
          }`}
        >
          <div className="flex items-start space-x-2">
            {importResult.success ? (
              <CheckCircle className="h-5 w-5 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium">{importResult.message}</p>
              {importResult.imported !== undefined && (
                <p className="text-sm mt-1">
                  Imported: {importResult.imported}, Failed: {importResult.failed || 0}
                </p>
              )}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {importResult.errors.map((error: string, index: number) => (
                    <p key={index} className="text-xs">
                      • {error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Import Products
        </h2>

        {/* Mode Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Import Mode
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="upsert"
                checked={importMode === 'upsert'}
                onChange={(e) => setImportMode(e.target.value as 'upsert')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Upsert (Update if exists, insert if not)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="insert"
                checked={importMode === 'insert'}
                onChange={(e) => setImportMode(e.target.value as 'insert')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Insert Only (Skip duplicates)
              </span>
            </label>
          </div>
        </div>

        {/* File Upload or JSON Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload JSON File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-900 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700"
            />
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">OR</div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Paste JSON Data
              </label>
              <button
                onClick={loadSampleData}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Load Sample Data
              </button>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste your JSON array here..."
              rows={15}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Format: JSON array of product objects. Required fields: sku, name, category, supplier
            </p>
          </div>
        </div>

        {/* Import Button */}
        <div className="mt-6">
          <button
            onClick={handleImportProducts}
            disabled={importing || !jsonInput.trim()}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {importing ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>Import Products</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Import History */}
      {showLogs && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Import History
            </h2>
            <button
              onClick={loadImportLogs}
              disabled={loadingLogs}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <RefreshCw className={`h-4 w-4 ${loadingLogs ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {importLogs.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No import history found
            </p>
          ) : (
            <div className="space-y-3">
              {importLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {log.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : log.status === 'failed' ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : log.status === 'completed_with_errors' ? (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {log.import_type.charAt(0).toUpperCase() + log.import_type.slice(1)} Import
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(log.started_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Total:</span>{' '}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {log.total_records}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Success:</span>{' '}
                          <span className="font-medium text-green-600">
                            {log.successful_records}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Failed:</span>{' '}
                          <span className="font-medium text-red-600">
                            {log.failed_records}
                          </span>
                        </div>
                      </div>

                      {log.errors && log.errors.length > 0 && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs">
                          <p className="font-medium text-red-800 dark:text-red-300 mb-1">
                            Errors:
                          </p>
                          {log.errors.slice(0, 3).map((error, index) => (
                            <p key={index} className="text-red-700 dark:text-red-400">
                              • {error}
                            </p>
                          ))}
                          {log.errors.length > 3 && (
                            <p className="text-red-600 dark:text-red-400 mt-1">
                              ... and {log.errors.length - 3} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
