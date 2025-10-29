/**
 * @fileoverview Pagination utilities for Notion API list operations
 * @module services/notion/paginate
 */

import { defaultHeaders, NOTION } from './config.js';
import { fetchWithRetry } from '../../lib/http.js';

/**
 * @async
 * @function listAllChildren
 * @description Retrieves all children blocks from a Notion page/block with automatic pagination
 * @param {Object} params - Pagination parameters
 * @param {string} params.token - Notion API authentication token
 * @param {string} params.blockId - Block/page ID to retrieve children from
 * @param {number} [params.pageSize=100] - Number of results per page (max 100)
 * @returns {Promise<Array<Object>>} Array of all child blocks
 * @throws {Error} When token/blockId missing or API request fails
 * @example
 *   const children = await listAllChildren({
 *     token: 'secret_xxx',
 *     blockId: 'page-id-123'
 *   });
 *   console.log(`Found ${children.length} blocks`);
 */
export async function listAllChildren({
  token,
  blockId,
  pageSize = 100,
}) {
  if (!token) {
    throw new Error('Notion API token is required');
  }

  if (!blockId) {
    throw new Error('Block ID is required');
  }

  if (pageSize > 100) {
    throw new Error('Page size cannot exceed 100 (Notion API limit)');
  }

  const baseUrl = `${NOTION.base}/blocks/${blockId}/children`;
  let cursor = undefined;
  const results = [];

  do {
    const url = cursor
      ? `${baseUrl}?start_cursor=${cursor}&page_size=${pageSize}`
      : `${baseUrl}?page_size=${pageSize}`;

    const res = await fetchWithRetry(url, {
      headers: defaultHeaders(token),
      timeoutMs: 10000,
      attempts: 3,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage =
        errorData.message ||
        `Failed to retrieve block children: ${res.status}`;

      if (res.status === 404) {
        throw new Error(
          `Block not found: ${blockId}. Ensure the ID is correct and the integration has access.`
        );
      }

      if (res.status === 403) {
        throw new Error(
          `Permission denied: ${errorMessage}. Ensure the page is shared with your integration.`
        );
      }

      throw new Error(errorMessage);
    }

    const data = await res.json();
    results.push(...data.results);

    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);

  return results;
}
