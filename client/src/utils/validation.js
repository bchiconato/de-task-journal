/**
 * @fileoverview Validation utilities for form fields
 * @module utils/validation
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

  if (trimmed.length > 10000) {
    return `Task context is too long. Please keep it under 10,000 characters. (current: ${trimmed.length})`;
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

  if (value.trim().length > 10000) {
    return `Code implementation is too long. Please keep it under 10,000 characters. (current: ${value.trim().length})`;
  }

  return null;
}

/**
 * Validate challenges field (optional)
 * @param {string} _value - Field value (unused, field is always valid)
 * @returns {string|null} Error message or null if valid
 */
export function validateChallenges(value) {
  if (!value || value.trim().length === 0) {
    return null;
  }

  if (value.trim().length > 10000) {
    return `Challenges description is too long. Please keep it under 10,000 characters. (current: ${value.trim().length})`;
  }

  return null;
}

/**
 * Validate overview field (required for architecture mode)
 * @param {string} value - Field value
 * @returns {string|null} Error message or null if valid
 */
export function validateOverview(value) {
  const trimmed = value?.trim() || '';

  if (trimmed.length === 0) {
    return 'Overview & Components is required.';
  }

  if (trimmed.length < 150) {
    return `Overview is too short. Please provide at least 150 characters. (current: ${trimmed.length})`;
  }

  if (trimmed.length > 10000) {
    return `Overview is too long. Please keep it under 10,000 characters. (current: ${trimmed.length})`;
  }

  return null;
}

/**
 * Validate dataflow field (required for architecture mode)
 * @param {string} value - Field value
 * @returns {string|null} Error message or null if valid
 */
export function validateDataflow(value) {
  const trimmed = value?.trim() || '';

  if (trimmed.length === 0) {
    return 'Data Flow & Technology Stack is required.';
  }

  if (trimmed.length < 150) {
    return `Data Flow is too short. Please provide at least 150 characters. (current: ${trimmed.length})`;
  }

  if (trimmed.length > 10000) {
    return `Data Flow is too long. Please keep it under 10,000 characters. (current: ${trimmed.length})`;
  }

  return null;
}

/**
 * Validate decisions field (required for architecture mode)
 * @param {string} value - Field value
 * @returns {string|null} Error message or null if valid
 */
export function validateDecisions(value) {
  const trimmed = value?.trim() || '';

  if (trimmed.length === 0) {
    return 'Key Design Decisions & Trade-offs is required.';
  }

  if (trimmed.length < 150) {
    return `Design Decisions is too short. Please provide at least 150 characters. (current: ${trimmed.length})`;
  }

  if (trimmed.length > 10000) {
    return `Design Decisions is too long. Please keep it under 10,000 characters. (current: ${trimmed.length})`;
  }

  return null;
}

/**
 * Validate architecture form data
 * @param {Object} formData - Form data object
 * @param {string} formData.overview - Overview & components
 * @param {string} formData.dataflow - Data flow & technology stack
 * @param {string} formData.decisions - Design decisions & trade-offs
 * @returns {Object} Errors object with field names as keys
 */
export function validateArchitectureForm(formData) {
  const errors = {};

  const overviewError = validateOverview(formData.overview);
  if (overviewError) {
    errors.overview = overviewError;
  }

  const dataflowError = validateDataflow(formData.dataflow);
  if (dataflowError) {
    errors.dataflow = dataflowError;
  }

  const decisionsError = validateDecisions(formData.decisions);
  if (decisionsError) {
    errors.decisions = decisionsError;
  }

  return errors;
}

/**
 * Validate entire form based on mode
 * @param {Object} formData - Form data object
 * @param {('task'|'architecture')} mode - Documentation mode
 * @returns {Object} Errors object with field names as keys
 */
export function validateForm(formData, mode = 'task') {
  if (mode === 'architecture') {
    return validateArchitectureForm(formData);
  }

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
