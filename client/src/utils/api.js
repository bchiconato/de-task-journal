const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';

/**
 * Generates documentation using Claude AI
 * @param {Object} data - The form data
 * @returns {Promise<string>} Generated documentation
 */
export async function generateDocumentation(data) {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
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
 * @returns {Promise<Object>} Response from Notion API
 */
export async function sendToNotion(content) {
  const response = await fetch(`${API_BASE_URL}/notion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send to Notion');
  }

  return await response.json();
}
