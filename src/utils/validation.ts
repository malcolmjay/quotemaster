/**
 * Input Validation Utilities
 */

import { EMAIL_REGEX, PASSWORD_REQUIREMENTS } from '../config/constants';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password || password.length === 0) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    return {
      isValid: false,
      error: `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`,
    };
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one lowercase letter',
    };
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one number',
    };
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one special character',
    };
  }

  return { isValid: true };
};

/**
 * Sanitize search term to prevent injection
 */
export const sanitizeSearchTerm = (term: string): string => {
  if (!term) return '';
  // Escape special characters used in LIKE patterns
  return term.replace(/[%_\\]/g, '\\$&').trim();
};

/**
 * Validate required string field
 */
export const validateRequired = (value: string | null | undefined, fieldName: string): ValidationResult => {
  if (!value || value.trim().length === 0) {
    return {
      isValid: false,
      error: `${fieldName} is required`,
    };
  }
  return { isValid: true };
};

/**
 * Validate numeric value
 */
export const validateNumber = (
  value: number | null | undefined,
  fieldName: string,
  options?: { min?: number; max?: number }
): ValidationResult => {
  if (value === null || value === undefined) {
    return {
      isValid: false,
      error: `${fieldName} is required`,
    };
  }

  if (isNaN(value)) {
    return {
      isValid: false,
      error: `${fieldName} must be a valid number`,
    };
  }

  if (options?.min !== undefined && value < options.min) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${options.min}`,
    };
  }

  if (options?.max !== undefined && value > options.max) {
    return {
      isValid: false,
      error: `${fieldName} must not exceed ${options.max}`,
    };
  }

  return { isValid: true };
};

/**
 * Validate date string
 */
export const validateDate = (dateString: string | null | undefined, fieldName: string): ValidationResult => {
  if (!dateString) {
    return {
      isValid: false,
      error: `${fieldName} is required`,
    };
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: `${fieldName} must be a valid date`,
    };
  }

  return { isValid: true };
};

/**
 * Batch validation helper
 */
export const validateAll = (
  validations: Array<() => ValidationResult>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (const validate of validations) {
    const result = validate();
    if (!result.isValid && result.error) {
      errors.push(result.error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
