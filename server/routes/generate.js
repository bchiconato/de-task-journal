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
Mock architecture documentation generated without API key. This system provides a comprehensive solution for data engineering tasks.

## Context Snapshot
${preview}...

## Primary Components
- Component A: Handles data ingestion and validation
- Component B: Manages data transformation and processing
- Component C: Ensures data quality and monitoring

## Flow & Stack
Describe the runtime flow and technology choices. Data flows from source systems through validation layers into the data warehouse.

## Decisions & Trade-offs
- Mock decision 1: Using cloud-native architecture for scalability
- Mock decision 2: Implementing event-driven patterns for real-time processing

*Note: Set GEMINI_API_KEY in server/.env to use real AI generation.*`;
  }

  if (mode === 'meeting') {
    return `# Meeting Record: Project Sync (mock mode)

## Executive Summary
Mock meeting documentation generated without API key. This would normally contain a summary of the meeting's primary objective, key outcomes, and overall sentiment based on the full transcript provided.

## Context Snapshot
${preview}...

## Key Decisions & Definitions
* **Mock Decision 1:** Team agreed to proceed with the proposed architecture changes
* **Mock Decision 2:** Important agreement on timeline and resource allocation for the next quarter

## Technical Context Extracted
* *Technologies mentioned:* GCP, Snowflake, Airflow, dbt, Python
* *Architectural changes:* Gold Layer migration to cloud infrastructure
* *Data points:* Mock tables, fields, and data quality metrics discussed

## Action Items & Next Steps
* [ ] **Team Member 1**: Complete mock task 1 and prepare documentation (deadline: TBD)
* [ ] **Team Member 2**: Complete mock task 2 and coordinate with stakeholders (deadline: TBD)

## Open Questions & Risks
* Mock open question 1: How to handle data migration without downtime?
* Mock risk or concern 2: Potential impact on downstream systems during transition

*Note: Set GEMINI_API_KEY in server/.env to use real AI generation.*`;
  }

  return `# Task Documentation (mock mode)

## Summary
Mock documentation generated without API key. This task involves implementing a comprehensive solution for the documented requirements.

## Context Dump Snapshot
${preview}...

## Problem Solved
The task addresses a critical need in the data engineering workflow by providing automated documentation generation capabilities.

## Solution Implemented
Implemented a mock documentation system that generates structured output following industry best practices and standards.

## Code Highlights
No code provided in the context. In a real scenario, this section would highlight the most important code changes.

## Challenges & Learnings
- Configure GEMINI_API_KEY for real AI-powered responses
- Re-submit the full context for comprehensive documentation

*Note: Set GEMINI_API_KEY in server/.env to use real AI generation.*`;
}

router.post('/', validate(GenerateSchema), generateDocsHandler);

export {
  router as generateRouter,
  generateDocsHandler,
  generateMockDocumentation,
};
