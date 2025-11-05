/**
 * @fileoverview Zod schema for /api/generate request validation
 * @module schemas/generate
 */

import { z } from 'zod';

/**
 * @description Schema for documentation generation requests (task, architecture, or meeting)
 * @typedef {Object} GenerateRequest
 * @property {('task'|'architecture'|'meeting')} mode - Documentation mode
 * @property {string} context - Context dump (minimum 10 characters)
 */
export const GenerateSchema = z
  .object({
    mode: z
      .enum(['task', 'architecture', 'meeting'])
      .optional()
      .default('task'),
    context: z
      .string()
      .min(10, 'context must be at least 10 characters')
      .max(30000, 'context must not exceed 30,000 characters'),
  })
  .transform((data) => ({
    ...data,
    mode: data.mode ?? 'task',
  }));
