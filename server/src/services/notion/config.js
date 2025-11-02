/**
 * @fileoverview Centralized Notion API configuration and constants
 * @module services/notion/config
 */

/**
 * @constant {Object} NOTION
 * @description Notion API base configuration
 * @property {string} base - Base URL for Notion API v1
 * @property {string} version - Notion API version (pinned, upgrade deliberately)
 */
export const NOTION = {
  base: 'https://api.notion.com/v1',
  version: '2022-06-28',
};

/**
 * @constant {number} MAX_BLOCKS_PER_REQUEST
 * @description Maximum number of blocks allowed per Notion API request
 */
export const MAX_BLOCKS_PER_REQUEST = 100;

/**
 * @function defaultHeaders
 * @description Generates default headers for Notion API requests
 * @param {string} token - Notion API authentication token
 * @returns {Object} Headers object with Authorization, Content-Type, and Notion-Version
 * @example
 *   const headers = defaultHeaders(process.env.NOTION_API_KEY);
 *   // { Authorization: 'Bearer xxx', 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' }
 */
export function defaultHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION.version,
  };
}
