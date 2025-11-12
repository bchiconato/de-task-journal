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
 * @param {Object} [options] - Combined fetch options and retry configuration
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
    ...fetchOptions
  } = options;

  let lastErr;
  let lastResponse;
  let lastResponseBody;

  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(
        `[fetchWithRetry] Attempt ${i + 1}/${attempts} - Request timeout after ${timeoutMs}ms`,
      );
      controller.abort();
    }, timeoutMs);

    try {
      console.log(
        `[fetchWithRetry] Attempt ${i + 1}/${attempts} - Starting request (timeout: ${timeoutMs}ms)`,
      );

      const res = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(
        `[fetchWithRetry] Attempt ${i + 1}/${attempts} - Response received (status: ${res.status})`,
      );

      if (!retryOn(res)) {
        console.log(
          `[fetchWithRetry] Attempt ${i + 1}/${attempts} - Success, returning response`,
        );
        return res;
      }

      console.log(
        `[fetchWithRetry] Attempt ${i + 1}/${attempts} - Response status ${res.status} triggers retry`,
      );
      lastResponse = res.clone();

      try {
        lastResponseBody = await res.json();
        console.log(
          `[fetchWithRetry] Response body:`,
          JSON.stringify(lastResponseBody, null, 2),
        );
      } catch (e) {
        console.log(`[fetchWithRetry] Could not parse response body as JSON`);
      }

      if (i < attempts - 1) {
        let delay;

        if (res.status === 429) {
          const ra = res.headers.get('retry-after');
          if (ra) {
            const parsed = Number.parseInt(ra, 10);
            delay = isNaN(parsed) ? 60000 : parsed * 1000;
            console.log(
              `[fetchWithRetry] Rate limited (429). Retry-After header: ${ra}s. Waiting ${delay}ms`,
            );
          } else {
            delay = 60000;
            console.log(
              `[fetchWithRetry] Rate limited (429). No Retry-After header. Waiting ${delay}ms (60s)`,
            );
          }
        } else {
          const exp = Math.pow(2, i) * baseDelayMs;
          const jitter = Math.random() * exp;
          delay = clamp(jitter, baseDelayMs, maxDelayMs);
          console.log(
            `[fetchWithRetry] Waiting ${Math.round(delay)}ms before retry`,
          );
        }

        await sleep(delay);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      lastErr = err;

      const errorName = err.name || 'Unknown';
      const errorMsg = err.message || 'No message';

      console.error(
        `[fetchWithRetry] Attempt ${i + 1}/${attempts} - Error caught:`,
        {
          name: errorName,
          message: errorMsg,
          code: err.code,
          cause: err.cause,
        },
      );

      if (err.name === 'AbortError') {
        console.error(
          `[fetchWithRetry] Request aborted after ${timeoutMs}ms timeout`,
        );
      }

      if (i < attempts - 1) {
        const exp = Math.pow(2, i) * baseDelayMs;
        const jitter = Math.random() * exp;
        const delay = clamp(jitter, baseDelayMs, maxDelayMs);
        console.log(
          `[fetchWithRetry] Waiting ${Math.round(delay)}ms before retry after error`,
        );
        await sleep(delay);
      }
    }
  }

  console.error(
    `[fetchWithRetry] All ${attempts} attempts exhausted. Last error:`,
    lastErr,
  );
  console.error(`[fetchWithRetry] Last response status:`, lastResponse?.status);

  if (lastResponse?.status === 429) {
    let errorMessage = 'Rate limit exceeded. ';
    let retrySeconds = null;

    if (lastResponseBody?.error) {
      const geminiError = lastResponseBody.error;
      const originalMessage = geminiError.message || '';

      const retryMatch = originalMessage.match(/retry in ([\d.]+)s/);
      if (retryMatch) {
        retrySeconds = Math.ceil(parseFloat(retryMatch[1]));
      }

      if (
        originalMessage.includes('quota') ||
        originalMessage.includes('RESOURCE_EXHAUSTED')
      ) {
        errorMessage = `API quota exhausted. `;

        if (retrySeconds) {
          errorMessage += `Please wait ${retrySeconds} seconds and try again. `;
        } else {
          errorMessage += `Please wait and try again later. `;
        }

        if (originalMessage.includes('free_tier')) {
          errorMessage += `\n\nYour free tier quota has been exceeded. Options:\n`;
          errorMessage += `1. Wait for quota reset (check https://ai.dev/usage?tab=rate-limit)\n`;
          errorMessage += `2. Reduce input size significantly (try 5,000 chars max instead of 20,000)\n`;
          errorMessage += `3. Upgrade to a paid plan for higher limits\n`;
          errorMessage += `4. Use a different API key if available`;
        } else {
          errorMessage += `\n\nCheck your usage: https://ai.dev/usage?tab=rate-limit`;
        }
      } else {
        errorMessage += originalMessage;
      }
    } else {
      errorMessage += 'Please wait at least 60 seconds before trying again.';
    }

    const e = new Error(errorMessage);
    e.code = 'rate_limit_exceeded';
    e.status = 429;
    e.cause = lastErr;
    e.retryAfterSeconds = retrySeconds;
    e.details = lastResponseBody;
    throw e;
  }

  const e = new Error('Upstream request failed after retries');
  e.code = 'upstream_unavailable';
  e.status = 502;
  e.cause = lastErr;
  e.lastResponse = lastResponse;
  throw e;
}
