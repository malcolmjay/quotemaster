/**
 * Configuration Service
 * Manages application configurations stored in Supabase
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface AppConfiguration {
  id: string;
  config_key: string;
  config_value: string;
  config_type: string;
  is_encrypted: boolean;
  description: string;
  last_updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ERPApiConfig {
  apiUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  cacheTtl: number;
  enabled: boolean;
  defaultWarehouse: string;
}

export interface ConfigurationUpdate {
  config_key: string;
  config_value: string;
}

class ConfigurationService {
  private cache: Map<string, { value: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute cache for config values

  /**
   * Get a single configuration value by key
   */
  async getConfig(key: string, useCache = true): Promise<string | null> {
    // Check cache first
    if (useCache) {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        logger.debug('Config cache hit', { key });
        return cached.value;
      }
    }

    try {
      const { data, error } = await supabase
        .from('app_configurations')
        .select('config_value')
        .eq('config_key', key)
        .maybeSingle();

      if (error) {
        logger.error('Failed to get config', error, { key });
        return null;
      }

      const value = data?.config_value || null;

      // Update cache
      if (value !== null) {
        this.cache.set(key, { value, timestamp: Date.now() });
      }

      return value;
    } catch (error) {
      logger.error('Error getting config', error, { key });
      return null;
    }
  }

  /**
   * Get all configurations
   */
  async getAllConfigs(): Promise<AppConfiguration[]> {
    try {
      const { data, error } = await supabase
        .from('app_configurations')
        .select('*')
        .order('config_type', { ascending: true })
        .order('config_key', { ascending: true });

      if (error) {
        logger.error('Failed to get all configs', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting all configs', error);
      return [];
    }
  }

  /**
   * Get configurations by type
   */
  async getConfigsByType(type: string): Promise<AppConfiguration[]> {
    try {
      const { data, error } = await supabase
        .from('app_configurations')
        .select('*')
        .eq('config_type', type)
        .order('config_key', { ascending: true });

      if (error) {
        logger.error('Failed to get configs by type', error, { type });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting configs by type', error, { type });
      return [];
    }
  }

  /**
   * Update a configuration value (uses UPSERT to handle missing rows)
   */
  async updateConfig(
    key: string,
    value: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.operation('updateConfig', 'start', { key, userId });

      const configType = key.startsWith('import_api_') ? 'import_api' :
                         key.startsWith('erp_api_') ? 'erp_api' :
                         'general';

      const { error } = await supabase
        .from('app_configurations')
        .upsert({
          config_key: key,
          config_value: value,
          config_type: configType,
          last_updated_by: userId,
          description: this.getConfigDescription(key),
          is_encrypted: key.includes('password') || key.includes('api_key')
        }, {
          onConflict: 'config_key'
        });

      if (error) {
        logger.error('Failed to update config', error, { key });
        return { success: false, error: error.message };
      }

      this.cache.delete(key);

      logger.operation('updateConfig', 'success', { key });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating config', error, { key });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get description for config key
   */
  private getConfigDescription(key: string): string {
    const descriptions: Record<string, string> = {
      'import_api_enabled': 'Enable/Disable authentication for import API',
      'import_api_username': 'Username for import API authentication',
      'import_api_password': 'Password for import API authentication',
      'import_api_rate_limit': 'Maximum requests per hour',
      'erp_api_url': 'ERP API base URL',
      'erp_api_key': 'ERP API authentication key',
      'erp_api_timeout': 'Request timeout in milliseconds',
      'erp_api_retry_attempts': 'Number of retry attempts for failed requests',
      'erp_api_cache_ttl': 'Cache time-to-live in minutes',
      'erp_api_enabled': 'Enable/Disable ERP API integration',
      'default_warehouse': 'Default warehouse location'
    };
    return descriptions[key] || 'Configuration value';
  }

  /**
   * Update multiple configurations at once
   */
  async updateConfigs(
    updates: ConfigurationUpdate[],
    userId: string
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    logger.operation('updateConfigs', 'start', { count: updates.length, userId });

    for (const update of updates) {
      const result = await this.updateConfig(update.config_key, update.config_value, userId);
      if (!result.success) {
        errors.push(`${update.config_key}: ${result.error}`);
      }
    }

    logger.operation('updateConfigs', errors.length === 0 ? 'success' : 'error', {
      total: updates.length,
      errors: errors.length
    });

    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * Get ERP API configuration
   */
  async getERPApiConfig(): Promise<ERPApiConfig> {
    try {
      const configs = await this.getConfigsByType('erp_api');

      const configMap = new Map(
        configs.map(c => [c.config_key, c.config_value])
      );

      return {
        apiUrl: configMap.get('erp_api_url') || '',
        apiKey: configMap.get('erp_api_key') || '',
        timeout: parseInt(configMap.get('erp_api_timeout') || '10000'),
        retryAttempts: parseInt(configMap.get('erp_api_retry_attempts') || '3'),
        cacheTtl: parseInt(configMap.get('erp_api_cache_ttl') || '300000'),
        enabled: configMap.get('erp_api_enabled') === 'true',
        defaultWarehouse: configMap.get('default_warehouse') || 'WH01'
      };
    } catch (error) {
      logger.error('Error getting ERP API config', error);
      // Return defaults
      return {
        apiUrl: '',
        apiKey: '',
        timeout: 10000,
        retryAttempts: 3,
        cacheTtl: 300000,
        enabled: false,
        defaultWarehouse: 'WH01'
      };
    }
  }

  /**
   * Test ERP API connection
   */
  async testERPConnection(
    apiUrl: string,
    apiKey: string,
    timeout: number = 10000
  ): Promise<{ success: boolean; message: string; responseTime?: number }> {
    logger.operation('testERPConnection', 'start', { apiUrl });

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        logger.error('ERP connection test failed', undefined, {
          status: response.status,
          statusText: response.statusText
        });

        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }

      logger.operation('testERPConnection', 'success', { responseTime });

      return {
        success: true,
        message: `Connected successfully (${responseTime}ms)`,
        responseTime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      logger.error('ERP connection test error', error);

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  /**
   * Get configuration audit log
   */
  async getAuditLog(limit = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('configuration_audit_log')
        .select(`
          *,
          profiles:changed_by (
            full_name,
            email
          )
        `)
        .order('changed_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to get audit log', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting audit log', error);
      return [];
    }
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Configuration cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
let configServiceInstance: ConfigurationService | null = null;

export function getConfigService(): ConfigurationService {
  if (!configServiceInstance) {
    configServiceInstance = new ConfigurationService();
  }
  return configServiceInstance;
}

export const configService = getConfigService();
