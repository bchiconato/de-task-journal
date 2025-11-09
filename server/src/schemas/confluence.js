/**
 * @fileoverview Zod schema for /api/confluence request validation
 * @module schemas/confluence
 */

import { z } from 'zod';

/**
 * @description Schema for Confluence export requests
 * @typedef {Object} ConfluenceExportRequest
 * @property {string} content - Markdown content to send to Confluence (min 100 chars)
 * @property {string} pageId - Existing page ID to append content to
 * @property {('task'|'architecture'|'meeting')} [mode] - Documentation mode (defaults to 'task')
 * @property {('append'|'overwrite')} [writeMode] - Write mode (defaults to 'append')
 */
export const ConfluenceExportSchema = z.object({
  content: z
    .string()
    .min(100, 'Content must be at least 100 characters')
    .max(50000, 'Content must not exceed 50000 characters'),
  pageId: z.string().min(1, 'Page ID is required').max(100, 'Page ID too long'),
  mode: z.enum(['task', 'architecture', 'meeting']).default('task'),
  writeMode: z.enum(['append', 'overwrite']).default('append'),
});
