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
  NODE_ENV: z.string().default('development'),
});

/**
 * @description Validated environment configuration object. Warns if API keys are missing in dev mode.
 * @type {Object}
 * @property {string} PORT - Server port number
 * @property {string} GEMINI_API_KEY - Google Gemini API key
 * @property {string} NOTION_TOKEN - Notion integration token
 */
export const env = (() => {
  const parsed = Env.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.format());
    console.warn('⚠️  Environment validation failed. Continuing with partial config for local development.');
    return process.env;
  }

  const data = parsed.data;

  if (!data.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set. Generate endpoint will return mock data.');
  }

  if (!data.NOTION_API_KEY) {
    console.warn('⚠️  NOTION_API_KEY not set. Notion endpoint will fail.');
  }

  return data;
})();
