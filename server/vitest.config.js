/**
 * @fileoverview Vitest configuration for server tests
 */

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,
  test: {
    globals: true,
    environment: 'node',
    pool: 'threads',
    setupFiles: ['test/setup.js'],
    env: {
      GEMINI_API_KEY: 'test-gemini-key',
      NOTION_API_KEY: 'test-notion-key',
      NOTION_PAGE_ID: 'test-page-id',
      PORT: '3001',
    },
  },
});
