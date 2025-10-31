/**
 * @fileoverview Unified route handler for creating Notion pages or appending blocks
 * @module routes/notion
 */

import express from 'express';
import { appendBlocksChunked } from '../src/services/notion/client.js';
import { markdownToNotionBlocks } from '../src/services/notion/markdown.js';
import { validate } from '../src/middleware/validate.js';
import { NotionExportSchema } from '../src/schemas/notion.js';
import { env } from '../src/config/index.js';

const router = express.Router();

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
      return res.status(400).json({ ok:false, error:'missing_page_id', message:'Defina NOTION_PAGE_ID no .env do server ou envie pageId no body.' });
    }

    let finalContent = content;

    if (mode === 'architecture') {
      const title = extractTitleFromMarkdown(content);
      const timestamp = new Date().toISOString().split('T')[0];
      finalContent = `🏗️ # [ARCHITECTURE] - ${title} (${timestamp})\n\n${content}\n\n---\n`;
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

/**
 * @function extractTitleFromMarkdown
 * @description Extracts the first H1 heading from markdown content
 * @param {string} markdown - Markdown content
 * @returns {string} Extracted title or default text
 */
function extractTitleFromMarkdown(markdown) {
  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.substring(2).trim();
    }
  }
  return 'Architecture Documentation';
}

router.post('/', validate(NotionExportSchema), notionHandler);

export { router as notionRouter };
