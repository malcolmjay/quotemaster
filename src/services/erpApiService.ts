/**
 * ERP API Integration Service
 * Handles communication with external ERP system for inventory data
 */

import { logger } from '../utils/logger';

export interface ERPInventoryItem {
  sku: string;
  warehouseCode: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  lastRestockDate?: string;
  leadTimeDays?: number;
  cost?: number;
  location?: string;
}

export interface ERPApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface ERPApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * ERP API Service
 * Provides methods to fetch inventory data from external ERP system
 */
export class ERPApiService {
  private config: ERPApiConfig;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(config: ERPApiConfig) {
    this.config = {
      timeout: 10000, // 10 second default timeout
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
    this.cache = new Map();

    logger.info('ERP API Service initialized', {
      baseUrl: config.baseUrl,
      hasApiKey: !!config.apiKey
    });
  }

  /**
   * Generic API request method with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ERPApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      logger.debug('Making ERP API request', { endpoint, retryCount });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Add API key if configured
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        // Or use custom header if your ERP requires it
        // headers['X-API-Key'] = this.config.apiKey;
      }

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      logger.debug('ERP API request successful', { endpoint });

      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('ERP API request failed', error, { endpoint, retryCount });

      // Retry logic
      if (retryCount < (this.config.retryAttempts || 3)) {
        const delay = (this.config.retryDelay || 1000) * Math.pow(2, retryCount);
        logger.info(`Retrying ERP API request in ${delay}ms`, { endpoint, retryCount });

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest<T>(endpoint, options, retryCount + 1);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get from cache if available and not expired
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    logger.debug('Cache hit', { key });
    return cached.data as T;
  }

  /**
   * Save to cache
   */
  private saveToCache(key: string, data: any, ttl = this.DEFAULT_CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    logger.debug('Cached data', { key, ttl });
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  /**
   * Fetch inventory for a single SKU
   */
  async getInventoryBySKU(
    sku: string,
    warehouseCode?: string,
    useCache = true
  ): Promise<ERPApiResponse<ERPInventoryItem>> {
    const cacheKey = `inventory:${sku}:${warehouseCode || 'all'}`;

    // Check cache first
    if (useCache) {
      const cached = this.getFromCache<ERPInventoryItem>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          timestamp: new Date().toISOString()
        };
      }
    }

    logger.operation('getInventoryBySKU', 'start', { sku, warehouseCode });

    // Build query parameters
    const params = new URLSearchParams({ sku });
    if (warehouseCode) {
      params.append('warehouse', warehouseCode);
    }

    const response = await this.makeRequest<ERPInventoryItem>(
      `/inventory?${params.toString()}`
    );

    // Cache successful responses
    if (response.success && response.data) {
      this.saveToCache(cacheKey, response.data);
    }

    logger.operation('getInventoryBySKU', response.success ? 'success' : 'error', {
      sku,
      available: response.data?.quantityAvailable
    });

    return response;
  }

