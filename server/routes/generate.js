/**
 * @fileoverview Route handler for documentation generation using LLM providers
 * @module routes/generate
 */

import express from 'express';
import { generateDocumentation } from '../src/services/llmRouter.js';
import { validate } from '../src/middleware/validate.js';
import { GenerateSchema } from '../src/schemas/generate.js';

const router = express.Router();

/**
 * @async
 * @function generateDocsHandler
 * @description Handles POST /api/generate - generates technical documentation using available LLM providers
 * @param {import('express').Request} req - Express request with validated fields based on mode
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>}
 * @throws {Error} When documentation generation fails
 */
async function generateDocsHandler(req, res, next) {
  try {
    const { mode, context } = req.valid;

    const result = await generateDocumentation({ mode, context });

    res.status(200).json({
      success: true,
      documentation: result.documentation,
      mode,
      provider: result.provider,
      optimized: result.wasOptimized,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('[GenerateHandler] Error:', error);

    const statusCode =
      error.status || error.code === 'rate_limit_exceeded' ? 429 : 500;

    next({
      status: statusCode,
      message: error.message,
      code: error.code || 'generation_failed',
    });
  }
}

router.post('/', validate(GenerateSchema), generateDocsHandler);

export { router as generateRouter, generateDocsHandler };
