/**
 * @fileoverview High-level functions for exporting content to Notion pages
 * @module services/notion/exportPage
 */

import { notion, notionCall, chunkBlocks } from './index.js';

/**
 * @async
 * @function appendBlocks
 * @description Appends blocks to a Notion page/block with automatic chunking and retry logic
 * @param {string} parentId - Parent block/page ID to append children to
 * @param {Array<Object>} children - Array of Notion block objects to append
 * @returns {Promise<void>}
 * @throws {Error} When API call fails after all retry attempts
 * @example
 *   await appendBlocks('page-id-123', [
 *     { type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'Hello' }}]}},
 *     // ... more blocks
 *   ]);
 */
export async function appendBlocks(parentId, children) {
  for (const chunk of chunkBlocks(children, 100)) {
    await notionCall(() =>
      notion.blocks.children.append({
        block_id: parentId,
        children: chunk,
      })
    );
  }
}
