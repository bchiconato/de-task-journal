/**
 * @fileoverview Zod schema for /api/generate request validation
 * @module schemas/generate
 */

import { z } from 'zod';

/**
 * @description Schema for documentation generation requests
 * @typedef {Object} GenerateRequest
 * @property {string} context - Task context (minimum 10 characters)
 * @property {string} [code] - Optional code snippet
 * @property {string} [challenges] - Optional challenges description
 * @property {('en'|'pt')} [language] - Output language (defaults to 'en')
 */
export const GenerateSchema = z.object({
  context: z.string().min(10, 'context must be at least 10 chars'),
  code: z.string().optional(),
  challenges: z.string().optional(),
  language: z.enum(['en', 'pt']).default('en'),
});
