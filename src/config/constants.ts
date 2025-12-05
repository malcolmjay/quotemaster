/**
 * Application Configuration Constants
 * Centralized location for all magic numbers and configuration values
 */

import { UserRole } from '../types';

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  BATCH_TTL: 2 * 60 * 1000, // 2 minutes
  WAREHOUSE_TTL: 10 * 60 * 1000, // 10 minutes
  MAX_SIZE: 100, // Maximum cache entries
} as const;

// API Configuration
export const API_CONFIG = {
  DEFAULT_TIMEOUT: 10000, // 10 seconds
  DEFAULT_RETRY_ATTEMPTS: 3,
  DEFAULT_RETRY_DELAY: 1000, // 1 second
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 10,
} as const;

// Approval Thresholds
export const APPROVAL_THRESHOLDS: Record<UserRole, { min: number; max: number; approvers: number }> = {
  CSR: { min: 0, max: 25000, approvers: 1 },
  Manager: { min: 25000, max: 50000, approvers: 1 },
  Director: { min: 50000, max: 200000, approvers: 1 },
  VP: { min: 200000, max: 300000, approvers: 1 },
  President: { min: 300000, max: Infinity, approvers: 2 },
  Admin: { min: 0, max: Infinity, approvers: 0 }, // Can approve anything
} as const;

// Role Hierarchy (higher number = higher authority)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  CSR: 1,
  Manager: 2,
  Director: 3,
  VP: 4,
  President: 5,
  Admin: 6,
} as const;

// Password Validation
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: false,
} as const;

// Email Validation
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Search
export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  MAX_RESULTS: 10,
  DEBOUNCE_DELAY: 300, // ms
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_CSV_EXTENSIONS: ['.csv', '.txt'],
  ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif'],
} as const;

// Session & Auth
export const SESSION_CONFIG = {
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 hours
} as const;

// Logging Configuration
export const LOG_CONFIG = {
  ENABLE_CONSOLE_LOGS: import.meta.env.DEV,
  ENABLE_ERROR_LOGS: true,
  SANITIZE_SENSITIVE_DATA: !import.meta.env.DEV,
  SENSITIVE_FIELDS: ['password', 'unit_cost', 'unit_price', 'total_cost', 'api_key', 'token'],
} as const;

// Default Values
export const DEFAULTS = {
  CURRENCY: 'USD',
  WAREHOUSE: 'main',
  PRODUCT_CATEGORY: 'Uncategorized',
  SUPPLIER: 'Unknown',
  CUSTOMER_TYPE: 'Commercial',
  CUSTOMER_SEGMENT: 'General',
  QUOTE_TYPE: 'Daily Quote',
  SUPPLY_PERIOD_MONTHS: 12,
} as const;
