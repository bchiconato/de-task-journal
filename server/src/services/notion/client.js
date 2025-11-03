/**
 * @fileoverview Notion API client primitives for page creation and block operations
 * @module services/notion/client
 */

import {
  defaultHeaders,
  NOTION,
  MAX_BLOCKS_PER_REQUEST,
  RPS_THROTTLE_MS,
} from './config.js';
import { fetchWithRetry } from '../../lib/http.js';
import { performance } from 'node:perf_hooks';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @function withUrl
 * @description Constructs full Notion API URL from path
 * @param {string} path - API endpoint path (e.g., '/pages')
 * @returns {string} Full URL
 * @example
 *   withUrl('/pages') // 'https://api.notion.com/v1/pages'
 */
function withUrl(path) {
  return `${NOTION.base}${path}`;
}

/**
 * @async
 * @function appendBlocksChunked
 * @description Appends blocks to a Notion page/block with automatic chunking for >100 blocks
 * @param {Object} params - Append parameters
 * @param {string} params.token - Notion API authentication token
 * @param {string} params.blockId - Target block/page ID to append children to
 * @param {Array<Object>} params.children - Array of Notion blocks to append
 * @returns {Promise<Object>} Summary with blocksAdded count and chunks array
 * @throws {Error} When token/blockId missing or API request fails
 * @example
 *   const result = await appendBlocksChunked({
 *     token: 'secret_xxx',
 *     blockId: 'page-id-123',
 *     children: [...250 blocks...]
 *   });
 *   // {
 *   //   blocksAdded: 250,
 *   //   chunkCount: 3,
 *   //   chunks: [
 *   //     { index: 1, size: 100, durationMs: 134, startedAt: '2024-01-01T12:00:00.000Z' },
 *   //     ...
 *   //   ],
 *   //   responses: [...]
 *   // }
 */
export async function appendBlocksChunked({ token, blockId, children }) {
  if (!token) {
    throw new Error('Notion API token is required');
  }

  if (!blockId) {
    throw new Error('Block ID is required');
  }

  if (!children || children.length === 0) {
    return { blocksAdded: 0, chunks: [], chunkCount: 0, responses: [] };
  }

  const chunks = [];
  for (let i = 0; i < children.length; i += MAX_BLOCKS_PER_REQUEST) {
    chunks.push(children.slice(i, i + MAX_BLOCKS_PER_REQUEST));
  }

  const responses = [];
  const chunkSummaries = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkStartedAt = new Date().toISOString();
    const startTime = performance.now();

    const res = await fetchWithRetry(withUrl(`/blocks/${blockId}/children`), {
      method: 'PATCH',
      headers: defaultHeaders(token),
      body: JSON.stringify({ children: chunk }),
      timeoutMs: 10000,
      attempts: 3,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage =
        errorData.message ||
        `Failed to append blocks (chunk ${i + 1}/${chunks.length}): ${res.status}`;

      if (res.status === 403) {
        throw new Error(
          `Notion permission error: ${errorMessage}. Ensure the page is shared with your integration and it has 'Insert content' capability.`,
        );
      }

      if (res.status === 400 && errorData.code === 'validation_error') {
        throw new Error(`Notion validation error: ${errorMessage}`);
      }

      if (res.status === 429) {
        throw new Error(
          `Rate limit exceeded: ${errorMessage}. Consider increasing throttle delay.`,
        );
      }

      throw new Error(errorMessage);
    }

    const responseData = await res.json();
    responses.push(responseData);

    const durationMs = Math.round(performance.now() - startTime);
    const summary = {
      index: i + 1,
      size: chunk.length,
      durationMs,
      startedAt: chunkStartedAt,
    };
    chunkSummaries.push(summary);

    console.info(
      `Notion append chunk ${summary.index}/${chunks.length} | ${summary.size} blocks | ${summary.durationMs}ms`,
    );

    if (i < chunks.length - 1) {
      await wait(RPS_THROTTLE_MS);
    }
  }

  return {
    blocksAdded: children.length,
    chunks: chunkSummaries,
    chunkCount: chunks.length,
    responses,
  };
}
