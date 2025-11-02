/**
 * @fileoverview Notion search API operations for discovering shared pages
 * @module services/notion/search
 */

import { defaultHeaders, NOTION } from './config.js';
import { fetchWithRetry } from '../../lib/http.js';

/**
 * @function withUrl
 * @description Constructs full Notion API URL from path
 * @param {string} path - API endpoint path (e.g., '/search')
 * @returns {string} Full URL
 * @example
 *   withUrl('/search') // 'https://api.notion.com/v1/search'
 */
function withUrl(path) {
  return `${NOTION.base}${path}`;
}

/**
 * @async
 * @function listSharedPages
 * @description Lists all pages shared with the integration using paginated search
 * @param {Object} params - Search parameters
 * @param {string} params.token - Notion API authentication token
 * @returns {Promise<Array<{id: string, title: string}>>} Simplified array of pages with id and title
 * @throws {Error} When token missing or API request fails
 * @example
 *   const pages = await listSharedPages({ token: 'secret_xxx' });
 *   // [{ id: 'abc-123', title: 'My Page' }, { id: 'def-456', title: 'Another Page' }]
 */
export async function listSharedPages({ token }) {
  if (!token) {
    throw new Error('Notion API token is required');
  }

  const allPages = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const body = {
      filter: {
        value: 'page',
        property: 'object',
      },
      page_size: 100,
    };

    if (startCursor) {
      body.start_cursor = startCursor;
    }

    const res = await fetchWithRetry(withUrl('/search'), {
      method: 'POST',
      headers: defaultHeaders(token),
      body: JSON.stringify(body),
      timeoutMs: 10000,
      attempts: 3,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `Failed to search pages: ${res.status}`;

      if (res.status === 403) {
        throw new Error(
          `Notion permission error: ${errorMessage}. Ensure your integration has search capability.`,
        );
      }

      if (res.status === 400 && errorData.code === 'validation_error') {
        throw new Error(`Notion validation error: ${errorMessage}`);
      }

      throw new Error(errorMessage);
    }

    const data = await res.json();

    for (const page of data.results || []) {
      const title = extractPageTitle(page);
      allPages.push({
        id: page.id,
        title,
      });
    }

    hasMore = data.has_more ?? false;
    startCursor = data.next_cursor ?? undefined;
  }

  return allPages;
}

/**
 * @function extractPageTitle
 * @description Extracts the title from a Notion page object
 * @param {Object} page - Notion page object from API response
 * @returns {string} Page title or "Untitled" if not found
 * @example
 *   const title = extractPageTitle(pageObject);
 */
function extractPageTitle(page) {
  try {
    const titleProp = page.properties?.title || page.properties?.Title;
    if (!titleProp) {
      return 'Untitled';
    }

    if (
      titleProp.title &&
      Array.isArray(titleProp.title) &&
      titleProp.title[0]
    ) {
      return titleProp.title[0].plain_text || 'Untitled';
    }

    return 'Untitled';
  } catch {
    return 'Untitled';
  }
}
