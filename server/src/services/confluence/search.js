/**
 * @fileoverview Confluence search API operations
 * @module services/confluence/search
 */

import { fetchWithRetry } from '../../lib/http.js';
import { getConfluenceUrl, getConfluenceHeaders } from './config.js';

/**
 * @async
 * @function searchConfluencePages
 * @description Searches Confluence pages by title with pagination and limit
 * @param {Object} params - Parameters
 * @param {string} params.domain - Confluence domain
 * @param {string} params.email - User email
 * @param {string} params.token - API token
 * @param {string} [params.searchQuery=''] - Search query to filter by title
 * @param {number} [params.limit=50] - Maximum number of results to return
 * @returns {Promise<Array<{id: string, title: string, spaceKey: string}>>} Array of pages
 * @throws {Error} When API request fails
 */
export async function searchConfluencePages({
  domain,
  email,
  token,
  searchQuery = '',
  limit = 50,
}) {
  if (!domain || !email || !token) {
    throw new Error('Confluence credentials are required');
  }

  const normalizedQuery = searchQuery.toLowerCase().trim();
  const pages = [];
  let cursor = null;
  let hasMore = true;
  const pageSize = 250;

  while (hasMore && pages.length < limit) {
    const url = cursor
      ? getConfluenceUrl(domain, `/pages?limit=${pageSize}&cursor=${cursor}`)
      : getConfluenceUrl(domain, `/pages?limit=${pageSize}`);

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
      const pageTitle = (page.title || 'Untitled').toLowerCase();

      if (!normalizedQuery || pageTitle.includes(normalizedQuery)) {
        pages.push({
          id: page.id,
          title: page.title || 'Untitled',
          spaceKey: page.spaceId || '',
        });

        if (pages.length >= limit) {
          break;
        }
      }
    }

    cursor = data._links?.next ? extractCursor(data._links.next) : null;
    hasMore = Boolean(cursor);
  }

  return pages;
}

/**
 * @async
 * @function listConfluencePages
 * @description Lists all accessible Confluence pages (legacy - use searchConfluencePages instead)
 * @deprecated Use searchConfluencePages with limit parameter
 * @param {Object} params - Parameters
 * @param {string} params.domain - Confluence domain
 * @param {string} params.email - User email
 * @param {string} params.token - API token
 * @returns {Promise<Array<{id: string, title: string, spaceKey: string}>>} Array of pages
 * @throws {Error} When API request fails
 */
export async function listConfluencePages({ domain, email, token }) {
  return searchConfluencePages({
    domain,
    email,
    token,
    searchQuery: '',
    limit: 50,
  });
}

/**
 * @function extractCursor
 * @description Extracts cursor from next link
 * @param {string} nextLink - Next link URL
 * @returns {string|null} Cursor value
 */
function extractCursor(nextLink) {
  try {
    const url = new globalThis.URL(nextLink, 'https://example.com');
    return url.searchParams.get('cursor');
  } catch {
    return null;
  }
}
