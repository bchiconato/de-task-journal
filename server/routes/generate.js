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
 * @description Handles POST /api/generate - generates technical or architecture documentation using Google Gemini AI
 * @param {import('express').Request} req - Express request with validated fields based on mode
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>}
 * @throws {Error} When documentation generation fails
 */
async function generateDocsHandler(req, res, next) {
  try {
    const { mode, context } = req.valid;
    let documentation;

    if (!env.GEMINI_API_KEY) {
      documentation = generateMockDocumentation({ mode, context });
    } else {
      try {
        documentation = await generateDocumentation({ mode, context });
      } catch (geminiError) {
        const error = new Error(
          geminiError.message || 'Failed to generate documentation',
        );
        error.status = 500;
        error.code = 'gemini_error';
        throw error;
      }
    }

    res.status(200).json({
      success: true,
      documentation,
      mode,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @function generateMockDocumentation
 * @description Generates mock documentation when GEMINI_API_KEY is not configured
 * @param {Object} data - Validated request data with mode field
 * @returns {string} Mock documentation in markdown format
 */
function generateMockDocumentation(data) {
  const { mode, context } = data;
  const preview = context ? context.substring(0, 180) : '—';

  if (mode === 'architecture') {
    return `# Architecture Documentation (mock mode)

## Overview
Mock architecture documentation generated without API key.

## Context Snapshot
${preview}...

## Primary Components
- Component A
- Component B

## Flow & Stack
Describe the runtime flow and technology choices. (Mock)

## Decisions & Trade-offs
- Mock decision 1
- Mock decision 2

*Note: Set GEMINI_API_KEY in server/.env to use real AI generation.*`;
  }

  return `# Documentation (mock mode)

## Summary
Mock documentation generated without API key.

## Context Dump Snapshot
${preview}...

## Next Steps
- Configure GEMINI_API_KEY for real responses
- Re-submit the full context

*Note: Set GEMINI_API_KEY in server/.env to use real AI generation.*`;
}

router.post('/', validate(GenerateSchema), generateDocsHandler);

export {
  router as generateRouter,
  generateDocsHandler,
  generateMockDocumentation,
};
