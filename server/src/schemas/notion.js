/**
 * @fileoverview Zod schema for /api/notion request validation
 * @module schemas/notion
 */

import { z } from 'zod';

/**
 * @description Schema for Notion export requests supporting both page creation and block appending
 * @typedef {Object} NotionExportRequest
 * @property {string} content - Markdown content to send to Notion
 * @property {string} [pageId] - Existing page ID to append blocks to (append mode)
 * @property {string} [title] - New page title (create mode, required if no pageId)
 * @property {string} [parentPageId] - Parent page ID for new page creation
 */
export const NotionExportSchema = z
  .object({
    content: z.string().min(1, 'content must not be empty'),
    pageId: z.string().optional(),
    title: z.string().optional(),
    parentPageId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.pageId && !data.title) {
        return false;
      }
      return true;
    },
    {
      message:
        'Either pageId (to append) or title (to create new page) must be provided',
    }
  );
