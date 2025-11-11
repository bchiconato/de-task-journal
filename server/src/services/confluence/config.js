/**
 * @fileoverview Confluence API configuration constants
 * @module services/confluence/config
 */

export const CONFLUENCE = {
  version: 'v2',
  basePath: '/wiki/api/v2',
  restBasePath: '/wiki/rest/api',
};

export const CONFLUENCE_LIMITS = {
  MAX_PAGE_SIZE: 250,
  MAX_CONTENT_LENGTH: 100000,
};

/**
 * @function getConfluenceHeaders
 * @description Generates headers for Confluence API requests
 * @param {string} email - User email
 * @param {string} token - API token
 * @returns {Object} Headers object
 */
export function getConfluenceHeaders(email, token) {
  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  return {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/**
 * @function getConfluenceUrl
 * @description Constructs full Confluence API URL
 * @param {string} domain - Confluence domain (e.g., mycompany.atlassian.net)
 * @param {string} path - API endpoint path
 * @returns {string} Full URL
 */
export function getConfluenceUrl(domain, path) {
  return `https://${domain}${CONFLUENCE.basePath}${path}`;
}

/**
 * @function getConfluenceRestUrl
 * @description Constructs full Confluence REST API v1 URL
 * @param {string} domain - Confluence domain
 * @param {string} path - REST API endpoint path
 * @returns {string} Full REST API URL
 */
export function getConfluenceRestUrl(domain, path) {
  return `https://${domain}${CONFLUENCE.restBasePath}${path}`;
}
