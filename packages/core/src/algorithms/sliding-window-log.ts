import type { Store, RateLimiter, RateLimitResult, SlidingWindowLogConfig } from '../types.js';

/**
 * Sliding Window Log rate limiter.
 *
 * @remarks
 * **How it works:** Maintains a log (sorted list) of timestamps for every
 * request. On each new request, expired entries (older than `windowMs`) are
 * removed, and the remaining count is checked against `maxRequests`.
 *
 * **Tradeoff:** Most accurate — tracks every individual request timestamp.
 * But O(n) memory per key where n = number of requests in the window. Not
 * suitable for high-volume keys; best for low-volume, precision-critical
 * limits.
 *
 * **When to use:** Login attempt limiting, password reset throttling, or
 * any scenario where exact precision matters more than memory efficiency.
 *
 * @example
 * ```ts
 * import { SlidingWindowLog, MemoryStore } from 'ratekit';
 *
 * const limiter = new SlidingWindowLog(new MemoryStore(), {
 *   maxRequests: 5,      // 5 attempts...
 *   windowMs: 900_000,   // ...per 15 minutes
 * });
 *
 * const result = await limiter.consume('login:user@example.com');
 * if (!result.allowed) {
 *   console.log(`Too many attempts. Try again at ${new Date(result.resetAt)}`);
 * }
 * ```
 */
export class SlidingWindowLog implements RateLimiter {
  private readonly store: Store;
  private readonly config: SlidingWindowLogConfig;

  constructor(store: Store, config: SlidingWindowLogConfig) {
    this.store = store;
    this.config = config;
  }

  /**
   * Attempt to consume a request within the sliding window for the given key.
   *
   * @param key - Unique identifier for the rate-limited entity.
   * @param points - Number of requests to record. Defaults to 1.
   * @returns Rate limit decision with remaining requests and reset time.
   */
  async consume(key: string, points = 1): Promise<RateLimitResult> {
    const now = Date.now();
    const storeKey = `swl:${key}`;
    const windowStart = now - this.config.windowMs;

    // Get all timestamps in the log
    const entries = await this.store.lrange(storeKey, 0, -1);

    // Filter out expired entries (keep only those within the window)
    const validEntries = entries.filter((entry) => {
      const timestamp = parseInt(entry, 10);
      return timestamp > windowStart;
    });

    // Count current requests in window
    const currentCount = validEntries.length;

    // Check if we can allow the new request(s)
    const allowed = currentCount + points <= this.config.maxRequests;

    // Rebuild the list only if entries were evicted or new ones are being added
    const needsRebuild = entries.length !== validEntries.length || allowed;

    if (needsRebuild) {
      // Clear and batch-write: one del + parallel lpush calls
      await this.store.del(storeKey);

      // Build the new entries list: valid entries + new timestamps (if allowed)
      const newEntries = allowed
        ? [...validEntries, ...Array.from({ length: points }, () => String(now))]
        : validEntries;

      // Push all entries concurrently instead of one-by-one awaited loop
      await Promise.all(newEntries.map((entry) => this.store.lpush(storeKey, entry)));

      if (newEntries.length > 0) {
        await this.store.pexpire(storeKey, this.config.windowMs);
      }
    }

    // Calculate reset time: when the oldest entry in the window expires
    const remaining = Math.max(0, this.config.maxRequests - currentCount - (allowed ? points : 0));

    let resetAt: number;
    if (validEntries.length > 0) {
      // Find oldest timestamp — entries are pushed left so oldest is at the end,
      // but filtering may reorder, so scan for the minimum.
      let oldest = Number.MAX_SAFE_INTEGER;
      for (const e of validEntries) {
        const ts = parseInt(e, 10);
        if (ts < oldest) oldest = ts;
      }
      if (allowed) {
        // The new timestamp(s) are always >= oldest, so oldest stays the same
        resetAt = oldest + this.config.windowMs;
      } else {
        resetAt = oldest + this.config.windowMs;
      }
    } else {
      resetAt = now + this.config.windowMs;
    }

    return {
      allowed,
      remaining,
      resetAt,
    };
  }
}
