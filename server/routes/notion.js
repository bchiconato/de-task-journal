import express from 'express';
import { sendToNotion } from '../services/notionService.js';

const router = express.Router();

/**
 * POST /api/notion
 * Sends content to Notion page
 */
router.post('/', async (req, res) => {
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
});

export default router;
