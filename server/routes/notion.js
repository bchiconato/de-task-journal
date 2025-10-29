/**
 * @fileoverview Unified route handler for creating Notion pages or appending blocks
 * @module routes/notion
 */

import express from 'express';
import { sendToNotion, markdownToNotionBlocks } from '../services/notionService.js';
import { createPage, appendBlocksChunked } from '../src/services/notion/client.js';
import { validate } from '../src/middleware/validate.js';
import { NotionExportSchema } from '../src/schemas/notion.js';
import { env } from '../src/config/index.js';

const router = express.Router();

/**
 * @async
 * @function notionHandler
 * @description Handles POST /api/notion - unified smart route that creates pages or appends blocks
 * @param {import('express').Request} req - Express request with validated content, pageId, title, parentPageId
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>}
 * @throws {Error} When Notion API request fails
 * @example
 *
 *   POST /api/notion
 *   Body: { content: "More content", pageId: "abc-123" }  // Appends to existing
 */
async function notionHandler(req, res, next) {
  try {
    const { content, pageId } = req.valid;
    const targetPageId = pageId || env.NOTION_PAGE_ID;

    if (!targetPageId) {
      return res.status(400).json({ ok:false, error:'missing_page_id', message:'Defina NOTION_PAGE_ID no .env do server ou envie pageId no body.' });
    }
    const response = await sendToNotion(content, targetPageId);
      res.json({
        success: true,
        mode: 'append',
        message: 'Content successfully appended to Notion page',
        pageId: targetPageId,
        blocksAdded: response.blocksAdded,
        chunks: response.chunks,
      });
  } catch (error) {
    next(error);
  }
}

router.post('/', validate(NotionExportSchema), notionHandler);

export { router as notionRouter };
