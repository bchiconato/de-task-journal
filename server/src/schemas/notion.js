/**
 * @fileoverview Zod schema for /api/notion request validation
 * @module schemas/notion
 */

import { z } from 'zod';

/**
 * @description Schema for Notion export requests
 * @typedef {Object} NotionExportRequest
 * @property {string} content - Markdown content to send to Notion
 */
export const NotionExportSchema = z.object({
  content: z.string().min(1, 'content must not be empty'),
});
