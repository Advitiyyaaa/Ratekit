import type { Store, RateLimiter, RateLimitResult, SlidingWindowCounterConfig } from '../types.js';

/**
 * State persisted in the store for each rate-limited key.
 * @internal
 */
interface WindowState {
  /** Request count in the previous window. */
  prevCount: number;
  /** Request count in the current window. */
  currCount: number;
  /** Start timestamp (epoch ms) of the current window. */
  currWindowStart: number;
}

/**
 * Sliding Window Counter rate limiter.
 *
 * @remarks
 * **How it works:** Maintains two counters — one for the current fixed window
 * and one for the previous. The effective count is calculated as a weighted
 * sum: `prevCount × overlapRatio + currCount`, where `overlapRatio` is the
 * fraction of the previous window that falls within the current sliding window.
 *
 * **Tradeoff:** Approximates the sliding window using O(1) memory per key
 * (just two counters + a timestamp). Much smoother than fixed-window at
 * boundaries, but not perfectly accurate — it's an approximation that assumes
 * requests in the previous window were evenly distributed.
 *
 * **When to use:** General-purpose rate limiting for most APIs. Best balance
 * of accuracy, memory, and simplicity. Recommended as the default choice.
 *
 * @example
 * ```ts
 * import { SlidingWindowCounter, MemoryStore } from 'ratekit';
 *
 * const limiter = new SlidingWindowCounter(new MemoryStore(), {
 *   maxRequests: 100,    // 100 requests...
 *   windowMs: 60_000,    // ...per minute (sliding)
 * });
 *
 * const result = await limiter.consume('user:123');
 * if (!result.allowed) {
 *   console.log(`Rate limited. Try again at ${new Date(result.resetAt)}`);
 * }
 * ```
 */
export class SlidingWindowCounter implements RateLimiter {
  private readonly store: Store;
  private readonly config: SlidingWindowCounterConfig;

  constructor(store: Store, config: SlidingWindowCounterConfig) {
    this.store = store;
    this.config = config;
  }

  /**
   * Attempt to consume points using the sliding window counter for the given key.
   *
   * @param key - Unique identifier for the rate-limited entity.
   * @param points - Number of requests to record. Defaults to 1.
   * @returns Rate limit decision with remaining requests and reset time.
   */
  async consume(key: string, points = 1): Promise<RateLimitResult> {
    const now = Date.now();
    const storeKey = `swc:${key}`;

    // Load current state
    const raw = await this.store.get(storeKey);
    let state: WindowState;

    if (raw === null) {
      // First request
      state = {
        prevCount: 0,
        currCount: 0,
        currWindowStart: now - (now % this.config.windowMs),
      };
    } else {
      state = JSON.parse(raw) as WindowState;
    }

    // Advance windows if needed
    const currentWindowStart = now - (now % this.config.windowMs);

    if (currentWindowStart !== state.currWindowStart) {
      const windowsElapsed = Math.floor(
        (currentWindowStart - state.currWindowStart) / this.config.windowMs,
      );

      if (windowsElapsed === 1) {
        // Move current → previous
        state.prevCount = state.currCount;
        state.currCount = 0;
        state.currWindowStart = currentWindowStart;
      } else {
        // More than one window has passed — previous window data is stale
        state.prevCount = 0;
        state.currCount = 0;
        state.currWindowStart = currentWindowStart;
      }
    }

    // Calculate the weighted count (sliding window approximation)
    const elapsedInCurrentWindow = now - state.currWindowStart;
    const overlapRatio = Math.max(
      0,
      1 - elapsedInCurrentWindow / this.config.windowMs,
    );
    const weightedCount =
      state.prevCount * overlapRatio + state.currCount;

    // Check if we can allow the new request(s)
    const allowed = weightedCount + points <= this.config.maxRequests;

    if (allowed) {
      state.currCount += points;
    }

    // Persist state (TTL: 2 windows to keep previous window data alive)
    const ttlMs = this.config.windowMs * 2;
    await this.store.set(storeKey, JSON.stringify(state), ttlMs);

    // Recalculate weighted count after potential update
    const finalWeightedCount = allowed
      ? state.prevCount * overlapRatio + state.currCount
      : weightedCount;
    const remaining = Math.max(
      0,
      Math.floor(this.config.maxRequests - finalWeightedCount),
    );

    // Reset at the end of the current window
    const resetAt = state.currWindowStart + this.config.windowMs;

    return {
      allowed,
      remaining,
      resetAt,
    };
  }
}
