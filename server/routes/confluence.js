/**
 * @fileoverview Confluence route handlers for listing pages and appending content
 * @module routes/confluence
 */

import express from 'express';
import {
  searchConfluencePages,
  appendToConfluencePage,
  markdownToConfluenceStorage,
} from '../src/services/confluence/index.js';
import { validate } from '../src/middleware/validate.js';
import { ConfluenceExportSchema } from '../src/schemas/confluence.js';

const router = express.Router();

/**
 * @async
 * @function listPagesHandler
 * @description Handles GET /api/confluence/pages - returns filtered list of accessible pages
 * @param {import('express').Request} req - Express request with optional query params: search, limit
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>}
 * @throws {Error} When Confluence API request fails
 * @example
 *   GET /api/confluence/pages?search=meeting&limit=20
 *   Response: { success: true, pages: [{ id: "123", title: "Meeting Notes", spaceKey: "DEV" }], count: 1 }
 */
async function listPagesHandler(req, res, next) {
  try {
    if (
      !process.env.CONFLUENCE_API_TOKEN ||
      !process.env.CONFLUENCE_DOMAIN ||
      !process.env.CONFLUENCE_USER_EMAIL
    ) {
      return res.status(503).json({
        success: false,
        error: 'confluence_not_configured',
        message:
          'Confluence API is not configured. Check environment variables.',
      });
    }

    const searchQuery = req.query.search || '';
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    const pages = await searchConfluencePages({
      domain: process.env.CONFLUENCE_DOMAIN,
      email: process.env.CONFLUENCE_USER_EMAIL,
      token: process.env.CONFLUENCE_API_TOKEN,
      searchQuery,
      limit,
    });

    res.json({
      success: true,
      pages,
      count: pages.length,
      query: searchQuery,
      limit,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @async
 * @function confluenceHandler
 * @description Handles POST /api/confluence - appends content to Confluence page
 * @param {import('express').Request} req - Express request with validated content, pageId, mode
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>}
 * @throws {Error} When Confluence API request fails
 * @example
 *   POST /api/confluence
 *   Body: { content: "# Documentation\n\nContent here", pageId: "123456", mode: "task" }
 */
async function confluenceHandler(req, res, next) {
  try {
    if (
      !process.env.CONFLUENCE_API_TOKEN ||
      !process.env.CONFLUENCE_DOMAIN ||
      !process.env.CONFLUENCE_USER_EMAIL
    ) {
      return res.status(503).json({
        success: false,
        error: 'confluence_not_configured',
        message:
          'Confluence API is not configured. Check environment variables.',
      });
    }

    const { content, pageId } = req.valid;

    const confluenceStorage = markdownToConfluenceStorage(content);

    const response = await appendToConfluencePage({
      domain: process.env.CONFLUENCE_DOMAIN,
      email: process.env.CONFLUENCE_USER_EMAIL,
      token: process.env.CONFLUENCE_API_TOKEN,
      pageId,
      content: confluenceStorage,
    });

    res.json({
      success: true,
      platform: 'confluence',
      message: 'Content successfully appended to Confluence page',
      pageId,
      version: response.version,
    });
  } catch (error) {
    next(error);
  }
}

router.get('/pages', listPagesHandler);
router.post('/', validate(ConfluenceExportSchema), confluenceHandler);

export { router as confluenceRouter, confluenceHandler, listPagesHandler };
