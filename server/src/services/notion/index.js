/**
 * @fileoverview Core Notion client and utility functions for API operations
 * @module services/notion
 */

import { Client } from '@notionhq/client';

export const notion = new Client({ auth: process.env.NOTION_API_KEY });

/**
 * @async
 * @function notionCall
 * @description Wraps Notion API calls with retry logic for 429 and 5xx errors
 * @param {Function} fn - Async function that performs the Notion API call
 * @param {number} [attempts=5] - Maximum number of retry attempts
 * @returns {Promise<T>} Result from the API call
 * @throws {Error} When all retry attempts exhausted or non-retryable error occurs
 * @example
 *   const result = await notionCall(() => notion.pages.create({...}));
 */
export async function notionCall(fn, attempts = 5) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err?.status ?? err?.statusCode;
      if (status === 429) {
        const retryAfter = Number(err?.headers?.['retry-after'] ?? 1);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }
      if (status >= 500) {
        await new Promise((r) => setTimeout(r, 300 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

/**
 * @function chunkBlocks
 * @description Splits array of blocks into chunks of specified size (max 100 per Notion API limit)
 * @param {Array<Object>} blocks - Array of Notion block objects
 * @param {number} [size=100] - Maximum chunk size
 * @returns {Array<Array<Object>>} Array of block chunks
 * @example
 *   const chunks = chunkBlocks(blocks, 100); // [[...100 blocks], [...100 blocks], [...]]
 */
export function chunkBlocks(blocks, size = 100) {
  const out = [];
  for (let i = 0; i < blocks.length; i += size) {
    out.push(blocks.slice(i, i + size));
  }
  return out;
}
