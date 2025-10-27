/**
 * @fileoverview Route handler for sending documentation to Notion
 * @module routes/notion
 */

import express from 'express';
import { sendToNotion } from '../services/notionService.js';

const router = express.Router();

/**
 * @async
 * @function sendToNotionHandler
 * @description Handles POST /api/notion - sends markdown content to configured Notion page
 * @param {import('express').Request} req - Express request with content in body
 * @param {import('express').Response} res - Express response
 * @returns {Promise<void>}
 * @throws {Error} When content is missing or Notion API request fails
 */
async function sendToNotionHandler(req, res) {
  try {
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        error: 'Content is required',
      });
    }

    const response = await sendToNotion(content);

    res.json({
      success: true,
      message: 'Content successfully sent to Notion',
      notionResponse: response,
    });
  } catch (error) {
    console.error('Error in /api/notion:', error);
    res.status(500).json({
      error: 'Failed to send content to Notion',
      message: error.message,
    });
  }
}

router.post('/', sendToNotionHandler);

export { router as notionRouter };
