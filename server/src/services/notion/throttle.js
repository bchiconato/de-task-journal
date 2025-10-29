/**
 * @fileoverview Simple throttling mechanism for Notion API rate limiting (~3 req/s)
 * @module services/notion/throttle
 */

import { RPS_THROTTLE_MS } from './config.js';

/**
 * @description Last request timestamp for throttle calculation
 * @type {number}
 */
let lastRequestTime = 0;

/**
 * @async
 * @function throttle
 * @description Throttles requests to maintain ~3 req/s average using token bucket approach
 * @returns {Promise<void>} Resolves after any necessary delay
 * @example
 *   await throttle();
 *   await fetch(...); // Will respect rate limit
 */
export async function throttle() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  const waitTime = Math.max(0, RPS_THROTTLE_MS - elapsed);

  if (waitTime > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

/**
 * @function resetThrottle
 * @description Resets throttle state (useful for testing)
 * @returns {void}
 * @example
 *   resetThrottle(); // Clears throttle state
 */
export function resetThrottle() {
  lastRequestTime = 0;
}
