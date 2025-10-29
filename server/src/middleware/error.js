/**
 * @fileoverview Centralized error handling middleware for Express
 * @module middleware/error
 */

import { env } from '../config/index.js';

/**
 * @function errorHandler
 * @description Terminal error handler middleware that standardizes error responses
 * @param {Error} err - Error object
 * @param {import('express').Request} _req - Express request (unused)
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} _next - Express next function (unused)
 * @returns {void}
 */
export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const code = err.code || (status === 500 ? 'internal_error' : 'error');
  const body = {
    ok: false,
    error: code,
    message: err.message ?? 'Unhandled error',
  };
  if (env.NODE_ENV !== 'production' && err.cause) {
    body.cause = String(err.cause);
  }
  res.status(status).json(body);
}