  /**
   * Fetch inventory for multiple SKUs (batch request)
   */
  async getInventoryBatch(
    skus: string[],
    warehouseCode?: string,
    useCache = true
  ): Promise<ERPApiResponse<ERPInventoryItem[]>> {
    const cacheKey = `inventory:batch:${skus.join(',')}:${warehouseCode || 'all'}`;

    // Check cache first
    if (useCache) {
      const cached = this.getFromCache<ERPInventoryItem[]>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          timestamp: new Date().toISOString()
        };
      }
    }

    logger.operation('getInventoryBatch', 'start', { count: skus.length, warehouseCode });

    // Some ERPs support batch requests, adjust endpoint as needed
    const response = await this.makeRequest<ERPInventoryItem[]>(
      '/inventory/batch',
      {
        method: 'POST',
        body: JSON.stringify({
          skus,
          warehouse: warehouseCode
        })
      }
    );

    // Cache successful responses
    if (response.success && response.data) {
      this.saveToCache(cacheKey, response.data, 2 * 60 * 1000); // 2 minutes for batch
    }

    logger.operation('getInventoryBatch', response.success ? 'success' : 'error', {
      requested: skus.length,
      received: response.data?.length || 0
    });

    return response;
  }

  /**
   * Fetch inventory for all items in a warehouse
   */
  async getWarehouseInventory(
    warehouseCode: string,
    useCache = true
  ): Promise<ERPApiResponse<ERPInventoryItem[]>> {
    const cacheKey = `inventory:warehouse:${warehouseCode}`;

    if (useCache) {
      const cached = this.getFromCache<ERPInventoryItem[]>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          timestamp: new Date().toISOString()
        };
      }
    }

    logger.operation('getWarehouseInventory', 'start', { warehouseCode });

    const response = await this.makeRequest<ERPInventoryItem[]>(
      `/inventory/warehouse/${warehouseCode}`
    );

    if (response.success && response.data) {
      this.saveToCache(cacheKey, response.data, 10 * 60 * 1000); // 10 minutes for warehouse
    }

    logger.operation('getWarehouseInventory', response.success ? 'success' : 'error', {
      warehouseCode,
      itemCount: response.data?.length || 0
    });

    return response;
  }

  /**
   * Reserve inventory (optional - if your ERP supports it)
   */
  async reserveInventory(
    sku: string,
    quantity: number,
    warehouseCode?: string,
    referenceId?: string
  ): Promise<ERPApiResponse<{ reservationId: string; expiresAt: string }>> {
    logger.operation('reserveInventory', 'start', { sku, quantity, warehouseCode });

    const response = await this.makeRequest<{ reservationId: string; expiresAt: string }>(
      '/inventory/reserve',
      {
        method: 'POST',
        body: JSON.stringify({
          sku,
          quantity,
          warehouse: warehouseCode,
          reference: referenceId
        })
      }
    );

    // Clear cache for this SKU since inventory changed
    if (response.success) {
      const cacheKey = `inventory:${sku}:${warehouseCode || 'all'}`;
      this.cache.delete(cacheKey);
    }

    logger.operation('reserveInventory', response.success ? 'success' : 'error', {
      sku,
      reservationId: response.data?.reservationId
    });

    return response;
  }

  /**
   * Release inventory reservation
   */
  async releaseReservation(reservationId: string): Promise<ERPApiResponse<void>> {
    logger.operation('releaseReservation', 'start', { reservationId });

    const response = await this.makeRequest<void>(
      `/inventory/reserve/${reservationId}`,
      { method: 'DELETE' }
    );

    logger.operation('releaseReservation', response.success ? 'success' : 'error', {
      reservationId
    });

    return response;
  }

  /**
   * Health check for ERP API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ status: string }>('/health');
      return response.success && response.data?.status === 'ok';
    } catch (error) {
      logger.error('ERP API health check failed', error);
      return false;
    }
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

/**
 * Factory function to create ERP API service instance
 * Prioritizes database config over environment variables
 */
export async function createERPApiService(): Promise<ERPApiService> {
  // Try to get config from database first
  try {
    const { configService } = await import('./configService');
    const dbConfig = await configService.getERPApiConfig();

    if (dbConfig.enabled && dbConfig.apiUrl) {
      logger.info('Using ERP API config from database');

      return new ERPApiService({
        baseUrl: dbConfig.apiUrl,
        apiKey: dbConfig.apiKey,
        timeout: dbConfig.timeout,
        retryAttempts: dbConfig.retryAttempts
      });
    }
  } catch (error) {
    logger.warn('Failed to load config from database, using environment variables', { error });
  }

  // Fallback to environment variables
  const config: ERPApiConfig = {
    baseUrl: import.meta.env.VITE_ERP_API_URL || '',
    apiKey: import.meta.env.VITE_ERP_API_KEY,
    timeout: parseInt(import.meta.env.VITE_ERP_API_TIMEOUT || '10000'),
    retryAttempts: parseInt(import.meta.env.VITE_ERP_API_RETRY_ATTEMPTS || '3')
  };

  if (!config.baseUrl) {
    logger.warn('ERP API URL not configured, using mock service');
    // Return a mock service for development
    return new ERPApiService({ baseUrl: 'http://localhost:3000/api' });
  }

  logger.info('Using ERP API config from environment variables');
  return new ERPApiService(config);
}

// Singleton instance
let erpApiServiceInstance: ERPApiService | null = null;

export function getERPApiService(): ERPApiService {
  if (!erpApiServiceInstance) {
    // Create synchronously for first call, will use env vars
    const config: ERPApiConfig = {
      baseUrl: import.meta.env.VITE_ERP_API_URL || 'http://localhost:3000/api',
      apiKey: import.meta.env.VITE_ERP_API_KEY,
      timeout: parseInt(import.meta.env.VITE_ERP_API_TIMEOUT || '10000'),
      retryAttempts: parseInt(import.meta.env.VITE_ERP_API_RETRY_ATTEMPTS || '3')
    };
    erpApiServiceInstance = new ERPApiService(config);
  }
  return erpApiServiceInstance;
}

/**
 * Reinitialize ERP service with new configuration
 * Call this after updating configuration in database
 */
export async function reinitializeERPService(): Promise<void> {
  logger.info('Reinitializing ERP API service');
  erpApiServiceInstance = await createERPApiService();
}
