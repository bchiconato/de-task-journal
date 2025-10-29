/**
 * @fileoverview Tests for fetchWithRetry: timeout, backoff, and Retry-After handling
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fetchWithRetry } from '../src/lib/http.js';

const mkRes = (init = {}) =>
  new Response(init.body ?? '', {
    status: init.status ?? 200,
    headers: init.headers,
  });

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns immediately on successful 200 response', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(mkRes({ status: 200, body: 'OK' }))
    );

    const res = await fetchWithRetry('http://test.example', {
      attempts: 3,
      timeoutMs: 2000,
    });

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('respects Retry-After header on 429 response', async () => {
    const calls = [];
    global.fetch = vi
      .fn()
      .mockImplementationOnce(() => {
        calls.push(Date.now());
        return Promise.resolve(
          mkRes({
            status: 429,
            headers: new Headers({ 'retry-after': '0' }),
          })
        );
      })
      .mockImplementationOnce(() => {
        calls.push(Date.now());
        return Promise.resolve(mkRes({ status: 200 }));
      });

    const res = await fetchWithRetry('http://test.example', {
      attempts: 2,
      timeoutMs: 2000,
    });

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('retries on 500 server errors', async () => {
    global.fetch = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve(mkRes({ status: 500, body: 'Error' }))
      )
      .mockImplementationOnce(() =>
        Promise.resolve(mkRes({ status: 200, body: 'OK' }))
      );

    const res = await fetchWithRetry('http://test.example', {
      attempts: 2,
      timeoutMs: 2000,
      baseDelayMs: 10,
    });

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws upstream_unavailable after all retries exhausted', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(mkRes({ status: 503, body: 'Service Unavailable' }))
    );

    await expect(
      fetchWithRetry('http://test.example', {
        attempts: 2,
        timeoutMs: 2000,
        baseDelayMs: 10,
      })
    ).rejects.toMatchObject({
      code: 'upstream_unavailable',
      status: 502,
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it(
    'handles timeout errors and retries before failing',
    async () => {
      global.fetch = vi.fn(() => new Promise(() => {}));

      await expect(
        fetchWithRetry('http://test.example', {
          attempts: 2,
          timeoutMs: 50,
          baseDelayMs: 10,
        })
      ).rejects.toMatchObject({
        code: 'upstream_unavailable',
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    },
    10000
  );

  it('uses exponential backoff with jitter when no Retry-After header', async () => {
    const calls = [];
    global.fetch = vi
      .fn()
      .mockImplementationOnce(() => {
        calls.push(Date.now());
        return Promise.resolve(mkRes({ status: 503 }));
      })
      .mockImplementationOnce(() => {
        calls.push(Date.now());
        return Promise.resolve(mkRes({ status: 503 }));
      })
      .mockImplementationOnce(() => {
        calls.push(Date.now());
        return Promise.resolve(mkRes({ status: 200 }));
      });

    const res = await fetchWithRetry('http://test.example', {
      attempts: 3,
      timeoutMs: 2000,
      baseDelayMs: 50,
      maxDelayMs: 200,
    });

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(calls[1] - calls[0]).toBeGreaterThanOrEqual(50);
    expect(calls[2] - calls[1]).toBeGreaterThanOrEqual(50);
  });

  it('allows custom retryOn function', async () => {
    global.fetch = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve(mkRes({ status: 400, body: 'Bad Request' }))
      )
      .mockImplementationOnce(() =>
        Promise.resolve(mkRes({ status: 200, body: 'OK' }))
      );

    const res = await fetchWithRetry('http://test.example', {
      attempts: 2,
      timeoutMs: 2000,
      baseDelayMs: 10,
      retryOn: (res) => res.status === 400,
    });

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 2xx success responses', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(mkRes({ status: 201, body: 'Created' }))
    );

    const res = await fetchWithRetry('http://test.example', {
      attempts: 3,
      timeoutMs: 2000,
    });

    expect(res.status).toBe(201);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 4xx client errors (except 429)', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(mkRes({ status: 404, body: 'Not Found' }))
    );

    const res = await fetchWithRetry('http://test.example', {
      attempts: 3,
      timeoutMs: 2000,
    });

    expect(res.status).toBe(404);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
