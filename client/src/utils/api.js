const API_BASE_URL = import.meta.env.VITE_API_BASE ?? '/api';

/**
 * Generates documentation using Google Gemini (mocked locally if no API key)
 * @param {Object} data - The form data
 * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
 * @returns {Promise<string>} Generated documentation
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
 * Fetches list of Notion pages shared with the integration
 * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
 * @returns {Promise<Array<{id: string, title: string}>>} Array of pages with id and title
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
    throw new Error(data.message || data.error || 'Failed to fetch Notion pages');
  }

  return data.pages || [];
}

/**
 * Sends content to Notion
 * @param {string} content - The documentation content
 * @param {('task'|'architecture')} mode - Documentation mode
 * @param {string} pageId - Notion page ID to send content to
 * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
 * @returns {Promise<Object>} Response from Notion API
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
