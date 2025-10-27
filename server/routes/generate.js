import express from 'express';
import { generateDocumentation } from '../services/geminiService.js';

const router = express.Router();

/**
 * POST /api/generate
 * Generates technical documentation using Google Gemini AI
 */
router.post('/', async (req, res) => {
  try {
    const { context, code, challenges } = req.body;

    if (!context || context.trim() === '') {
      return res.status(400).json({
        error: 'Context is required',
      });
    }

    const documentation = await generateDocumentation({
      context,
      code,
      challenges,
    });

    res.json({
      success: true,
      documentation,
    });
  } catch (error) {
    console.error('Error in /api/generate:', error);
    res.status(500).json({
      error: 'Failed to generate documentation',
      message: error.message,
    });
  }
});

export default router;
