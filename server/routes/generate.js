/**
 * @fileoverview Route handler for documentation generation using Gemini API
 * @module routes/generate
 */

import express from 'express';
import { generateDocumentation } from '../services/geminiService.js';

const router = express.Router();

/**
 * @async
 * @function generateDocsHandler
 * @description Handles POST /api/generate - generates technical documentation using Google Gemini AI
 * @param {import('express').Request} req - Express request with context, code, and challenges in body
 * @param {import('express').Response} res - Express response
 * @returns {Promise<void>}
 * @throws {Error} When documentation generation fails or context is missing
 */
async function generateDocsHandler(req, res) {
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
}

router.post('/', generateDocsHandler);

export default router;
