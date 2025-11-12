/**
 * @fileoverview Confluence search API operations with server-side space filtering
 * @module services/confluence/search
 */

import { fetchWithRetry } from '../../lib/http.js';
import {
  getConfluenceUrl,
  getConfluenceHeaders,
  getConfluenceRestUrl,
} from './config.js';

const DEFAULT_PAGE_SIZE = 250;
const MAX_SEARCH_BATCH = 50;
const MAX_FALLBACK_REQUESTS = 20;

const escapeCqlValue = (value = '') =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const escapeLuceneTerm = (value = '') =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/([+"\-!(){}\[\]^~*?:/]|&&|\|\|)/g, '\\$1');

/**
 * @function buildTextSearchClause
 * @description Builds CQL text search clause with tiered matching: exact title, exact phrase, then tokens
 * @param {string} query - Search query
 * @returns {string} CQL clause for title search
 */
function buildTextSearchClause(query) {
  const trimmed = query.trim();
  if (!trimmed) return '';

  const escapedPhrase = escapeLuceneTerm(trimmed);

  const exactTitleClause = `title = "${escapedPhrase}"`;

  const exactPhraseClause = `title ~ "\\\"${escapedPhrase}\\\""`;

  const tokens = trimmed
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => escapeLuceneTerm(token));

  const tokenClauses =
    tokens.length > 1
      ? `(${tokens.map((token) => `title ~ "${token}"`).join(' AND ')})`
      : '';

  const fallbackClause = `title ~ "${escapedPhrase}"`;

  return [exactTitleClause, exactPhraseClause, tokenClauses, fallbackClause]
    .filter(Boolean)
    .join(' OR ');
}

/**
 * @function buildPageSearchCql
 * @description Builds CQL query for page search with space and text filters
 * @param {Object} params - Parameters
 * @param {string} [params.query] - Search query for title matching
 * @param {string} [params.spaceKey] - Space key to filter by
 * @returns {string} Complete CQL query string
 */
function buildPageSearchCql({ query, spaceKey }) {
  const clauses = ['type="page"'];

  if (spaceKey) {
    clauses.push(`space = "${escapeCqlValue(spaceKey)}"`);
  }

  if (query) {
    const textClause = buildTextSearchClause(query);
    if (textClause) {
      clauses.push(`(${textClause})`);
    }
  }

  return clauses.join(' AND ');
}

async function searchPagesViaCql({
  domain,
  email,
  token,
  searchQuery,
  cqlSpaceKey,
  limit,
}) {
  const pages = [];
  let cursor = null;
  const cql = buildPageSearchCql({
    query: searchQuery,
    spaceKey: cqlSpaceKey,
  });

  const contextPayload = {
    contentStatuses: ['current'],
  };
  if (cqlSpaceKey) {
    contextPayload.spaceKey = cqlSpaceKey;
  }
  const cqlContext = JSON.stringify(contextPayload);

  while (pages.length < limit) {
    const batchLimit = Math.min(MAX_SEARCH_BATCH, limit - pages.length);
    const params = new globalThis.URLSearchParams({
      cql,
      limit: batchLimit.toString(),
      expand: 'space',
    });

    if (cursor) {
      params.append('cursor', cursor);
    }

    params.append('cqlcontext', cqlContext);

    const url = getConfluenceRestUrl(
      domain,
      `/content/search?${params.toString()}`,
    );
    console.log(
      `[Confluence] CQL search request: cursor=${cursor ?? 'start'}, limit=${batchLimit}`,
    );

    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: getConfluenceHeaders(email, token),
      timeoutMs: 15000,
      attempts: 3,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to search pages: ${response.status} - ${
          errorData.message || errorData.error?.message || 'Unknown error'
        }`,
      );
    }

    const data = await response.json();
    const results = data.results || [];

    for (const result of results) {
      const content = result.content || result || {};
      if (!content || content.type !== 'page') continue;
      const pageId = content.id || content.uuid;
      if (!pageId) continue;

      pages.push({
        id: pageId,
        title: content.title || result.title || 'Untitled',
        spaceKey: content.space?.key || content.spaceKey || '',
      });

      if (pages.length >= limit) {
        break;
      }
    }

    cursor = data._links?.next ? extractCursor(data._links.next) : null;

    if (!cursor || results.length === 0) {
      break;
    }
  }

  return pages;
}

/**
 * @async
 * @function getSpaceIdFromKey
 * @description Converts space key to numeric space ID
 * @param {Object} params - Parameters
 * @param {string} params.domain - Confluence domain
 * @param {string} params.email - User email
 * @param {string} params.token - API token
 * @param {string} params.spaceKey - Space key (e.g., "DAI")
 * @returns {Promise<string>} Numeric space ID
 * @throws {Error} When space is not found or not accessible
 */
async function getSpaceIdFromKey({ domain, email, token, spaceKey }) {
  const url = getConfluenceUrl(domain, `/spaces?keys=${spaceKey}`);

  console.log(`[Confluence] Looking up space ID for key: ${spaceKey}`);

  const response = await fetchWithRetry(url, {
    method: 'GET',
    headers: getConfluenceHeaders(email, token),
    timeoutMs: 10000,
    attempts: 3,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`[Confluence] Failed to fetch space ${spaceKey}:`, errorData);
    throw new Error(
      `Space ${spaceKey} not found or not accessible: ${response.status}`,
    );
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`Space ${spaceKey} not found in results`);
  }

  const space = data.results[0];
  console.log(`[Confluence] Found space: ${space.name} (ID: ${space.id})`);

  return space.id;
}

async function getSpaceKeyFromId({ domain, email, token, spaceId }) {
  const url = getConfluenceUrl(domain, `/spaces/${spaceId}`);

  const response = await fetchWithRetry(url, {
    method: 'GET',
    headers: getConfluenceHeaders(email, token),
    timeoutMs: 10000,
    attempts: 3,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Space ${spaceId} not accessible: ${response.status} - ${
        errorData.message || 'Unknown error'
      }`,
    );
  }

  const data = await response.json();
  return data.key;
}

