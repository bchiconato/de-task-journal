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
 * @constant {number} MAX_TEXT_LENGTH
 * @description Maximum characters allowed per rich_text content field
 */
export const MAX_TEXT_LENGTH = 2000;

/**
 * @constant {number} MAX_ARRAY_ITEMS
 * @description Maximum items allowed in rich_text or block arrays
 */
export const MAX_ARRAY_ITEMS = 100;

/**
 * @constant {number} MAX_BLOCK_ELEMENTS
 * @description Maximum total block elements per request
 */
export const MAX_BLOCK_ELEMENTS = 1000;

/**
 * @constant {number} MAX_PAYLOAD_BYTES
 * @description Approximate maximum payload size in bytes (500KB)
 */
export const MAX_PAYLOAD_BYTES = 500 * 1024;

/**
 * @constant {number} MAX_NESTING_LEVELS
 * @description Maximum nesting levels allowed per request
 */
export const MAX_NESTING_LEVELS = 2;

/**
 * @constant {number} RPS_THROTTLE_MS
 * @description Throttle delay in milliseconds to maintain ~3 req/s average
 */
export const RPS_THROTTLE_MS = 350;

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
