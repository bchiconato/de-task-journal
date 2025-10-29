/**
 * @fileoverview Robust HTTP client with timeout, retry, and exponential backoff
 * @module lib/http
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/**
 * @async
 * @function fetchWithRetry
 * @description Fetch wrapper with configurable timeout, retry logic, and exponential backoff
 * @param {string} url - URL to fetch
 * @param {Object} [options] - Fetch options with additional retry configuration
 * @param {number} [options.timeoutMs=12000] - Request timeout in milliseconds
 * @param {number} [options.attempts=3] - Maximum number of retry attempts
 * @param {number} [options.baseDelayMs=400] - Base delay for exponential backoff
 * @param {number} [options.maxDelayMs=4000] - Maximum delay between retries
 * @param {Function} [options.retryOn] - Function to determine if response should trigger retry
 * @returns {Promise<Response>} Fetch response object
 * @throws {Error} When all retry attempts are exhausted
 * @example
 *   const res = await fetchWithRetry('https://api.example.com', {
 *     method: 'POST',
 *     timeoutMs: 10000,
 *     attempts: 5
 *   });
 */
export async function fetchWithRetry(url, options = {}) {
  const {
    timeoutMs = 12000,
    attempts = 3,
    baseDelayMs = 400,
    maxDelayMs = 4000,
    retryOn = (res) => res.status >= 500 || res.status === 429,
  } = options;

  let lastErr;
  for (let i = 0; i < attempts; i++) {
    const controller = AbortSignal.timeout(timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller });
      if (!retryOn(res)) return res;

      const ra = res.headers.get('retry-after');
      if (ra) {
        const wait = Number.parseInt(ra, 10) * 1000 || 0;
        if (wait > 0) await sleep(wait);
      } else {
        const exp = Math.pow(2, i) * baseDelayMs;
        const jitter = Math.random() * exp;
        await sleep(clamp(jitter, baseDelayMs, maxDelayMs));
      }
    } catch (err) {
      lastErr = err;
      const exp = Math.pow(2, i) * baseDelayMs;
      const jitter = Math.random() * exp;
      await sleep(clamp(jitter, baseDelayMs, maxDelayMs));
    }
  }
  const e = new Error('Upstream request failed after retries');
  e.code = 'upstream_unavailable';
  e.status = 502;
  e.cause = lastErr;
  throw e;
}
