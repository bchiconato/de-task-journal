/**
 * @fileoverview Confluence API client operations
 * @module services/confluence/client
 */

import { fetchWithRetry } from '../../lib/http.js';
import {
  getConfluenceUrl,
  getConfluenceHeaders,
  CONFLUENCE_LIMITS,
} from './config.js';

/**
 * @async
 * @function appendToConfluencePage
 * @description Appends content to a Confluence page
 * @param {Object} params - Parameters
 * @param {string} params.domain - Confluence domain
 * @param {string} params.email - User email
 * @param {string} params.token - API token
 * @param {string} params.pageId - Target page ID
 * @param {string} params.content - Content in Confluence Storage Format
 * @returns {Promise<Object>} Response with success status
 * @throws {Error} When API request fails
 */
export async function appendToConfluencePage({
  domain,
  email,
  token,
  pageId,
  content,
}) {
  const pageUrl = getConfluenceUrl(domain, `/pages/${pageId}`);

  const pageResponse = await fetchWithRetry(pageUrl, {
    method: 'GET',
    headers: getConfluenceHeaders(email, token),
  });

  if (!pageResponse.ok) {
    const errorData = await pageResponse.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch page: ${errorData.message || pageResponse.status}`,
    );
  }

  const pageData = await pageResponse.json();
  const currentVersion = pageData.version.number;
  const currentBody = pageData.body?.storage?.value || '';

  const newBody = currentBody + '\n' + content;

  const updateUrl = getConfluenceUrl(domain, `/pages/${pageId}`);
  const updateResponse = await fetchWithRetry(updateUrl, {
    method: 'PUT',
    headers: getConfluenceHeaders(email, token),
    body: JSON.stringify({
      id: pageId,
      status: 'current',
      title: pageData.title,
      body: {
        representation: 'storage',
        value: newBody,
      },
      version: {
        number: currentVersion + 1,
      },
    }),
  });

  if (!updateResponse.ok) {
    const errorData = await updateResponse.json().catch(() => ({}));
    throw new Error(
      `Failed to update page: ${errorData.message || updateResponse.status}`,
    );
  }

  return {
    success: true,
    pageId,
    version: currentVersion + 1,
  };
}

/**
 * @async
 * @function checkConfluencePageAccess
 * @description Checks if the integration has access to a page
 * @param {Object} params - Parameters
 * @param {string} params.domain - Confluence domain
 * @param {string} params.email - User email
 * @param {string} params.token - API token
 * @param {string} params.pageId - Page ID to check
 * @returns {Promise<boolean>} True if accessible
 */
export async function checkConfluencePageAccess({
  domain,
  email,
  token,
  pageId,
}) {
  try {
    const url = getConfluenceUrl(domain, `/pages/${pageId}`);
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: getConfluenceHeaders(email, token),
    });
    return response.ok;
  } catch {
    return false;
  }
}
