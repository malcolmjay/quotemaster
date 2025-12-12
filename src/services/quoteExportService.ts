import { supabase } from '../lib/supabase';
import { configService } from './configService';
import { logger } from '../utils/logger';

export interface QuoteExportConfig {
  enabled: boolean;
  url: string;
  username: string;
  password: string;
  timeout: number;
}

export interface QuoteExportData {
  quoteNumber: string;
  quoteId: string;
  customerId: string;
  customerName: string;
  customerNumber: string;
  quoteDate: string;
  totalValue: number;
  totalCost: number;
  totalMargin: number;
  status: string;
  quoteType: string;
  validUntil: string | null;
  shipUntil: string | null;
  customerBidNumber: string | null;
  purchaseOrderNumber: string | null;
  lineItems: QuoteLineItemExport[];
}

export interface QuoteLineItemExport {
  sku: string;
  productName: string;
  supplier: string;
  category: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
  leadTime: string;
  quotedLeadTime: string;
  shippingInstructions: string;
  customerPartNumber: string;
  shipToAddress: string | null;
}

export interface QuoteExportResult {
  success: boolean;
  message: string;
  responseStatus?: number;
  responseBody?: any;
  error?: string;
}

class QuoteExportService {
  async getConfig(): Promise<QuoteExportConfig> {
    try {
      const configs = await configService.getConfigsByType('quote_export_api');
      const configMap = new Map(configs.map(c => [c.config_key, c.config_value]));

      return {
        enabled: configMap.get('quote_export_api_enabled') === 'true',
        url: configMap.get('quote_export_api_url') || '',
        username: configMap.get('quote_export_api_username') || '',
        password: configMap.get('quote_export_api_password') || '',
        timeout: parseInt(configMap.get('quote_export_api_timeout') || '30000')
      };
    } catch (error) {
      logger.error('Failed to load quote export config', error);
      return {
        enabled: false,
        url: '',
        username: '',
        password: '',
        timeout: 30000
      };
    }
  }

  async fetchQuoteData(quoteId: string): Promise<QuoteExportData | null> {
    try {
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          customers (
            id,
            name,
            customer_number
          )
        `)
        .eq('id', quoteId)
        .maybeSingle();

      if (quoteError || !quote) {
        logger.error('Failed to fetch quote for export', quoteError);
        return null;
      }

      const { data: lineItems, error: lineItemsError } = await supabase
        .from('quote_line_items')
        .select(`
          *,
          customer_addresses (
            address_line_1,
            address_line_2,
            city,
            state_province,
            postal_code,
            country
          )
        `)
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true });

      if (lineItemsError) {
        logger.error('Failed to fetch line items for export', lineItemsError);
        return null;
      }

      const exportData: QuoteExportData = {
        quoteNumber: quote.quote_number,
        quoteId: quote.id,
        customerId: quote.customers.id,
        customerName: quote.customers.name,
        customerNumber: quote.customers.customer_number,
        quoteDate: quote.created_at,
        totalValue: quote.total_value,
        totalCost: quote.total_cost,
        totalMargin: quote.total_margin,
        status: quote.quote_status,
        quoteType: quote.quote_type,
        validUntil: quote.valid_until,
        shipUntil: quote.ship_until,
        customerBidNumber: quote.customer_bid_number,
        purchaseOrderNumber: quote.purchase_order_number,
        lineItems: (lineItems || []).map(item => {
          let shipToAddress = null;
          if (item.customer_addresses) {
            const addr = item.customer_addresses;
            shipToAddress = [
              addr.address_line_1,
              addr.address_line_2,
              `${addr.city}, ${addr.state_province} ${addr.postal_code}`,
              addr.country
            ].filter(Boolean).join(', ');
          }

          return {
            sku: item.sku,
            productName: item.product_name,
            supplier: item.supplier,
            category: item.category || '',
            quantity: item.quantity,
            unitPrice: item.unit_price,
            unitCost: item.unit_cost,
            subtotal: item.subtotal,
            leadTime: item.lead_time || '',
            quotedLeadTime: item.quoted_lead_time || '',
            shippingInstructions: item.shipping_instructions || '',
            customerPartNumber: item.customer_part_number || '',
            shipToAddress
          };
        })
      };

      return exportData;
    } catch (error) {
      logger.error('Error preparing quote export data', error);
      return null;
    }
  }

  async exportQuote(quoteId: string): Promise<QuoteExportResult> {
    const startTime = Date.now();
    let config: QuoteExportConfig | null = null;
    let exportData: QuoteExportData | null = null;
    let responseStatus: number | undefined;
    let responseBody: any;
    let errorMessage: string | undefined;

    try {
      config = await this.getConfig();

      if (!config.enabled) {
        logger.info('Quote export is disabled, skipping export', { quoteId });
        return {
          success: true,
          message: 'Quote export is disabled'
        };
      }

      if (!config.url) {
        const error = 'Quote export URL is not configured';
        logger.error(error, undefined, { quoteId });
        return {
          success: false,
          message: error,
          error
        };
      }

      exportData = await this.fetchQuoteData(quoteId);

      if (!exportData) {
        const error = 'Failed to fetch quote data for export';
        logger.error(error, undefined, { quoteId });
        return {
          success: false,
          message: error,
          error
        };
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (config.username && config.password) {
        const credentials = btoa(`${config.username}:${config.password}`);
        headers['Authorization'] = `Basic ${credentials}`;
      }

      logger.info('Sending quote export', {
        quoteId,
        quoteNumber: exportData.quoteNumber,
        url: config.url
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      try {
        const response = await fetch(config.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(exportData),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        responseStatus = response.status;

        try {
          responseBody = await response.json();
        } catch {
          responseBody = await response.text();
        }

        if (!response.ok) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          logger.error('Quote export failed', undefined, {
            quoteId,
            status: response.status,
            body: responseBody
          });

          return {
            success: false,
            message: `Export failed: ${errorMessage}`,
            responseStatus,
            responseBody,
            error: errorMessage
          };
        }

        logger.info('Quote export successful', {
          quoteId,
          quoteNumber: exportData.quoteNumber,
          status: response.status,
          duration: Date.now() - startTime
        });

        return {
          success: true,
          message: 'Quote exported successfully',
          responseStatus,
          responseBody
        };
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          errorMessage = 'Request timeout';
        } else {
          errorMessage = fetchError.message || 'Network error';
        }

        logger.error('Quote export request failed', fetchError, { quoteId });

        return {
          success: false,
          message: `Export failed: ${errorMessage}`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      errorMessage = error.message || 'Unknown error';
      logger.error('Quote export error', error, { quoteId });

      return {
        success: false,
        message: `Export failed: ${errorMessage}`,
        error: errorMessage
      };
    } finally {
      const duration = Date.now() - startTime;

      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from('rest_logs')
        .insert({
          direction: 'outbound',
          method: 'POST',
          url: config?.url || '',
          endpoint: config?.url ? new URL(config.url).pathname : '',
          request_headers: config ? {
            'Content-Type': 'application/json',
            'Authorization': config.username ? 'Basic ***' : undefined
          } : {},
          request_payload: exportData,
          response_status: responseStatus,
          response_headers: {},
          response_body: responseBody,
          error_message: errorMessage,
          duration_ms: duration,
          user_id: user?.id,
          ip_address: null,
          user_agent: navigator.userAgent
        });
    }
  }
}

export const quoteExportService = new QuoteExportService();
