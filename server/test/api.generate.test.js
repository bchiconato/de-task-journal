/**
 * @fileoverview API integration tests for POST /api/generate endpoint
 */

import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('POST /api/generate', () => {
  it('returns 400 on empty payload', async () => {
    const response = await request(app).post('/api/generate').send({});

    expect(response.status).toBe(400);
  });

  it('returns 400 when context is too short', async () => {
    const response = await request(app).post('/api/generate').send({
      context: 'short',
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('returns 400 when context is missing', async () => {
    const response = await request(app).post('/api/generate').send({
      code: 'console.log("test")',
    });

    expect(response.status).toBe(400);
  });

  it('returns 200 on valid payload with mocked Gemini response', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: '# Summary\n\nGenerated documentation.' }],
              },
            },
          ],
        }),
        headers: new Headers(),
      }),
    );

    const response = await request(app).post('/api/generate').send({
      context: 'This is a valid context with enough characters.',
      code: 'console.log("hello")',
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('documentation');
    expect(response.body.documentation).toContain('Summary');
  });

  it('handles Gemini API errors gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers(),
      }),
    );

    const response = await request(app).post('/api/generate').send({
      context: 'Valid context for testing error handling.',
    });

    expect(response.status).toBe(500);
  });
});
