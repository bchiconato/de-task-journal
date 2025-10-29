/**
 * @fileoverview Route handler for sending documentation to Notion
 * @module routes/notion
 */

import express from 'express';
import { sendToNotion } from '../services/notionService.js';
import { validate } from '../src/middleware/validate.js';
import { NotionExportSchema } from '../src/schemas/notion.js';

const router = express.Router();

/**
 * @async
 * @function sendToNotionHandler
 * @description Handles POST /api/notion - sends markdown content to configured Notion page
 * @param {import('express').Request} req - Express request with validated content
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>}
 * @throws {Error} When Notion API request fails
 */
async function sendToNotionHandler(req, res, next) {
  try {
    const { content } = req.valid;

    const response = await sendToNotion(content);

    res.json({
      success: true,
      message: 'Content successfully sent to Notion',
      notionResponse: response,
    });
  } catch (error) {
    next(error);
  }
}

router.post('/', validate(NotionExportSchema), sendToNotionHandler);

export { router as notionRouter };
