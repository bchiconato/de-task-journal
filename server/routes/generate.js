/**
 * @fileoverview Route handler for documentation generation using Gemini API
 * @module routes/generate
 */

import express from 'express';
import { generateDocumentation } from '../services/geminiService.js';
import { validate } from '../src/middleware/validate.js';
import { GenerateSchema } from '../src/schemas/generate.js';
import { env } from '../src/config/index.js';

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

    let documentation;

    if (!env.GEMINI_API_KEY) {
      documentation = `# Documentation (mock mode)

## Summary
Mock documentation generated without API key.

## Problem Solved
**Context:** ${context || '—'}

## Solution Implemented
This is mock data returned because GEMINI_API_KEY is not configured.

## Code Highlights
\`\`\`
${code || '// no code provided'}
\`\`\`

## Challenges & Learnings
**Challenges:** ${challenges || '—'}

*Note: Set GEMINI_API_KEY in server/.env to use real AI generation.*`;
    } else {
      documentation = await generateDocumentation({
        context,
        code,
        challenges,
      });
    }

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
