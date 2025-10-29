/**
 * @fileoverview Notion API client primitives for page creation and block operations
 * @module services/notion/client
 */

import { defaultHeaders, NOTION, MAX_BLOCKS_PER_REQUEST } from './config.js';
import { fetchWithRetry } from '../../lib/http.js';

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
 * @function createPage
 * @description Creates a new Notion page with optional initial children blocks
 * @param {Object} params - Page creation parameters
 * @param {string} params.token - Notion API authentication token
 * @param {string} [params.parentPageId] - Parent page ID (required for internal integrations)
 * @param {string} params.title - Page title
 * @param {Array<Object>} [params.children=[]] - Initial blocks (max 100 per request)
 * @returns {Promise<Object>} Created page object with id, url, and other properties
 * @throws {Error} When token missing, parent not accessible, or validation fails
 * @example
 *   const page = await createPage({
 *     token: 'secret_xxx',
 *     parentPageId: 'abc-123',
 *     title: 'My Documentation',
 *     children: [{ type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'Hello' }}]}}]
 *   });
 */
export async function createPage({ token, parentPageId, title, children = [] }) {
  if (!token) {
    throw new Error('Notion API token is required');
  }

  if (!title) {
    throw new Error('Page title is required');
  }

  const body = {
    parent: parentPageId
      ? { page_id: parentPageId }
      : { type: 'workspace', workspace: true },
    properties: {
      title: {
        title: [{ type: 'text', text: { content: title } }],
      },
    },
  };

  if (children.length > 0) {
    if (children.length > MAX_BLOCKS_PER_REQUEST) {
      throw new Error(
        `Cannot include ${children.length} children in page creation. Maximum is ${MAX_BLOCKS_PER_REQUEST}. Use appendBlocksChunked for remaining blocks.`
      );
    }
    body.children = children;
  }

  const res = await fetchWithRetry(withUrl('/pages'), {
    method: 'POST',
    headers: defaultHeaders(token),
    body: JSON.stringify(body),
    timeoutMs: 10000,
    attempts: 3,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage =
      errorData.message || `Failed to create page: ${res.status}`;

    if (res.status === 403) {
      throw new Error(
        `Notion permission error: ${errorMessage}. Ensure the page is shared with your integration and it has 'Insert content' capability.`
      );
    }

    if (res.status === 400 && errorData.code === 'validation_error') {
      throw new Error(`Notion validation error: ${errorMessage}`);
    }

    throw new Error(errorMessage);
  }

  return res.json();
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
 *   // { blocksAdded: 250, chunks: 3, responses: [...] }
 */
export async function appendBlocksChunked({ token, blockId, children }) {
  if (!token) {
    throw new Error('Notion API token is required');
  }

  if (!blockId) {
    throw new Error('Block ID is required');
  }

  if (!children || children.length === 0) {
    return { blocksAdded: 0, chunks: 0, responses: [] };
  }

  const chunks = [];
  for (let i = 0; i < children.length; i += MAX_BLOCKS_PER_REQUEST) {
    chunks.push(children.slice(i, i + MAX_BLOCKS_PER_REQUEST));
  }

  const responses = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const res = await fetchWithRetry(
      withUrl(`/blocks/${blockId}/children`),
      {
        method: 'PATCH',
        headers: defaultHeaders(token),
        body: JSON.stringify({ children: chunk }),
        timeoutMs: 10000,
        attempts: 3,
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage =
        errorData.message ||
        `Failed to append blocks (chunk ${i + 1}/${chunks.length}): ${res.status}`;

      if (res.status === 403) {
        throw new Error(
          `Notion permission error: ${errorMessage}. Ensure the page is shared with your integration and it has 'Insert content' capability.`
        );
      }

      if (res.status === 400 && errorData.code === 'validation_error') {
        throw new Error(`Notion validation error: ${errorMessage}`);
      }

      if (res.status === 429) {
        throw new Error(
          `Rate limit exceeded: ${errorMessage}. Consider increasing throttle delay.`
        );
      }

      throw new Error(errorMessage);
    }

    const responseData = await res.json();
    responses.push(responseData);

    if (i < chunks.length - 1) {
      await delay(100);
    }
  }

  return {
    blocksAdded: children.length,
    chunks: chunks.length,
    responses,
  };
}

/**
 * @async
 * @function checkPageAccess
 * @description Pre-flight check to verify integration has access to a page/block before operations
 * @param {Object} params - Check parameters
 * @param {string} params.token - Notion API authentication token
 * @param {string} params.pageId - Page/block ID to check access for
 * @returns {Promise<{accessible: boolean, error: string|null}>} Access status and error if any
 * @throws {Error} When token/pageId missing
 * @example
 *   const access = await checkPageAccess({ token: 'xxx', pageId: 'page-123' });
 *   if (!access.accessible) throw new Error(access.error);
 */
export async function checkPageAccess({ token, pageId }) {
  if (!token) {
    throw new Error('Notion API token is required');
  }

  if (!pageId) {
    throw new Error('Page ID is required');
  }

  try {
    const res = await fetchWithRetry(withUrl(`/blocks/${pageId}`), {
      headers: defaultHeaders(token),
      timeoutMs: 5000,
      attempts: 1,
    });

    if (res.ok) {
      return { accessible: true, error: null };
    }

    if (res.status === 403) {
      return {
        accessible: false,
        error:
          'Permission denied. Ensure the page is shared with your integration and it has Insert content capability.',
      };
    }

    if (res.status === 404) {
      return {
        accessible: false,
        error: 'Page not found. Verify the page ID is correct.',
      };
    }

    const errorData = await res.json().catch(() => ({}));
    return {
      accessible: false,
      error: errorData.message || `Access check failed with status ${res.status}`,
    };
  } catch (err) {
    return {
      accessible: false,
      error: `Access check failed: ${err.message}`,
    };
  }
}

/**
 * @function delay
 * @description Promisified setTimeout for throttling requests
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 * @example
 *   await delay(100); // Wait 100ms
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
