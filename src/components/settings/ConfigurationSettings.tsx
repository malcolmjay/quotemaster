/**
 * Configuration Settings Page
 * Allows admins to configure ERP API and other system settings via UI
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  TestTube,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  AlertCircle,
  History,
  Database,
  Shield
} from 'lucide-react';
import { configService, AppConfiguration, ERPApiConfig } from '../../services/configService';
import { reinitializeERPService } from '../../services/erpApiService';
import { logger } from '../../utils/logger';
import { useAuth } from '../../hooks/useAuth';
import { ApprovalLimitsSettings } from './ApprovalLimitsSettings';

type TabType = 'api' | 'approval-limits';

export const ConfigurationSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('api');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    responseTime?: number;
  } | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [showAuditLog, setShowAuditLog] = useState(false);

  // ERP API Configuration
  const [erpConfig, setErpConfig] = useState<ERPApiConfig>({
    apiUrl: '',
    apiKey: '',
    timeout: 10000,
    retryAttempts: 3,
    cacheTtl: 300000,
    enabled: false,
    defaultWarehouse: 'WH01'
  });

  // Import API Configuration
  const [importApiConfig, setImportApiConfig] = useState({
    enabled: false,
    username: '',
    password: '',
    rateLimit: 100
  });

  // Cross Reference Import API Configuration
  const [crossRefImportApiConfig, setCrossRefImportApiConfig] = useState({
    enabled: false,
    username: '',
    password: '',
    rateLimit: 100
  });

  // Customer Import API Configuration
  const [customerImportApiConfig, setCustomerImportApiConfig] = useState({
    enabled: false,
    username: '',
    password: '',
    rateLimit: 100
  });

  // Quote Export REST API Configuration
  const [quoteExportApiConfig, setQuoteExportApiConfig] = useState({
    enabled: false,
    url: '',
    username: '',
    password: '',
    timeout: 30000
  });

  const [originalConfig, setOriginalConfig] = useState<ERPApiConfig>(erpConfig);
  const [originalImportConfig, setOriginalImportConfig] = useState(importApiConfig);
  const [originalCrossRefImportConfig, setOriginalCrossRefImportConfig] = useState(crossRefImportApiConfig);
  const [originalCustomerImportConfig, setOriginalCustomerImportConfig] = useState(customerImportApiConfig);
  const [originalQuoteExportApiConfig, setOriginalQuoteExportApiConfig] = useState(quoteExportApiConfig);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      logger.operation('loadConfiguration', 'start');

      const config = await configService.getERPApiConfig();
      setErpConfig(config);
      setOriginalConfig(config);

      // Load Import API config
      const importConfigs = await configService.getConfigsByType('import_api');
      console.log('Loaded import API configs:', importConfigs);
      const importConfigMap = new Map(importConfigs.map(c => [c.config_key, c.config_value]));

      const importApi = {
        enabled: importConfigMap.get('import_api_enabled') === 'true',
        username: importConfigMap.get('import_api_username') || '',
        password: importConfigMap.get('import_api_password') || '',
        rateLimit: parseInt(importConfigMap.get('import_api_rate_limit') || '100')
      };

      console.log('Parsed import API config:', importApi);
      setImportApiConfig(importApi);
      setOriginalImportConfig(importApi);

      // Load Cross Reference Import API config
      const crossRefImportConfigs = await configService.getConfigsByType('cross_ref_import_api');
      console.log('Loaded cross ref import API configs:', crossRefImportConfigs);
      const crossRefImportConfigMap = new Map(crossRefImportConfigs.map(c => [c.config_key, c.config_value]));

      const crossRefImportApi = {
        enabled: crossRefImportConfigMap.get('cross_ref_import_api_enabled') === 'true',
        username: crossRefImportConfigMap.get('cross_ref_import_api_username') || '',
        password: crossRefImportConfigMap.get('cross_ref_import_api_password') || '',
        rateLimit: parseInt(crossRefImportConfigMap.get('cross_ref_import_api_rate_limit') || '100')
      };

      console.log('Parsed cross ref import API config:', crossRefImportApi);
      setCrossRefImportApiConfig(crossRefImportApi);
      setOriginalCrossRefImportConfig(crossRefImportApi);

      // Load Customer Import API config
      const customerImportConfigs = await configService.getConfigsByType('customer_import_api');
      console.log('Loaded customer import API configs:', customerImportConfigs);
      const customerImportConfigMap = new Map(customerImportConfigs.map(c => [c.config_key, c.config_value]));

      const customerImportApi = {
        enabled: customerImportConfigMap.get('customer_import_api_enabled') === 'true',
        username: customerImportConfigMap.get('customer_import_api_username') || '',
        password: customerImportConfigMap.get('customer_import_api_password') || '',
        rateLimit: parseInt(customerImportConfigMap.get('customer_import_api_rate_limit') || '100')
      };

      console.log('Parsed customer import API config:', customerImportApi);
      setCustomerImportApiConfig(customerImportApi);
      setOriginalCustomerImportConfig(customerImportApi);

      // Load Quote Export API config
      const quoteExportConfigs = await configService.getConfigsByType('quote_export_api');
      console.log('Loaded quote export API configs:', quoteExportConfigs);
      const quoteExportConfigMap = new Map(quoteExportConfigs.map(c => [c.config_key, c.config_value]));

      const quoteExportApi = {
        enabled: quoteExportConfigMap.get('quote_export_api_enabled') === 'true',
        url: quoteExportConfigMap.get('quote_export_api_url') || '',
        username: quoteExportConfigMap.get('quote_export_api_username') || '',
        password: quoteExportConfigMap.get('quote_export_api_password') || '',
        timeout: parseInt(quoteExportConfigMap.get('quote_export_api_timeout') || '30000')
      };

      console.log('Parsed quote export API config:', quoteExportApi);
      setQuoteExportApiConfig(quoteExportApi);
      setOriginalQuoteExportApiConfig(quoteExportApi);

      logger.operation('loadConfiguration', 'success');
    } catch (error) {
      logger.error('Failed to load configuration', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLog = async () => {
    try {
      const log = await configService.getAuditLog(50);
      setAuditLog(log);
      setShowAuditLog(true);
    } catch (error) {
      logger.error('Failed to load audit log', error);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!user) {
      setSaveMessage('You must be logged in to save configuration');
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      logger.operation('saveConfiguration', 'start');

      const updates = [
        { config_key: 'erp_api_url', config_value: erpConfig.apiUrl },
        { config_key: 'erp_api_key', config_value: erpConfig.apiKey },
        { config_key: 'erp_api_timeout', config_value: erpConfig.timeout.toString() },
        { config_key: 'erp_api_retry_attempts', config_value: erpConfig.retryAttempts.toString() },
        { config_key: 'erp_api_cache_ttl', config_value: erpConfig.cacheTtl.toString() },
        { config_key: 'erp_api_enabled', config_value: erpConfig.enabled.toString() },
        { config_key: 'default_warehouse', config_value: erpConfig.defaultWarehouse },
        { config_key: 'import_api_enabled', config_value: importApiConfig.enabled.toString() },
        { config_key: 'import_api_username', config_value: importApiConfig.username },
        { config_key: 'import_api_password', config_value: importApiConfig.password },
        { config_key: 'import_api_rate_limit', config_value: importApiConfig.rateLimit.toString() },
        { config_key: 'cross_ref_import_api_enabled', config_value: crossRefImportApiConfig.enabled.toString() },
        { config_key: 'cross_ref_import_api_username', config_value: crossRefImportApiConfig.username },
        { config_key: 'cross_ref_import_api_password', config_value: crossRefImportApiConfig.password },
        { config_key: 'cross_ref_import_api_rate_limit', config_value: crossRefImportApiConfig.rateLimit.toString() },
        { config_key: 'customer_import_api_enabled', config_value: customerImportApiConfig.enabled.toString() },
        { config_key: 'customer_import_api_username', config_value: customerImportApiConfig.username },
        { config_key: 'customer_import_api_password', config_value: customerImportApiConfig.password },
        { config_key: 'customer_import_api_rate_limit', config_value: customerImportApiConfig.rateLimit.toString() },
        { config_key: 'quote_export_api_enabled', config_value: quoteExportApiConfig.enabled.toString() },
        { config_key: 'quote_export_api_url', config_value: quoteExportApiConfig.url },
        { config_key: 'quote_export_api_username', config_value: quoteExportApiConfig.username },
        { config_key: 'quote_export_api_password', config_value: quoteExportApiConfig.password },
        { config_key: 'quote_export_api_timeout', config_value: quoteExportApiConfig.timeout.toString() }
      ];

      const result = await configService.updateConfigs(updates, user.id);

      if (result.success) {
        setSaveMessage('Configuration saved successfully');
        setOriginalConfig({ ...erpConfig });
        setOriginalImportConfig({ ...importApiConfig });
        setOriginalCrossRefImportConfig({ ...crossRefImportApiConfig });
        setOriginalCustomerImportConfig({ ...customerImportApiConfig });
        setOriginalQuoteExportApiConfig({ ...quoteExportApiConfig });

        // Reinitialize ERP service with new config
        await reinitializeERPService();

        logger.operation('saveConfiguration', 'success');
      } else {
        setSaveMessage(`Failed to save: ${result.errors.join(', ')}`);
        logger.error('Save configuration failed', undefined, { errors: result.errors });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSaveMessage(`Error: ${errorMessage}`);
      logger.error('Error saving configuration', error);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      logger.operation('testERPConnection', 'start');

      const result = await configService.testERPConnection(
        erpConfig.apiUrl,
        erpConfig.apiKey,
        erpConfig.timeout
      );

      setTestResult(result);
      logger.operation('testERPConnection', result.success ? 'success' : 'error', {
        responseTime: result.responseTime
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Test failed';
      setTestResult({
        success: false,
        message: errorMessage
      });
      logger.error('Error testing connection', error);
    } finally {
      setTesting(false);
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      setErpConfig({
        apiUrl: '',
        apiKey: '',
        timeout: 10000,
        retryAttempts: 3,
        cacheTtl: 300000,
        enabled: false,
        defaultWarehouse: 'WH01'
      });
      setImportApiConfig({
        enabled: false,
        username: '',
        password: '',
        rateLimit: 100
      });
      setTestResult(null);
    }
  };

  const hasUnsavedChanges =
    JSON.stringify(erpConfig) !== JSON.stringify(originalConfig) ||
    JSON.stringify(importApiConfig) !== JSON.stringify(originalImportConfig) ||
    JSON.stringify(crossRefImportApiConfig) !== JSON.stringify(originalCrossRefImportConfig) ||
    JSON.stringify(customerImportApiConfig) !== JSON.stringify(originalCustomerImportConfig) ||
    JSON.stringify(quoteExportApiConfig) !== JSON.stringify(originalQuoteExportApiConfig);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-[#428bca]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Oro-style Header */}
      <div className="bg-white border-b border-[#d4d4d4] sticky top-0 z-40">
        <div className="px-5 py-3">
          {/* Breadcrumb */}
          <div className="text-xs text-[#999] mb-2">
            System / Configuration
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-[#428bca]" />
              <div>
                <h1 className="text-xl font-normal text-[#333]">
                  System Configuration
                </h1>
                <p className="text-xs text-[#666] mt-1">
                  Configure ERP API and other system settings
                </p>
              </div>
            </div>

            <button
              onClick={loadAuditLog}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded border border-transparent hover:border-[#d4d4d4] transition"
            >
              <History className="h-4 w-4" />
              <span>View Audit Log</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 border-b border-[#d4d4d4]">
            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'api'
                  ? 'border-[#428bca] text-[#428bca]'
                  : 'border-transparent text-[#666] hover:text-[#333]'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>API Configuration</span>
            </button>
            <button
              onClick={() => setActiveTab('approval-limits')}
              className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'approval-limits'
                  ? 'border-[#428bca] text-[#428bca]'
                  : 'border-transparent text-[#666] hover:text-[#333]'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Approval Limits</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-5 space-y-4">

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded border ${
          saveMessage.includes('success')
            ? 'bg-[#dff0d8] text-[#3c763d] border-[#d6e9c6]'
            : 'bg-[#f2dede] text-[#a94442] border-[#ebccd1]'
        }`}>
          <div className="flex items-center space-x-2">
            {saveMessage.includes('success') ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span>{saveMessage}</span>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'api' && (
        <>
          {/* Unsaved Changes Warning */}
          {hasUnsavedChanges && (
            <div className="bg-[#fcf8e3] text-[#8a6d3b] border border-[#faebcc] rounded p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">You have unsaved changes</span>
              </div>
            </div>
          )}

          {/* ERP API Configuration */}
      <div className="bg-white rounded border border-[#d4d4d4] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-[#333]">
            ERP API Configuration
          </h2>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={erpConfig.enabled}
              onChange={(e) => setErpConfig({ ...erpConfig, enabled: e.target.checked })}
              className="rounded border-[#d4d4d4] text-[#428bca] focus:ring-[#428bca]"
            />
            <span className="text-sm text-[#333]">
              Enable ERP Integration
            </span>
          </label>
        </div>

        <div className="space-y-4">
          {/* API URL */}
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">
              API Base URL *
            </label>
            <input
              type="url"
              value={erpConfig.apiUrl}
              onChange={(e) => setErpConfig({ ...erpConfig, apiUrl: e.target.value })}
              placeholder="https://your-erp-api.com/api"
              className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
              disabled={!erpConfig.enabled}
            />
            <p className="text-xs text-[#666] mt-1">
              The base URL for your ERP REST API (e.g., https://erp.example.com/api)
            </p>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">
              API Key *
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={erpConfig.apiKey}
                onChange={(e) => setErpConfig({ ...erpConfig, apiKey: e.target.value })}
                placeholder="Enter your ERP API key"
                className="w-full px-3 py-2 pr-10 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
                disabled={!erpConfig.enabled}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666] hover:text-[#333]"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-[#666] mt-1">
              API key for authentication (stored securely in database)
            </p>
          </div>

          {/* Grid for numeric settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Timeout */}
            <div>
              <label className="block text-sm font-medium text-[#333] mb-2">
                Request Timeout (ms)
              </label>
              <input
                type="number"
                value={erpConfig.timeout}
                onChange={(e) => setErpConfig({ ...erpConfig, timeout: parseInt(e.target.value) || 10000 })}
                min="1000"
                max="60000"
                step="1000"
                className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
                disabled={!erpConfig.enabled}
              />
            </div>

            {/* Retry Attempts */}
            <div>
              <label className="block text-sm font-medium text-[#333] mb-2">
                Retry Attempts
              </label>
              <input
                type="number"
                value={erpConfig.retryAttempts}
                onChange={(e) => setErpConfig({ ...erpConfig, retryAttempts: parseInt(e.target.value) || 3 })}
                min="0"
                max="10"
                className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
                disabled={!erpConfig.enabled}
              />
            </div>

            {/* Cache TTL */}
            <div>
              <label className="block text-sm font-medium text-[#333] mb-2">
                Cache TTL (ms)
              </label>
              <input
                type="number"
                value={erpConfig.cacheTtl}
                onChange={(e) => setErpConfig({ ...erpConfig, cacheTtl: parseInt(e.target.value) || 300000 })}
                min="60000"
                max="3600000"
                step="60000"
                className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
                disabled={!erpConfig.enabled}
              />
              <p className="text-xs text-[#666] mt-1">
                {(erpConfig.cacheTtl / 60000).toFixed(0)} minutes
              </p>
            </div>

            {/* Default Warehouse */}
            <div>
              <label className="block text-sm font-medium text-[#333] mb-2">
                Default Warehouse
              </label>
              <input
                type="text"
                value={erpConfig.defaultWarehouse}
                onChange={(e) => setErpConfig({ ...erpConfig, defaultWarehouse: e.target.value })}
                placeholder="WH01"
                className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
                disabled={!erpConfig.enabled}
              />
            </div>
          </div>

          {/* Test Connection */}
          <div className="pt-4 border-t border-[#d4d4d4]">
            <button
              onClick={handleTestConnection}
              disabled={testing || !erpConfig.enabled || !erpConfig.apiUrl}
              className="flex items-center space-x-2 px-4 py-2 bg-[#428bca] text-white rounded hover:bg-[#3276b1] disabled:bg-[#d4d4d4] disabled:cursor-not-allowed transition"
            >
              {testing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              <span>{testing ? 'Testing...' : 'Test Connection'}</span>
            </button>

            {testResult && (
              <div className={`mt-3 p-3 rounded border ${
                testResult.success
                  ? 'bg-[#dff0d8] text-[#3c763d] border-[#d6e9c6]'
                  : 'bg-[#f2dede] text-[#a94442] border-[#ebccd1]'
              }`}>
                <div className="flex items-center space-x-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <div>
                    <p className="font-medium">{testResult.message}</p>
                    {testResult.responseTime && (
                      <p className="text-xs mt-1">Response time: {testResult.responseTime}ms</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import API Authentication */}
      <div className="bg-white rounded border border-[#d4d4d4] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-[#333]">
              Product Import API Authentication
            </h2>
            <p className="text-sm text-[#666] mt-1">
              {importApiConfig.enabled ? (
                <span className="text-[#3c763d]">
                  Authentication is enabled
                </span>
              ) : (
                <span className="text-[#666]">
                  Authentication is disabled
                </span>
              )}
              {importApiConfig.username && (
                <span className="ml-2">
                  • Username: <span className="font-medium">{importApiConfig.username}</span>
                </span>
              )}
            </p>
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={importApiConfig.enabled}
              onChange={(e) => setImportApiConfig({ ...importApiConfig, enabled: e.target.checked })}
              className="rounded border-[#d4d4d4] text-[#428bca] focus:ring-[#428bca]"
            />
            <span className="text-sm text-[#333]">
              Enable Authentication
            </span>
          </label>
        </div>

        <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] rounded p-4 mb-6">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Secure Your Import API</p>
              <p>Enable authentication to require username and password for external systems importing products via API.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">
              Username
            </label>
            <input
              type="text"
              value={importApiConfig.username}
              onChange={(e) => setImportApiConfig({ ...importApiConfig, username: e.target.value })}
              placeholder="api_user"
              className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
              disabled={!importApiConfig.enabled}
            />
            <p className="text-xs text-[#666] mt-1">
              Username for Basic Authentication
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">
              Password
              {importApiConfig.password && originalImportConfig.password && (
                <span className="ml-2 text-xs text-[#3c763d]">
                  (Configured)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={importApiConfig.password}
                onChange={(e) => setImportApiConfig({ ...importApiConfig, password: e.target.value })}
                placeholder={originalImportConfig.password ? '••••••••' : 'Enter a strong password'}
                className="w-full px-3 py-2 pr-10 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
                disabled={!importApiConfig.enabled}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666] hover:text-[#333]"
                disabled={!importApiConfig.enabled}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-[#666] mt-1">
              Password for Basic Authentication (stored securely)
            </p>
          </div>

          {/* Rate Limit */}
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">
              Rate Limit (requests/hour)
            </label>
            <input
              type="number"
              value={importApiConfig.rateLimit}
              onChange={(e) => setImportApiConfig({ ...importApiConfig, rateLimit: parseInt(e.target.value) || 100 })}
              min="1"
              max="10000"
              className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
              disabled={!importApiConfig.enabled}
            />
            <p className="text-xs text-[#666] mt-1">
              Maximum API requests allowed per hour
            </p>
          </div>

          {/* Usage Instructions */}
          {importApiConfig.enabled && importApiConfig.username && importApiConfig.password && (
            <div className="pt-4 border-t border-[#d4d4d4]">
              <p className="text-sm font-medium text-[#333] mb-2">
                API Usage Example:
              </p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-xs">
{`curl -X POST \\
  'YOUR_SUPABASE_URL/functions/v1/import-products' \\
  -u '${importApiConfig.username}:${importApiConfig.password}' \\
  -H 'Content-Type: application/json' \\
  -d '{"products": [...]}'`}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Cross Reference Import API Authentication */}
      <div className="bg-white rounded border border-[#d4d4d4] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-[#333]">
              Cross Reference Import API Authentication
            </h2>
            <p className="text-sm text-[#666] mt-1">
              {crossRefImportApiConfig.enabled ? (
                <span className="text-[#3c763d]">
                  Authentication is enabled
                </span>
              ) : (
                <span className="text-[#666]">
                  Authentication is disabled
                </span>
              )}
              {crossRefImportApiConfig.username && (
                <span className="ml-2">
                  • Username: <span className="font-medium">{crossRefImportApiConfig.username}</span>
                </span>
              )}
            </p>
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={crossRefImportApiConfig.enabled}
              onChange={(e) => setCrossRefImportApiConfig({ ...crossRefImportApiConfig, enabled: e.target.checked })}
              className="rounded border-[#d4d4d4] text-[#428bca] focus:ring-[#428bca]"
            />
            <span className="text-sm text-[#333]">
              Enable Authentication
            </span>
          </label>
        </div>

        <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] rounded p-4 mb-6">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Secure Your Cross Reference Import API</p>
              <p>Enable authentication to require username and password for external systems importing cross references via API.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">
              Username
            </label>
            <input
              type="text"
              value={crossRefImportApiConfig.username}
              onChange={(e) => setCrossRefImportApiConfig({ ...crossRefImportApiConfig, username: e.target.value })}
              placeholder="cross_ref_api_user"
              className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
              disabled={!crossRefImportApiConfig.enabled}
            />
            <p className="text-xs text-[#666] mt-1">
              Username for Basic Authentication
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">
              Password
              {crossRefImportApiConfig.password && originalCrossRefImportConfig.password && (
                <span className="ml-2 text-xs text-[#3c763d]">
                  (Configured)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={crossRefImportApiConfig.password}
                onChange={(e) => setCrossRefImportApiConfig({ ...crossRefImportApiConfig, password: e.target.value })}
                placeholder={originalCrossRefImportConfig.password ? '••••••••' : 'Enter a strong password'}
                className="w-full px-3 py-2 pr-10 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
                disabled={!crossRefImportApiConfig.enabled}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666] hover:text-[#333]"
                disabled={!crossRefImportApiConfig.enabled}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-[#666] mt-1">
              Password for Basic Authentication (stored securely)
            </p>
          </div>

          {/* Rate Limit */}
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">
              Rate Limit (requests/hour)
            </label>
            <input
              type="number"
              value={crossRefImportApiConfig.rateLimit}
              onChange={(e) => setCrossRefImportApiConfig({ ...crossRefImportApiConfig, rateLimit: parseInt(e.target.value) || 100 })}
              min="1"
              max="10000"
              className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
              disabled={!crossRefImportApiConfig.enabled}
            />
            <p className="text-xs text-[#666] mt-1">
              Maximum API requests allowed per hour
            </p>
          </div>

          {/* Usage Instructions */}
          {crossRefImportApiConfig.enabled && crossRefImportApiConfig.username && crossRefImportApiConfig.password && (
            <div className="pt-4 border-t border-[#d4d4d4]">
              <p className="text-sm font-medium text-[#333] mb-2">
                API Usage Example:
              </p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-xs">
{`curl -X POST \\
  'YOUR_SUPABASE_URL/functions/v1/import-cross-references' \\
  -u '${crossRefImportApiConfig.username}:${crossRefImportApiConfig.password}' \\
  -H 'Content-Type: application/json' \\
  -d '{"cross_references": [...]}'`}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Customer Import API Authentication */}
      <div className="bg-white rounded border border-[#d4d4d4] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-[#333]">
              Customer Import API Authentication
            </h2>
            <p className="text-sm text-[#666] mt-1">
              {customerImportApiConfig.enabled ? (
                <span className="text-[#3c763d]">
                  Authentication is enabled
                </span>
              ) : (
                <span className="text-[#666]">
                  Authentication is disabled
                </span>
              )}
              {customerImportApiConfig.username && (
                <span className="ml-2">
                  • Username: <span className="font-medium">{customerImportApiConfig.username}</span>
                </span>
              )}
            </p>
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={customerImportApiConfig.enabled}
              onChange={(e) => setCustomerImportApiConfig({ ...customerImportApiConfig, enabled: e.target.checked })}
              className="rounded border-[#d4d4d4] text-[#428bca] focus:ring-[#428bca]"
            />
            <span className="text-sm text-[#333]">
              Enable Authentication
            </span>
          </label>
        </div>

        <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] rounded p-4 mb-6">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Secure Your Customer Import API</p>
              <p>Enable authentication to require username and password for external systems importing customers, addresses, and contacts via API.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">
              Username
            </label>
            <input
              type="text"
              value={customerImportApiConfig.username}
              onChange={(e) => setCustomerImportApiConfig({ ...customerImportApiConfig, username: e.target.value })}
              placeholder="customer_api_user"
              className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
              disabled={!customerImportApiConfig.enabled}
            />
            <p className="text-xs text-[#666] mt-1">
              Username for Basic Authentication
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">
              Password
              {customerImportApiConfig.password && originalCustomerImportConfig.password && (
                <span className="ml-2 text-xs text-[#3c763d]">
                  (Configured)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={customerImportApiConfig.password}
                onChange={(e) => setCustomerImportApiConfig({ ...customerImportApiConfig, password: e.target.value })}
                placeholder={originalCustomerImportConfig.password ? '••••••••' : 'Enter a strong password'}
                className="w-full px-3 py-2 pr-10 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
                disabled={!customerImportApiConfig.enabled}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666] hover:text-[#333]"
                disabled={!customerImportApiConfig.enabled}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-[#666] mt-1">
              Password for Basic Authentication (stored securely)
            </p>
          </div>

          {/* Rate Limit */}
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">
              Rate Limit (requests/hour)
            </label>
            <input
              type="number"
              value={customerImportApiConfig.rateLimit}
              onChange={(e) => setCustomerImportApiConfig({ ...customerImportApiConfig, rateLimit: parseInt(e.target.value) || 100 })}
              min="1"
              max="10000"
              className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
              disabled={!customerImportApiConfig.enabled}
            />
            <p className="text-xs text-[#666] mt-1">
              Maximum API requests allowed per hour
            </p>
          </div>

          {/* Usage Instructions */}
          {customerImportApiConfig.enabled && customerImportApiConfig.username && customerImportApiConfig.password && (
            <div className="pt-4 border-t border-[#d4d4d4]">
              <p className="text-sm font-medium text-[#333] mb-2">
                API Usage Example:
              </p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-xs">
{`curl -X POST \\
  'YOUR_SUPABASE_URL/functions/v1/import-customers' \\
  -u '${customerImportApiConfig.username}:${customerImportApiConfig.password}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "customers": [{
      "customer_number": "CUST001",
      "name": "Example Corp",
      "type": "Commercial",
      "segment": "Government",
      "addresses": [{
        "address_line_1": "123 Main St",
        "city": "Washington",
        "postal_code": "20001",
        "country": "USA",
        "is_primary": true
      }],
      "contacts": [{
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "is_primary": true
      }]
    }]
  }'`}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Quote Export REST API Configuration */}
      <div className="bg-white rounded border border-[#d4d4d4] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-[#333]">
              Quote Export REST API
            </h2>
            <p className="text-sm text-[#666] mt-1">
              {quoteExportApiConfig.enabled ? (
                <span className="text-[#3c763d]">
                  Outbound integration is enabled
                </span>
              ) : (
                <span className="text-[#666]">
                  Outbound integration is disabled
                </span>
              )}
              {quoteExportApiConfig.url && (
                <span className="ml-2">
                  • Endpoint: <span className="font-medium">{quoteExportApiConfig.url}</span>
                </span>
              )}
            </p>
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={quoteExportApiConfig.enabled}
              onChange={(e) => setQuoteExportApiConfig({ ...quoteExportApiConfig, enabled: e.target.checked })}
              className="rounded border-[#d4d4d4] text-[#428bca] focus:ring-[#428bca]"
            />
            <span className="text-sm text-[#333]">
              Enable Integration
            </span>
          </label>
        </div>

        <div className="bg-[#d9edf7] text-[#31708f] border border-[#bce8f1] rounded p-4 mb-6">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Automatic Quote Export</p>
              <p>When enabled, approved quotes will be automatically sent to the configured REST endpoint. Quote updates after approval will also trigger an export.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* API URL */}
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">
              REST Endpoint URL *
            </label>
            <input
              type="url"
              value={quoteExportApiConfig.url}
              onChange={(e) => setQuoteExportApiConfig({ ...quoteExportApiConfig, url: e.target.value })}
              placeholder="https://your-erp.com/api/quotes/import"
              className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
              disabled={!quoteExportApiConfig.enabled}
            />
            <p className="text-xs text-[#666] mt-1">
              The REST endpoint where approved quote data will be sent
            </p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">
              Username
            </label>
            <input
              type="text"
              value={quoteExportApiConfig.username}
              onChange={(e) => setQuoteExportApiConfig({ ...quoteExportApiConfig, username: e.target.value })}
              placeholder="api_user"
              className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
              disabled={!quoteExportApiConfig.enabled}
            />
            <p className="text-xs text-[#666] mt-1">
              Username for Basic Authentication (leave empty if not required)
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">
              Password
              {quoteExportApiConfig.password && originalQuoteExportApiConfig.password && (
                <span className="ml-2 text-xs text-[#3c763d]">
                  (Configured)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={quoteExportApiConfig.password}
                onChange={(e) => setQuoteExportApiConfig({ ...quoteExportApiConfig, password: e.target.value })}
                placeholder={originalQuoteExportApiConfig.password ? '••••••••' : 'Enter password if required'}
                className="w-full px-3 py-2 pr-10 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
                disabled={!quoteExportApiConfig.enabled}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666] hover:text-[#333]"
                disabled={!quoteExportApiConfig.enabled}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-[#666] mt-1">
              Password for Basic Authentication (stored securely)
            </p>
          </div>

          {/* Timeout */}
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">
              Request Timeout (ms)
            </label>
            <input
              type="number"
              value={quoteExportApiConfig.timeout}
              onChange={(e) => setQuoteExportApiConfig({ ...quoteExportApiConfig, timeout: parseInt(e.target.value) || 30000 })}
              min="5000"
              max="120000"
              step="1000"
              className="w-full px-3 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333]"
              disabled={!quoteExportApiConfig.enabled}
            />
            <p className="text-xs text-[#666] mt-1">
              {(quoteExportApiConfig.timeout / 1000).toFixed(0)} seconds
            </p>
          </div>

          {/* Data Format Example */}
          {quoteExportApiConfig.enabled && quoteExportApiConfig.url && (
            <div className="pt-4 border-t border-[#d4d4d4]">
              <p className="text-sm font-medium text-[#333] mb-2">
                Quote Data Format (JSON):
              </p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-xs">
{`{
  "quoteNumber": "Q-2024-0001",
  "customerId": "CUST001",
  "customerName": "Example Corp",
  "quoteDate": "2024-01-15T10:30:00Z",
  "totalValue": 15000.00,
  "totalCost": 12000.00,
  "totalMargin": 20.00,
  "status": "approved",
  "lineItems": [
    {
      "sku": "PART-001",
      "productName": "Example Product",
      "quantity": 100,
      "unitPrice": 150.00,
      "unitCost": 120.00,
      "subtotal": 15000.00
    }
  ]
}`}
              </pre>
            </div>
          )}
        </div>
      </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-white rounded border border-[#d4d4d4] p-6">
            <button
              onClick={handleResetToDefaults}
              className="px-4 py-2 text-sm text-[#a94442] hover:bg-[#f2dede] rounded transition"
            >
              Reset to Defaults
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={loadConfiguration}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded border border-transparent hover:border-[#d4d4d4] transition"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Reload</span>
          </button>

          <button
            onClick={handleSaveConfiguration}
            disabled={saving || !hasUnsavedChanges}
            className="flex items-center space-x-2 px-6 py-2 bg-[#428bca] text-white rounded hover:bg-[#3276b1] disabled:bg-[#d4d4d4] disabled:cursor-not-allowed transition"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>
        </>
      )}

      {activeTab === 'approval-limits' && (
        <ApprovalLimitsSettings />
      )}

      {/* Audit Log Modal */}
      {showAuditLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-[#d4d4d4] shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-[#d4d4d4]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-[#333]">
                  Configuration Audit Log
                </h3>
                <button
                  onClick={() => setShowAuditLog(false)}
                  className="text-[#666] hover:text-[#333] text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {auditLog.length === 0 ? (
                <p className="text-center text-[#666] py-8">
                  No audit log entries found
                </p>
              ) : (
                <div className="space-y-3">
                  {auditLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 bg-[#f5f5f5] rounded border border-[#d4d4d4]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-[#333]">
                            {entry.config_key}
                          </p>
                          <p className="text-sm text-[#666] mt-1">
                            {entry.change_type === 'create' && 'Created'}
                            {entry.change_type === 'update' && (
                              <>
                                Changed from{' '}
                                <span className="font-mono text-xs bg-[#f2dede] text-[#a94442] px-1 rounded">
                                  {entry.old_value || '(empty)'}
                                </span>
                                {' to '}
                                <span className="font-mono text-xs bg-[#dff0d8] text-[#3c763d] px-1 rounded">
                                  {entry.new_value}
                                </span>
                              </>
                            )}
                            {entry.change_type === 'delete' && 'Deleted'}
                          </p>
                        </div>
                        <div className="text-right text-xs text-[#666]">
                          <p>{new Date(entry.changed_at).toLocaleString()}</p>
                          {entry.profiles && (
                            <p className="mt-1">{entry.profiles.full_name || entry.profiles.email}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
