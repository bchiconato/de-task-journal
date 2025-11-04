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

const clone = (value) => {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

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

  const preparedBlocks = children.map((block) => prepareBlock(block));
  const stats = {
    blocksAdded: 0,
    chunks: [],
    responses: [],
  };

  await appendPreparedBlocks(token, blockId, preparedBlocks, stats);

  return {
    blocksAdded: stats.blocksAdded,
    chunks: stats.chunks,
    chunkCount: stats.chunks.length,
    responses: stats.responses,
  };
}

function prepareBlock(block) {
  const cloned = clone(block);

  if ('object' in cloned) {
    delete cloned.object;
  }

  if (cloned.type === 'table') {
    const tableChildren = Array.isArray(cloned.table?.children)
      ? cloned.table.children
      : [];

    const preparedRows = tableChildren.map((row) => prepareBlock(row).block);

    cloned.table = {
      ...cloned.table,
      children: preparedRows,
    };

    return {
      block: cloned,
      children: [],
    };
  }

  const rawChildren = Array.isArray(cloned.children) ? cloned.children : [];
  const preparedChildren = rawChildren.map((child) => prepareBlock(child));
  delete cloned.children;

  return {
    block: cloned,
    children: preparedChildren,
  };
}

async function appendPreparedBlocks(token, blockId, preparedNodes, stats) {
  if (!preparedNodes || preparedNodes.length === 0) {
    return;
  }

  const total = preparedNodes.length;
  for (let i = 0; i < total; i += MAX_BLOCKS_PER_REQUEST) {
    const chunkNodes = preparedNodes.slice(i, i + MAX_BLOCKS_PER_REQUEST);
    const chunkBlocks = chunkNodes.map((node) => node.block);

    const chunkStartedAt = new Date().toISOString();
    const startTime = performance.now();

    const res = await fetchWithRetry(withUrl(`/blocks/${blockId}/children`), {
      method: 'PATCH',
      headers: defaultHeaders(token),
      body: JSON.stringify({ children: chunkBlocks }),
      timeoutMs: 10000,
      attempts: 3,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage =
        errorData.message ||
        `Failed to append blocks (chunk ${i / MAX_BLOCKS_PER_REQUEST + 1}/${Math.ceil(total / MAX_BLOCKS_PER_REQUEST)}): ${res.status}`;

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
    stats.responses.push(responseData);
    stats.blocksAdded += chunkBlocks.length;

    const durationMs = Math.round(performance.now() - startTime);
    stats.chunks.push({
      index: stats.chunks.length + 1,
      size: chunkBlocks.length,
      durationMs,
      startedAt: chunkStartedAt,
    });

    const appendedResults = Array.isArray(responseData.results)
      ? responseData.results
      : [];

    for (let j = 0; j < chunkNodes.length; j++) {
      const childNodes = chunkNodes[j].children;
      if (!childNodes || childNodes.length === 0) {
        continue;
      }

      const appendedBlock = appendedResults[j];
      if (!appendedBlock || !appendedBlock.id) {
        console.warn(
          'Notion response missing block id for nested children; skipping nested append.',
        );
        continue;
      }

      await appendPreparedBlocks(token, appendedBlock.id, childNodes, stats);
    }

    if (i + MAX_BLOCKS_PER_REQUEST < total) {
      await wait(RPS_THROTTLE_MS);
    }
  }
}
