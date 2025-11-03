/**
 * @fileoverview Vitest configuration for client tests
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'threads',
    setupFiles: ['test/setup.js'],
  },
});
