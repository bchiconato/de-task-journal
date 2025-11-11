/**
 * @fileoverview Confluence route handlers for listing pages, spaces, and appending content
 * @module routes/confluence
 */

import express from 'express';
import {
  searchConfluencePages,
  listConfluenceSpaces,
  appendToConfluencePage,
  overwriteConfluencePage,
  markdownToConfluenceStorage,
} from '../src/services/confluence/index.js';
import { validate } from '../src/middleware/validate.js';
import { ConfluenceExportSchema } from '../src/schemas/confluence.js';

const router = express.Router();

/**
 * @async
 * @function listSpacesHandler
 * @description Handles GET /api/confluence/spaces - returns list of accessible spaces
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>}
 * @throws {Error} When Confluence API request fails
 * @example
 *   GET /api/confluence/spaces
 *   Response: { success: true, spaces: [{ key: "DAI", name: "Data Analytics and Insights", id: "57638912" }] }
 */
async function listSpacesHandler(req, res, next) {
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

    const spaces = await listConfluenceSpaces({
      domain: process.env.CONFLUENCE_DOMAIN,
      email: process.env.CONFLUENCE_USER_EMAIL,
      token: process.env.CONFLUENCE_API_TOKEN,
    });

    res.json({
      success: true,
      spaces,
      count: spaces.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @async
 * @function listPagesHandler
 * @description Handles GET /api/confluence/pages - returns filtered list of accessible pages
 * @param {import('express').Request} req - Express request with optional query params: search, space, limit
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>}
 * @throws {Error} When Confluence API request fails
 * @example
 *   GET /api/confluence/pages?search=meeting&space=DAI&limit=20
 *   Response: { success: true, pages: [{ id: "123", title: "Meeting Notes", spaceKey: "57638912" }], count: 1 }
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
    const spaceKey = req.query.space || 'DAI';
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    const pages = await searchConfluencePages({
      domain: process.env.CONFLUENCE_DOMAIN,
      email: process.env.CONFLUENCE_USER_EMAIL,
      token: process.env.CONFLUENCE_API_TOKEN,
      searchQuery,
      spaceKey,
      limit,
    });

    res.json({
      success: true,
      pages,
      count: pages.length,
      query: searchQuery,
      spaceKey,
      limit,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @async
 * @function confluenceHandler
 * @description Handles POST /api/confluence - appends or overwrites content in Confluence page
 * @param {import('express').Request} req - Express request with validated content, pageId, mode, writeMode
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>}
 * @throws {Error} When Confluence API request fails
 * @example
 *   POST /api/confluence
 *   Body: { content: "# Documentation\n\nContent here", pageId: "123456", mode: "task", writeMode: "append" }
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

    const { content, pageId, writeMode } = req.valid;

    const confluenceStorage = markdownToConfluenceStorage(content);

    let response;
    if (writeMode === 'overwrite') {
      response = await overwriteConfluencePage({
        domain: process.env.CONFLUENCE_DOMAIN,
        email: process.env.CONFLUENCE_USER_EMAIL,
        token: process.env.CONFLUENCE_API_TOKEN,
        pageId,
        content: confluenceStorage,
      });
    } else {
      response = await appendToConfluencePage({
        domain: process.env.CONFLUENCE_DOMAIN,
        email: process.env.CONFLUENCE_USER_EMAIL,
        token: process.env.CONFLUENCE_API_TOKEN,
        pageId,
        content: confluenceStorage,
      });
    }

    const actionVerb =
      writeMode === 'overwrite' ? 'replaced in' : 'appended to';

    res.json({
      success: true,
      platform: 'confluence',
      writeMode,
      message: `Content successfully ${actionVerb} Confluence page`,
      pageId,
      version: response.version,
    });
  } catch (error) {
    next(error);
  }
}

router.get('/spaces', listSpacesHandler);
router.get('/pages', listPagesHandler);
router.post('/', validate(ConfluenceExportSchema), confluenceHandler);

export {
  router as confluenceRouter,
  confluenceHandler,
  listPagesHandler,
  listSpacesHandler,
};