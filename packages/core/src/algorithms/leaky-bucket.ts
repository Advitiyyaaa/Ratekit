import type { Store, RateLimiter, RateLimitResult, LeakyBucketConfig } from '../types.js';

/**
 * State persisted in the store for each rate-limited key.
 * @internal
 */
interface BucketState {
  /** Current water level (number of queued/pending requests). */
  water: number;
  /** Timestamp of the last leak (drain) operation. */
  lastLeakTime: number;
}

/**
 * Leaky Bucket rate limiter.
 *
 * @remarks
 * **How it works:** Requests fill a "bucket" with water. The bucket leaks
 * (drains) at a constant rate. If the bucket overflows (water level exceeds
 * capacity), requests are denied.
 *
 * **Tradeoff:** Smooths traffic to a constant output rate — no bursts allowed.
 * Ideal for downstream services that can't handle spikes. Slightly more complex
 * state management than fixed windows.
 *
 * **When to use:** Rate-limiting outbound API calls to a third-party service
 * with strict rate limits, or smoothing database write traffic.
 *
 * @example
 * ```ts
 * import { LeakyBucket, MemoryStore } from 'ratekit';
 *
 * const limiter = new LeakyBucket(new MemoryStore(), {
 *   capacity: 10,        // bucket holds 10 requests max
 *   leakRate: 1,          // drain 1 request...
 *   leakIntervalMs: 1000, // ...every second
 * });
 *
 * const result = await limiter.consume('user:123');
 * if (!result.allowed) {
 *   console.log(`Bucket full. Try again at ${new Date(result.resetAt)}`);
 * }
 * ```
 */
export class LeakyBucket implements RateLimiter {
  private readonly store: Store;
  private readonly config: LeakyBucketConfig;

  constructor(store: Store, config: LeakyBucketConfig) {
    this.store = store;
    this.config = config;
  }

  /**
   * Attempt to add a request to the leaky bucket for the given key.
   *
   * @param key - Unique identifier for the rate-limited entity.
   * @param points - Number of "drops" to add. Defaults to 1.
   * @returns Rate limit decision with remaining capacity and reset time.
   */
  async consume(key: string, points = 1): Promise<RateLimitResult> {
    const now = Date.now();
    const storeKey = `lb:${key}`;

    // Load current state
    const raw = await this.store.get(storeKey);
    let state: BucketState;

    if (raw === null) {
      // First request — bucket is empty
      state = {
        water: 0,
        lastLeakTime: now,
      };
    } else {
      state = JSON.parse(raw) as BucketState;
    }

    // Leak (drain) water based on elapsed time
    const elapsed = now - state.lastLeakTime;
    const leakIntervals = Math.floor(elapsed / this.config.leakIntervalMs);
    const leaked = leakIntervals * this.config.leakRate;

    if (leaked > 0) {
      state.water = Math.max(0, state.water - leaked);
      state.lastLeakTime += leakIntervals * this.config.leakIntervalMs;
    }

    // Try to add water (request)
    const newWater = state.water + points;
    const allowed = newWater <= this.config.capacity;

    if (allowed) {
      state.water = newWater;
    }

    // Calculate reset time: when will there be room for 1 more drop?
    let resetAt: number;
    if (state.water < this.config.capacity) {
      // There's room — reset is at the next leak interval
      resetAt = state.lastLeakTime + this.config.leakIntervalMs;
    } else {
      // Bucket is full — how many leak intervals until 1 slot opens?
      const excess = state.water - this.config.capacity + 1;
      const intervalsNeeded = Math.ceil(excess / this.config.leakRate);
      resetAt = state.lastLeakTime + intervalsNeeded * this.config.leakIntervalMs;
    }

    // Persist state (TTL: time for the entire bucket to drain + buffer)
    const ttlMs =
      Math.ceil(this.config.capacity / this.config.leakRate) *
        this.config.leakIntervalMs +
      this.config.leakIntervalMs;

    await this.store.set(storeKey, JSON.stringify(state), ttlMs);

    const remaining = Math.max(0, this.config.capacity - state.water);

    return {
      allowed,
      remaining,
      resetAt,
    };
  }
}
