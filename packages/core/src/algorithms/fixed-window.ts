import type { Store, RateLimiter, RateLimitResult, FixedWindowConfig } from '../types.js';

/**
 * Fixed Window rate limiter.
 *
 * @remarks
 * **How it works:** Divides time into fixed-duration windows. Each window
 * has a counter that increments with each request. When the counter exceeds
 * `maxRequests`, further requests are denied until the next window starts.
 *
 * **Tradeoff:** Simplest and lowest memory — one counter per window. But
 * vulnerable to boundary spikes: a user could make `maxRequests` at the end
 * of one window and `maxRequests` at the start of the next, effectively
 * doubling throughput over a short period. Good for coarse rate limits.
 *
 * **When to use:** Simple daily/hourly quotas where exact precision at
 * window boundaries isn't critical (e.g., "1000 API calls per hour").
 *
 * @example
 * ```ts
 * import { FixedWindow, MemoryStore } from 'ratekit';
 *
 * const limiter = new FixedWindow(new MemoryStore(), {
 *   maxRequests: 100,    // 100 requests...
 *   windowMs: 60_000,    // ...per minute
 * });
 *
 * const result = await limiter.consume('user:123');
 * if (!result.allowed) {
 *   console.log(`Limit exceeded. Resets at ${new Date(result.resetAt)}`);
 * }
 * ```
 */
export class FixedWindow implements RateLimiter {
  private readonly store: Store;
  private readonly config: FixedWindowConfig;

  constructor(store: Store, config: FixedWindowConfig) {
    this.store = store;
    this.config = config;
  }

  /**
   * Attempt to consume points within the current fixed window for the given key.
   *
   * @param key - Unique identifier for the rate-limited entity.
   * @param points - Number of requests to record. Defaults to 1.
   * @returns Rate limit decision with remaining requests and reset time.
   */
  async consume(key: string, points = 1): Promise<RateLimitResult> {
    const now = Date.now();

    // Determine current window
    const windowStart = now - (now % this.config.windowMs);
    const windowEnd = windowStart + this.config.windowMs;
    const storeKey = `fw:${key}:${windowStart}`;

    // Increment counter for this window
    const count = await this.store.increment(storeKey, points);

    // Set TTL on the key if this is the first request in the window
    // (count equals points means this was the initial increment)
    if (count === points) {
      await this.store.pexpire(storeKey, this.config.windowMs);
    }

    const allowed = count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - count);

    return {
      allowed,
      remaining,
      resetAt: windowEnd,
    };
  }
}
