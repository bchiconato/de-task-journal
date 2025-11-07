/**
 * @fileoverview Confluence route handlers for listing pages and appending content
 * @module routes/confluence
 */

import express from 'express';
import {
  listConfluencePages,
  appendToConfluencePage,
  markdownToConfluenceStorage,
} from '../src/services/confluence/index.js';
import { validate } from '../src/middleware/validate.js';
import { ConfluenceExportSchema } from '../src/schemas/confluence.js';

const router = express.Router();

/**
 * @async
 * @function listPagesHandler
 * @description Handles GET /api/confluence/pages - returns list of accessible pages
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>}
 * @throws {Error} When Confluence API request fails
 * @example
 *   GET /api/confluence/pages
 *   Response: { success: true, pages: [{ id: "123", title: "My Page", spaceKey: "DEV" }] }
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

    const pages = await listConfluencePages({
      domain: process.env.CONFLUENCE_DOMAIN,
      email: process.env.CONFLUENCE_USER_EMAIL,
      token: process.env.CONFLUENCE_API_TOKEN,
    });

    res.json({
      success: true,
      pages,
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

    const { content, pageId, mode } = req.valid;

    let finalContent = content;

    if (mode === 'architecture') {
      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      finalContent = `🏗️ # [ARCHITECTURE] - ${today}\n\n${content}\n\n---\n`;
    }

    if (mode === 'meeting') {
      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      finalContent = `📅 # [MEETING] - ${today}\n\n${content}\n\n---\n`;
    }

    const confluenceStorage = markdownToConfluenceStorage(finalContent);

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
      docMode: mode,
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
