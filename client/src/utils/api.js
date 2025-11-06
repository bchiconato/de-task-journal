/**
 * @fileoverview Client-side HTTP helpers for communicating with the documentation backend
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE ?? '/api';

/**
 * @async
 * @function generateDocumentation
 * @description Requests documentation generation from the backend (uses mock output when server lacks API key)
 * @param {Record<string, unknown>} data - Form data payload containing mode and inputs
 * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
 * @returns {Promise<string>} Generated markdown string
 * @throws {Error} When the request fails or the response is not ok
 */
export async function generateDocumentation(data, signal) {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    signal,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate documentation');
  }

  const result = await response.json();
  return result.documentation;
}

/**
 * @async
 * @function getAvailablePlatforms
 * @description Retrieves which platforms (Notion/Confluence) are configured
 * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
 * @returns {Promise<{notion: boolean, confluence: boolean}>} Available platforms
 * @throws {Error} When the request fails
 */
export async function getAvailablePlatforms(signal) {
  const response = await fetch(`${API_BASE_URL}/config`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch platform configuration');
  }

  const result = await response.json();
  return result.platforms || { notion: false, confluence: false };
}

/**
 * @async
 * @function getNotionPages
 * @description Retrieves all Notion pages shared with the integration token
 * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
 * @returns {Promise<Array<{id: string, title: string}>>} Array of pages with id and title
 * @throws {Error} When the request fails or response is malformed
 */
export async function getNotionPages(signal) {
  const response = await fetch(`${API_BASE_URL}/notion/pages`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
  });

  const text = await response.text().catch(() => '');
  let data;
  try {
    data = JSON.parse(text || '{}');
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message || data.error || 'Failed to fetch Notion pages',
    );
  }

  return data.pages || [];
}

/**
 * @async
 * @function getConfluencePages
 * @description Retrieves all accessible Confluence pages
 * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
 * @returns {Promise<Array<{id: string, title: string, spaceKey: string}>>} Array of pages
 * @throws {Error} When the request fails or response is malformed
 */
export async function getConfluencePages(signal) {
  const response = await fetch(`${API_BASE_URL}/confluence/pages`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
  });

  const text = await response.text().catch(() => '');
  let data;
  try {
    data = JSON.parse(text || '{}');
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message || data.error || 'Failed to fetch Confluence pages',
    );
  }

  return data.pages || [];
}

/**
 * @async
 * @function sendToNotion
 * @description Sends generated documentation to a Notion page via backend proxy
 * @param {string} content - Markdown documentation content
 * @param {'task'|'architecture'|'meeting'} mode - Selected documentation mode
 * @param {string} pageId - Target Notion page ID
 * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
 * @returns {Promise<Record<string, unknown>>} JSON response from backend
 * @throws {Error} When the request fails or response is not ok
 */
export async function sendToNotion(content, mode, pageId, signal) {
  const response = await fetch(`${API_BASE_URL}/notion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, mode, pageId }),
    signal,
  });

  const text = await response.text().catch(() => '');
  let data;
  try {
    data = JSON.parse(text || '{}');
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to send to Notion');
  }

  return data;
}

/**
 * @async
 * @function sendToConfluence
 * @description Sends generated documentation to a Confluence page via backend proxy
 * @param {string} content - Markdown documentation content
 * @param {'task'|'architecture'|'meeting'} mode - Selected documentation mode
 * @param {string} pageId - Target Confluence page ID
 * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
 * @returns {Promise<Record<string, unknown>>} JSON response from backend
 * @throws {Error} When the request fails or response is not ok
 */
export async function sendToConfluence(content, mode, pageId, signal) {
  const response = await fetch(`${API_BASE_URL}/confluence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, mode, pageId }),
    signal,
  });

  const text = await response.text().catch(() => '');
  let data;
  try {
    data = JSON.parse(text || '{}');
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message || data.error || 'Failed to send to Confluence',
    );
  }

  return data;
}
