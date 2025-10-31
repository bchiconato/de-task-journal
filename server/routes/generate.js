/**
 * @fileoverview Route handler for documentation generation using Gemini API
 * @module routes/generate
 */

import express from 'express';
import {
  generateDocumentation,
  generateArchitectureDocumentation,
} from '../services/geminiService.js';
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
    const { mode } = req.valid;
    let documentation;

    if (!env.GEMINI_API_KEY) {
      documentation = generateMockDocumentation(req.valid);
    } else {
      if (mode === 'architecture') {
        const { overview, dataflow, decisions } = req.valid;
        documentation = await generateArchitectureDocumentation({
          overview,
          dataflow,
          decisions,
        });
      } else {
        const { context, code, challenges } = req.valid;
        documentation = await generateDocumentation({
          context,
          code,
          challenges,
        });
      }
    }

    res.json({
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
  const { mode } = data;

  if (mode === 'architecture') {
    const { overview, dataflow, decisions } = data;
    return `# Architecture Documentation (mock mode)

## Overview
Mock architecture documentation generated without API key.

**Overview & Components:** ${overview?.substring(0, 100) || '—'}...

## Key Components
This is mock data returned because GEMINI_API_KEY is not configured.

## Data & Service Flow
**Data Flow:** ${dataflow?.substring(0, 100) || '—'}...

## Technology Stack
- Mock Technology 1
- Mock Technology 2

## Key Design Decisions & Rationale
**Design Decisions:** ${decisions?.substring(0, 100) || '—'}...

## Risks & Trade-offs
- Mock risk: This is placeholder data

*Note: Set GEMINI_API_KEY in server/.env to use real AI generation.*`;
  }

  const { context, code, challenges } = data;
  return `# Documentation (mock mode)

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
}

router.post('/', validate(GenerateSchema), generateDocsHandler);

export { router as generateRouter };
