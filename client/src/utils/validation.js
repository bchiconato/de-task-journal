/**
 * Validation utilities for form fields
 */

/**
 * Validate context field (required field)
 * @param {string} value - Field value
 * @returns {string|null} Error message or null if valid
 */
export function validateContext(value) {
  const trimmed = value?.trim() || '';

  if (trimmed.length === 0) {
    return 'Task context is required. Please describe what you are working on.';
  }

  if (trimmed.length < 10) {
    return 'Task context is too short. Please provide at least 10 characters.';
  }

  return null;
}

/**
 * Validate code field (optional, but has constraints if provided)
 * @param {string} value - Field value
 * @returns {string|null} Error message or null if valid
 */
export function validateCode(value) {
  if (!value || value.trim().length === 0) {
    return null;
  }

  return null;
}

/**
 * Validate challenges field (optional)
 * @param {string} _value - Field value (unused, field is always valid)
 * @returns {string|null} Error message or null if valid
 */
export function validateChallenges(_value) {
  return null;
}

/**
 * Validate entire form
 * @param {Object} formData - Form data object
 * @param {string} formData.context - Task context
 * @param {string} formData.code - Code implementation
 * @param {string} formData.challenges - Challenges/difficulties
 * @returns {Object} Errors object with field names as keys
 */
export function validateForm(formData) {
  const errors = {};

  const contextError = validateContext(formData.context);
  if (contextError) {
    errors.context = contextError;
  }

  const codeError = validateCode(formData.code);
  if (codeError) {
    errors.code = codeError;
  }

  const challengesError = validateChallenges(formData.challenges);
  if (challengesError) {
    errors.challenges = challengesError;
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
 * Get first error message from errors object
 * @param {Object} errors - Errors object
 * @returns {string|null} First error message or null
 */
export function getFirstError(errors) {
  const keys = Object.keys(errors);
  return keys.length > 0 ? errors[keys[0]] : null;
}

/**
 * Get count of errors
 * @param {Object} errors - Errors object
 * @returns {number} Number of errors
 */
export function getErrorCount(errors) {
  return Object.keys(errors).length;
}
