/**
 * @fileoverview Unified route handler for creating Notion pages or appending blocks
 * @module routes/notion
 */

import express from 'express';
import { appendBlocksChunked } from '../src/services/notion/client.js';
import { listSharedPages } from '../src/services/notion/index.js';
import { markdownToNotionBlocks } from '../src/services/notion/markdown.js';
import { validate } from '../src/middleware/validate.js';
import { NotionExportSchema } from '../src/schemas/notion.js';
import { env } from '../src/config/index.js';

const router = express.Router();

/**
 * @async
 * @function listPagesHandler
 * @description Handles GET /api/notion/pages - returns list of pages shared with integration
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>}
 * @throws {Error} When Notion API request fails
 * @example
 *   GET /api/notion/pages
 *   Response: { success: true, pages: [{ id: "abc-123", title: "My Page" }] }
 */
async function listPagesHandler(req, res, next) {
  try {
    const pages = await listSharedPages({
      token: env.NOTION_API_KEY,
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
 * @function notionHandler
 * @description Handles POST /api/notion - unified smart route that creates pages or appends blocks
 * @param {import('express').Request} req - Express request with validated content, pageId, title, parentPageId, mode
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>}
 * @throws {Error} When Notion API request fails
 * @example
 *
 *   POST /api/notion
 *   Body: { content: "More content", pageId: "abc-123", mode: "architecture" }  // Appends with header
 */
async function notionHandler(req, res, next) {
  try {
    const { content, pageId, mode } = req.valid;
    const targetPageId = pageId || env.NOTION_PAGE_ID;

    if (!targetPageId) {
      return res.status(400).json({
        ok: false,
        error: 'missing_page_id',
        message:
          'Defina NOTION_PAGE_ID no .env do server ou envie pageId no body.',
      });
    }

    let finalContent = content;

    if (mode === 'architecture') {
      finalContent = `${content}\n\n---\n`;
    }

    const blocks = markdownToNotionBlocks(finalContent);
    console.log(`Generated ${blocks.length} Notion blocks (mode: ${mode})`);

    const response = await appendBlocksChunked({
      token: env.NOTION_API_KEY,
      blockId: targetPageId,
      children: blocks,
    });

    res.json({
      success: true,
      mode: 'append',
      docMode: mode,
      message: `Content successfully appended to Notion page`,
      pageId: targetPageId,
      blocksAdded: response.blocksAdded,
      chunks: response.chunks,
    });
  } catch (error) {
    next(error);
  }
}

router.get('/pages', listPagesHandler);
router.post('/', validate(NotionExportSchema), notionHandler);

export { router as notionRouter, notionHandler, listPagesHandler };
