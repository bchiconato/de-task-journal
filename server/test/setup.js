/**
 * @fileoverview Vitest setup file for server tests - configures global mocks
 */

import { afterEach, vi } from 'vitest';

const okJson = (data) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  });

global.fetch = vi.fn(() => okJson({}));

afterEach(() => {
  vi.clearAllMocks();
});
