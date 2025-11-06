/**
 * @fileoverview Configuration endpoint to return available platforms
 * @module routes/config
 */

import express from 'express';
import { getAvailablePlatforms } from '../src/config/index.js';

const router = express.Router();

/**
 * @async
 * @function configHandler
 * @description Handles GET /api/config - returns available platforms
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {Promise<void>}
 * @example
 *   GET /api/config
 *   Response: { platforms: { notion: true, confluence: false } }
 */
async function configHandler(req, res) {
  const platforms = getAvailablePlatforms();

  res.json({
    success: true,
    platforms,
  });
}

router.get('/', configHandler);

export { router as configRouter, configHandler };
