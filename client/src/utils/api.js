const API_BASE_URL = import.meta.env.VITE_API_BASE ?? '/api';
const DEFAULT_NOTION_PAGE_ID = import.meta.env.VITE_NOTION_PAGE_ID;

/**
 * Generates documentation using Claude AI
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
 * Sends content to Notion
 * @param {string} content - The documentation content
 * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
 * @returns {Promise<Object>} Response from Notion API
 */
export async function sendToNotion(content, signal, opts = {}) {
  if (!DEFAULT_NOTION_PAGE_ID) {
    throw new Error('Set VITE_NOTION_PAGE_ID in client/.env');
  }
  const response = await fetch(`${API_BASE_URL}/notion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, pageId: DEFAULT_NOTION_PAGE_ID }),
    signal,
  });

  const text = await response.text().catch(() => '');
  let data; try { data = JSON.parse(text || '{}'); } catch { data = {}; }
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to send to Notion');
  }
  
  return data;
}
