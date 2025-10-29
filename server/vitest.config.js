/**
 * @fileoverview Vitest configuration for server tests
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      GEMINI_API_KEY: 'test-gemini-key',
      NOTION_API_KEY: 'test-notion-key',
      NOTION_PAGE_ID: 'test-page-id',
      PORT: '3001',
    },
  },
});
