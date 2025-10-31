/**
 * @fileoverview Zod schema for /api/generate request validation
 * @module schemas/generate
 */

import { z } from 'zod';

/**
 * @description Schema for task documentation generation requests
 * @typedef {Object} TaskGenerateRequest
 * @property {('task')} mode - Documentation mode
 * @property {string} context - Task context (minimum 10 characters)
 * @property {string} [code] - Optional code snippet
 * @property {string} [challenges] - Optional challenges description
 */
const TaskSchema = z.object({
  mode: z.literal('task'),
  context: z.string().min(10, 'context must be at least 10 chars'),
  code: z.string().optional(),
  challenges: z.string().optional(),
});

/**
 * @description Schema for architecture documentation generation requests
 * @typedef {Object} ArchitectureGenerateRequest
 * @property {('architecture')} mode - Documentation mode
 * @property {string} overview - Overview & components (150-10000 chars)
 * @property {string} dataflow - Data flow & technology stack (150-10000 chars)
 * @property {string} decisions - Design decisions & trade-offs (150-10000 chars)
 */
const ArchitectureSchema = z.object({
  mode: z.literal('architecture'),
  overview: z
    .string()
    .min(150, 'overview must be at least 150 characters')
    .max(10000, 'overview must not exceed 10,000 characters'),
  dataflow: z
    .string()
    .min(150, 'dataflow must be at least 150 characters')
    .max(10000, 'dataflow must not exceed 10,000 characters'),
  decisions: z
    .string()
    .min(150, 'decisions must be at least 150 characters')
    .max(10000, 'decisions must not exceed 10,000 characters'),
});

/**
 * @description Discriminated union schema for both task and architecture modes
 */
export const GenerateSchema = z.discriminatedUnion('mode', [
  TaskSchema,
  ArchitectureSchema,
]);
