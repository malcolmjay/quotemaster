import { LOG_CONFIG } from '../config/constants';

/**
 * Sanitize sensitive data from logs
 */
const sanitizeData = (data: any): any => {
  if (!LOG_CONFIG.SANITIZE_SENSITIVE_DATA) {
    return data;
  }

  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (LOG_CONFIG.SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Application logger with sensitive data protection
 */
export const logger = {
  debug: (message: string, context?: any) => {
    if (LOG_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.log(`[DEBUG] ${message}`, sanitizeData(context));
    }
  },

  info: (message: string, context?: any) => {
    if (LOG_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.info(`[INFO] ${message}`, sanitizeData(context));
    }
  },

  warn: (message: string, context?: any) => {
    console.warn(`[WARN] ${message}`, sanitizeData(context));
  },

  error: (message: string, error?: any, context?: any) => {
    if (LOG_CONFIG.ENABLE_ERROR_LOGS) {
      console.error(`[ERROR] ${message}`, error, sanitizeData(context));
    }
  },

  operation: (operation: string, status: string, context?: any) => {
    if (LOG_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.log(`[OP] ${operation} - ${status}`, sanitizeData(context));
    }
  }
};
