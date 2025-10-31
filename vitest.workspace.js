/**
 * @fileoverview Vitest workspace configuration for monorepo
 */
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'server/vitest.config.js',
  'client/vitest.config.js',
]);
