/**
 * @fileoverview Error handling middleware for Express application
 * @module src/middleware/errors
 */

/**
 * @function notFound
 * @description Handles 404 Not Found errors for undefined routes
 * @param {import('express').Request} _req - Express request (unused)
 * @param {import('express').Response} res - Express response
 * @returns {void}
 */
export function notFound(_req, res) {
  res.status(404).json({ error: 'not_found', message: 'Route not found' });
}

/**
 * @function errorHandler
 * @description Terminal error handling middleware - must be last in chain
 * @param {Error} err - Error object
 * @param {import('express').Request} _req - Express request (unused)
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} _next - Express next function (unused)
 * @returns {void}
 */
export function errorHandler(err, _req, res, _next) {
  const status = err.status || (err.code === 'gemini_error' ? 500 : 400);
  res.status(status).json({
    error: err.code || 'internal_error',
    message: err.message || 'Internal error',
  });
}
