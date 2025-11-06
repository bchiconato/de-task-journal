/**
 * @fileoverview Centralized configuration module with schema validation for environment variables
 * @module config
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const Env = z.object({
  PORT: z.string().default('3001'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash-exp'),
  NOTION_API_KEY: z.string().optional(),
  NOTION_PAGE_ID: z.string().optional(),
  NOTION_PARENT_PAGE_ID: z.string().optional(),
  CONFLUENCE_DOMAIN: z.string().optional(),
  CONFLUENCE_USER_EMAIL: z.string().optional(),
  CONFLUENCE_API_TOKEN: z.string().optional(),
  NODE_ENV: z.string().default('development'),
});

/**
 * @description Validated environment configuration object. Warns if API keys are missing in dev mode.
 * @type {Object}
 * @property {string} PORT - Server port number
 * @property {string} GEMINI_API_KEY - Google Gemini API key
 * @property {string} NOTION_API_KEY - Notion integration token
 * @property {string} CONFLUENCE_DOMAIN - Confluence domain (e.g., mycompany.atlassian.net)
 * @property {string} CONFLUENCE_USER_EMAIL - Confluence user email
 * @property {string} CONFLUENCE_API_TOKEN - Confluence API token
 */
export const env = (() => {
  const parsed = Env.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.format());
    console.warn(
      '⚠️  Environment validation failed. Continuing with partial config for local development.',
    );
    return process.env;
  }

  const data = parsed.data;

  if (!data.GEMINI_API_KEY) {
    console.warn(
      '⚠️  GEMINI_API_KEY not set. Generate endpoint will return mock data.',
    );
  }

  if (!data.NOTION_API_KEY) {
    console.warn('⚠️  NOTION_API_KEY not set. Notion endpoint will fail.');
  }

  if (!data.CONFLUENCE_API_TOKEN) {
    console.warn(
      '⚠️  CONFLUENCE_API_TOKEN not set. Confluence endpoint will be unavailable.',
    );
  }

  return data;
})();

/**
 * @function getAvailablePlatforms
 * @description Returns which documentation platforms are configured and available
 * @returns {{notion: boolean, confluence: boolean}}
 * @example
 *   const platforms = getAvailablePlatforms();
 *   // { notion: true, confluence: false }
 */
export function getAvailablePlatforms() {
  return {
    notion: Boolean(env.NOTION_API_KEY),
    confluence: Boolean(
      env.CONFLUENCE_API_TOKEN &&
        env.CONFLUENCE_DOMAIN &&
        env.CONFLUENCE_USER_EMAIL,
    ),
  };
}
