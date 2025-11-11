/**
 * @fileoverview Centralized configuration module with schema validation for environment variables
 * @module config
 */

import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash-exp'),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),
  NOTION_API_KEY: z.string().optional(),
  CONFLUENCE_DOMAIN: z.string().optional(),
  CONFLUENCE_USER_EMAIL: z.string().optional(),
  CONFLUENCE_API_TOKEN: z.string().optional(),
  PORT: z.string().default('3001'),
  NODE_ENV: z.string().default('development'),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('Environment variable validation failed:');
  console.error(parseResult.error.format());
}

const rawEnv = parseResult.success ? parseResult.data : envSchema.parse({});

export const env = {
  ...rawEnv,
  PORT: parseInt(rawEnv.PORT, 10),
};

/**
 * @function getAvailablePlatforms
 * @description Checks which documentation platforms are configured
 * @returns {{notion: boolean, confluence: boolean}}
 */
export function getAvailablePlatforms() {
  const hasNotion = !!env.NOTION_API_KEY;
  
  const hasConfluence =
    !!env.CONFLUENCE_DOMAIN &&
    !!env.CONFLUENCE_USER_EMAIL &&
    !!env.CONFLUENCE_API_TOKEN;

  return {
    notion: hasNotion,
    confluence: hasConfluence,
  };
}

if (!env.GROQ_API_KEY && !env.GEMINI_API_KEY) {
  console.warn('[Config] WARNING: No LLM provider configured! Set GROQ_API_KEY or GEMINI_API_KEY');
}

if (env.GROQ_API_KEY) {
  console.log(`[Config] Groq API configured (model: ${env.GROQ_MODEL})`);
}

if (env.GEMINI_API_KEY) {
  console.log(`[Config] Gemini API configured (model: ${env.GEMINI_MODEL})`);
}

const platforms = getAvailablePlatforms();
if (platforms.notion) {
  console.log('[Config] Notion integration enabled');
}
if (platforms.confluence) {
  console.log('[Config] Confluence integration enabled');
}
if (!platforms.notion && !platforms.confluence) {
  console.warn('[Config] WARNING: No documentation platform configured! Set Notion or Confluence credentials');
}