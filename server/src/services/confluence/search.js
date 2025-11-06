/**
 * @fileoverview Confluence search API operations
 * @module services/confluence/search
 */

import { fetchWithRetry } from '../../lib/http.js';
import { getConfluenceUrl, getConfluenceHeaders } from './config.js';

/**
 * @async
 * @function listConfluencePages
 * @description Lists all accessible Confluence pages
 * @param {Object} params - Parameters
 * @param {string} params.domain - Confluence domain
 * @param {string} params.email - User email
 * @param {string} params.token - API token
 * @returns {Promise<Array<{id: string, title: string, spaceKey: string}>>} Array of pages
 * @throws {Error} When API request fails
 */
export async function listConfluencePages({ domain, email, token }) {
  if (!domain || !email || !token) {
    throw new Error('Confluence credentials are required');
  }

  const allPages = [];
  let cursor = null;
  let hasMore = true;

  while (hasMore) {
    const url = cursor
      ? getConfluenceUrl(domain, `/pages?limit=250&cursor=${cursor}`)
      : getConfluenceUrl(domain, '/pages?limit=250');

    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: getConfluenceHeaders(email, token),
      timeoutMs: 10000,
      attempts: 3,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `Failed to list pages: ${response.status}`;

      if (response.status === 403) {
        throw new Error(
          `Confluence permission error: ${errorMessage}. Check API token permissions.`,
        );
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    for (const page of data.results || []) {
      allPages.push({
        id: page.id,
        title: page.title || 'Untitled',
        spaceKey: page.spaceId || '',
      });
    }

    cursor = data._links?.next ? extractCursor(data._links.next) : null;
    hasMore = Boolean(cursor);
  }

  return allPages;
}

/**
 * @function extractCursor
 * @description Extracts cursor from next link
 * @param {string} nextLink - Next link URL
 * @returns {string|null} Cursor value
 */
function extractCursor(nextLink) {
  try {
    const url = new URL(nextLink, 'https://example.com');
    return url.searchParams.get('cursor');
  } catch {
    return null;
  }
}
