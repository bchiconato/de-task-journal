/**
 * @fileoverview Route handler for documentation generation using Gemini API
 * @module routes/generate
 */

import express from 'express';
import { generateDocumentation } from '../services/geminiService.js';
import { validate } from '../src/middleware/validate.js';
import { GenerateSchema } from '../src/schemas/generate.js';

const router = express.Router();

/**
 * @async
 * @function generateDocsHandler
 * @description Handles POST /api/generate - generates technical documentation using Google Gemini AI
 * @param {import('express').Request} req - Express request with validated context, code, and challenges
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>}
 * @throws {Error} When documentation generation fails
 */
async function generateDocsHandler(req, res, next) {
  try {
    const { context, code, challenges } = req.valid;

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
    next(error);
  }
}

router.post('/', validate(GenerateSchema), generateDocsHandler);

export { router as generateRouter };
