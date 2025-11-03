/**
 * @fileoverview MSW (Mock Service Worker) setup for client tests
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer(
  http.post('/api/generate', () => {
    return HttpResponse.json({
      documentation: '# Test Documentation\n\nThis is mock documentation.',
    });
  }),

  http.post('/api/notion', () => {
    return HttpResponse.json({
      success: true,
      mode: 'append',
      pageId: 'mock-page-id',
      blocksAdded: 10,
      chunks: 1,
    });
  }),

  http.get('https://example.com/api', () => {
    return HttpResponse.json({ ok: true });
  }),
);