/**
 * @async
 * @function searchConfluencePages
 * @description Searches Confluence pages with server-side space filtering
 * @param {Object} params - Parameters
 * @param {string} params.domain - Confluence domain
 * @param {string} params.email - User email
 * @param {string} params.token - API token
 * @param {string} [params.searchQuery=''] - Search query to filter by title
 * @param {string} [params.spaceKey=''] - Space key to filter by (e.g., "DAI")
 * @param {number} [params.limit=50] - Maximum number of results to return
 * @returns {Promise<Array<{id: string, title: string, spaceKey: string}>>} Array of pages
 * @throws {Error} When API request fails
 */
export async function searchConfluencePages({
  domain,
  email,
  token,
  searchQuery = '',
  spaceKey = '',
  limit = 50,
}) {
  if (!domain || !email || !token) {
    throw new Error('Confluence credentials are required');
  }

  console.log(`[Confluence] Search parameters:`, {
    searchQuery,
    spaceKey,
    limit,
  });

  const normalizedSpaceKey = String(spaceKey || '').trim();
  let cqlSpaceKey = normalizedSpaceKey;
  let spaceIdFilter = null;
  if (normalizedSpaceKey) {
    const isNumericSpaceId = /^\d+$/.test(normalizedSpaceKey);

    if (isNumericSpaceId) {
      spaceIdFilter = normalizedSpaceKey;
      console.log(
        `[Confluence] Using supplied numeric space ID without lookup: ${spaceIdFilter}`,
      );
      try {
        cqlSpaceKey = await getSpaceKeyFromId({
          domain,
          email,
          token,
          spaceId: normalizedSpaceKey,
        });
        console.log(
          `[Confluence] Resolved space key ${cqlSpaceKey} from id ${spaceIdFilter}`,
        );
      } catch (error) {
        console.error(
          `[Confluence] Unable to resolve space key from id ${spaceIdFilter}:`,
          error.message,
        );
        cqlSpaceKey = '';
      }
    } else {
      try {
        spaceIdFilter = await getSpaceIdFromKey({
          domain,
          email,
          token,
          spaceKey: normalizedSpaceKey,
        });
        console.log(
          `[Confluence] Using server-side space filter: ${spaceIdFilter}`,
        );
      } catch (error) {
        console.error(`[Confluence] Space lookup failed:`, error.message);
        console.log(`[Confluence] Proceeding without space filter`);
      }
    }
  }

  const trimmedQuery = (searchQuery || '').trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const pages = [];
  let cursor = null;
  let hasMore = true;
  const pageSize = DEFAULT_PAGE_SIZE;
  let requestCount = 0;
  let totalPagesChecked = 0;

  try {
    console.log(
      '[Confluence] Using CQL search',
      trimmedQuery ? `for query "${trimmedQuery}"` : '(no query provided)',
    );

    const cqlResults = await searchPagesViaCql({
      domain,
      email,
      token,
      searchQuery: trimmedQuery,
      cqlSpaceKey,
      limit,
    });

    console.log(
      `[Confluence] CQL search returned ${cqlResults.length} pages (limit ${limit})`,
    );

    return cqlResults.slice(0, limit);
  } catch (error) {
    console.error(
      '[Confluence] CQL search failed, falling back to page listing:',
      error.message,
    );
  }

  while (
    hasMore &&
    pages.length < limit &&
    requestCount < MAX_FALLBACK_REQUESTS
  ) {
    let apiUrl = `/pages?limit=${pageSize}`;

    if (spaceIdFilter) {
      apiUrl += `&space-id=${spaceIdFilter}`;
    }

    if (cursor) {
      apiUrl += `&cursor=${cursor}`;
    }

    const url = getConfluenceUrl(domain, apiUrl);

    requestCount++;
    console.log(
      `[Confluence] Request #${requestCount}: ${apiUrl.substring(0, 100)}...`,
    );

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
    const batchSize = data.results?.length || 0;
    totalPagesChecked += batchSize;

    console.log(
      `[Confluence] Received ${batchSize} pages (total checked: ${totalPagesChecked})`,
    );

    for (const page of data.results || []) {
      const pageTitle = (page.title || 'Untitled').toLowerCase();

      const titleMatch =
        !normalizedQuery || pageTitle.includes(normalizedQuery);

      if (titleMatch) {
        pages.push({
          id: page.id,
          title: page.title || 'Untitled',
          spaceKey: page.spaceId || '',
        });

        if (pages.length >= limit) {
          console.log(`[Confluence] Reached limit of ${limit} pages`);
          break;
        }
      }
    }

    cursor = data._links?.next ? extractCursor(data._links.next) : null;
    hasMore = Boolean(cursor) && pages.length < limit;
  }

  if (requestCount >= MAX_FALLBACK_REQUESTS && pages.length < limit) {
    console.warn(
      `[Confluence] Fallback search aborted after ${requestCount} requests (checked ${totalPagesChecked} pages)`,
    );
  } else {
    console.log(
      `[Confluence] Search complete: ${pages.length} pages matched (${requestCount} requests, ${totalPagesChecked} pages checked)`,
    );
  }

  return pages;
}

