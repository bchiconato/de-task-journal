/**
 * @fileoverview Validation utilities for documentation context field
 * @module utils/validation
 */

/**
 * Validate context field (required field for both modes)
 * @param {string} value - Field value
 * @returns {string|null} Error message or null if valid
 */
export function validateContext(value) {
  const trimmed = value?.trim() || '';

  if (trimmed.length === 0) {
    return 'Context is required. Please paste every relevant note.';
  }

  if (trimmed.length < 10) {
    return 'Context is too short. Provide at least 10 characters.';
  }

  if (trimmed.length > 30000) {
    return `Context is too long. Keep it under 30,000 characters. (current: ${trimmed.length})`;
  }

  return null;
}

/**
 * Validate entire form (single context field today)
 * @param {Object} formData - Form data object
 * @returns {Object} Errors object with field names as keys
 */
export function validateForm(formData) {
  const errors = {};

  const contextError = validateContext(formData.context);
  if (contextError) {
    errors.context = contextError;
  }

  return errors;
}

/**
 * Check if form has any errors
 * @param {Object} errors - Errors object
 * @returns {boolean} True if form has errors
 */
export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

/**
 * Returns the number of errors in the object
 * @param {Object} errors - Errors object
 * @returns {number} Number of fields with errors
 */
export function getErrorCount(errors) {
  return Object.keys(errors).length;
}
