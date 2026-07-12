import type { Store, RateLimiter, RateLimitResult, TokenBucketConfig } from '../types.js';

/**
 * State persisted in the store for each rate-limited key.
 * @internal
 */
interface BucketState {
  tokens: number;
  lastRefillTime: number;
}

/**
 * Token Bucket rate limiter.
 *
 * @remarks
 * **How it works:** Each key has a "bucket" of tokens. Requests consume tokens.
 * Tokens refill at a steady rate up to a maximum capacity. If the bucket is empty,
 * requests are denied until tokens refill.
 *
 * **Tradeoff:** Allows controlled bursts up to bucket capacity while enforcing
 * a steady average rate. Higher memory per key (stores tokens + timestamp) but
 * excellent for APIs needing burst tolerance.
 *
 * **When to use:** APIs where you want to allow short bursts of traffic
 * (e.g., a user uploading multiple files at once) as long as their average
 * usage stays within limits.
 *
 * @example
 * ```ts
 * import { TokenBucket, MemoryStore } from 'ratekit';
 *
 * const limiter = new TokenBucket(new MemoryStore(), {
 *   capacity: 10,        // max 10 tokens
 *   refillRate: 1,        // add 1 token...
 *   refillIntervalMs: 1000, // ...every second
 * });
 *
 * const result = await limiter.consume('user:123');
 * if (!result.allowed) {
 *   console.log(`Rate limited. Try again at ${new Date(result.resetAt)}`);
 * }
 * ```
 */
export class TokenBucket implements RateLimiter {
  private readonly store: Store;
  private readonly config: TokenBucketConfig;

  constructor(store: Store, config: TokenBucketConfig) {
    this.store = store;
    this.config = config;
  }

  /**
   * Attempt to consume tokens from the bucket for the given key.
   *
   * @param key - Unique identifier for the rate-limited entity.
   * @param points - Number of tokens to consume. Defaults to 1.
   * @returns Rate limit decision with remaining tokens and reset time.
   */
  async consume(key: string, points = 1): Promise<RateLimitResult> {
    const now = Date.now();
    const storeKey = `tb:${key}`;

    // Load current state
    const raw = await this.store.get(storeKey);
    let state: BucketState;

    if (raw === null) {
      // First request — start with a full bucket
      state = {
        tokens: this.config.capacity,
        lastRefillTime: now,
      };
    } else {
      state = JSON.parse(raw) as BucketState;
    }

    // Refill tokens based on elapsed time
    const elapsed = now - state.lastRefillTime;
    const refillIntervals = Math.floor(elapsed / this.config.refillIntervalMs);
    const tokensToAdd = refillIntervals * this.config.refillRate;

    if (tokensToAdd > 0) {
      state.tokens = Math.min(this.config.capacity, state.tokens + tokensToAdd);
      state.lastRefillTime += refillIntervals * this.config.refillIntervalMs;
    }

    // Try to consume
    const allowed = state.tokens >= points;

    if (allowed) {
      state.tokens -= points;
    }

    // Calculate reset time: when will there be enough tokens for 1 point?
    let resetAt: number;
    if (state.tokens >= 1) {
      // Already have tokens — reset is at the next full window boundary
      resetAt = now + this.config.refillIntervalMs;
    } else {
      // How many refill intervals until we have at least 1 token?
      const deficit = 1 - state.tokens;
      const intervalsNeeded = Math.ceil(deficit / this.config.refillRate);
      resetAt = state.lastRefillTime + intervalsNeeded * this.config.refillIntervalMs;
    }

    // Persist state (TTL: enough time for a full refill cycle + buffer)
    const ttlMs =
      Math.ceil(this.config.capacity / this.config.refillRate) *
        this.config.refillIntervalMs +
      this.config.refillIntervalMs;

    await this.store.set(storeKey, JSON.stringify(state), ttlMs);

    return {
      allowed,
      remaining: Math.max(0, Math.floor(state.tokens)),
      resetAt,
    };
  }
}