/**
 * @async
 * @function listConfluenceSpaces
 * @description Lists all accessible Confluence spaces
 * @param {Object} params - Parameters
 * @param {string} params.domain - Confluence domain
 * @param {string} params.email - User email
 * @param {string} params.token - API token
 * @returns {Promise<Array<{key: string, name: string, id: string}>>} Array of spaces
 * @throws {Error} When API request fails
 */
export async function listConfluenceSpaces({ domain, email, token }) {
  if (!domain || !email || !token) {
    throw new Error('Confluence credentials are required');
  }

  const spaces = [];
  let cursor = null;
  let hasMore = true;
  const pageSize = 250;

  while (hasMore) {
    const url = cursor
      ? getConfluenceUrl(domain, `/spaces?limit=${pageSize}&cursor=${cursor}`)
      : getConfluenceUrl(domain, `/spaces?limit=${pageSize}`);

    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: getConfluenceHeaders(email, token),
      timeoutMs: 10000,
      attempts: 3,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to list spaces: ${response.status} - ${errorData.message || 'Unknown error'}`,
      );
    }

    const data = await response.json();

    for (const space of data.results || []) {
      spaces.push({
        key: space.key,
        name: space.name,
        id: space.id,
      });
    }

    cursor = data._links?.next ? extractCursor(data._links.next) : null;
    hasMore = Boolean(cursor);
  }

  return spaces;
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
