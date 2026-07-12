/**
 * Result returned by every rate limiter's `consume()` call.
 *
 * @remarks
 * All rate-limiting algorithms return this same shape, making it easy
 * to swap algorithms without changing consumer code.
 */
export interface RateLimitResult {
  /** Whether the request was allowed (within the rate limit). */
  allowed: boolean;
  /** Number of remaining allowed requests/points in the current window or bucket. */
  remaining: number;
  /** Epoch millisecond timestamp when the rate limit resets. */
  resetAt: number;
}

/**
 * Common interface all rate-limiting algorithms implement.
 *
 * @remarks
 * Every algorithm accepts a `Store` for persistence and exposes a single
 * `consume()` method. This strategy-pattern approach lets you swap
 * algorithms and storage backends independently.
 */
export interface RateLimiter {
  /**
   * Attempt to consume points from the rate limiter for the given key.
   *
   * @param key - Unique identifier for the rate-limited entity (e.g., IP, user ID).
   * @param points - Number of points to consume. Defaults to 1.
   * @returns A promise resolving to the rate limit decision.
   */
  consume(key: string, points?: number): Promise<RateLimitResult>;
}

/**
 * Abstraction over the backing store used by rate-limiting algorithms.
 *
 * @remarks
 * Algorithms operate against this interface — never directly against
 * Redis or any other concrete store. This allows pluggable storage:
 * in-memory for single-instance, Redis for distributed deployments.
 */
export interface Store {
  /**
   * Get the value associated with a key.
   * @returns The value, or `null` if the key doesn't exist or has expired.
   */
  get(key: string): Promise<string | null>;

  /**
   * Set a key to a value, optionally with a TTL.
   * @param key - The key to set.
   * @param value - The value to store.
   * @param ttlMs - Optional time-to-live in milliseconds.
   */
  set(key: string, value: string, ttlMs?: number): Promise<void>;

  /**
   * Atomically increment a numeric key by the given amount.
   * If the key doesn't exist, it is initialized to 0 before incrementing.
   * @param key - The key to increment.
   * @param amount - Amount to increment by. Defaults to 1.
   * @returns The new value after incrementing.
   */
  increment(key: string, amount?: number): Promise<number>;

  /**
   * Push a value onto the left of a list.
   * If the key doesn't exist, a new list is created.
   */
  lpush(key: string, value: string): Promise<void>;

  /**
   * Return a range of elements from a list.
   * @param start - Zero-based start index.
   * @param stop - Zero-based stop index (inclusive). Use -1 for all elements.
   */
  lrange(key: string, start: number, stop: number): Promise<string[]>;

  /**
   * Trim a list to the specified range.
   * @param start - Zero-based start index to keep.
   * @param stop - Zero-based stop index to keep (inclusive).
   */
  ltrim(key: string, start: number, stop: number): Promise<void>;

  /**
   * Execute a script atomically (Lua script on Redis, throws on MemoryStore).
   * @param script - The script source (Lua for Redis).
   * @param keys - Keys the script operates on.
   * @param args - Arguments passed to the script.
   * @returns The script's return value.
   */
  eval(script: string, keys: string[], args: string[]): Promise<unknown>;

  /**
   * Set a TTL (time-to-live) on a key in milliseconds.
   */
  pexpire(key: string, ms: number): Promise<void>;

  /**
   * Delete a key.
   */
  del(key: string): Promise<void>;
}

// ─── Algorithm Configuration Types ──────────────────────────────────────────

/**
 * Configuration for the Token Bucket algorithm.
 *
 * @remarks
 * **Tradeoff:** Allows controlled bursts up to bucket capacity while enforcing
 * a steady average rate. Higher memory per key (stores tokens + timestamp)
 * but excellent for APIs needing burst tolerance.
 */
export interface TokenBucketConfig {
  /** Maximum number of tokens the bucket can hold. */
  capacity: number;
  /** Number of tokens added per refill interval. */
  refillRate: number;
  /** Time between refills in milliseconds. */
  refillIntervalMs: number;
}

/**
 * Configuration for the Leaky Bucket algorithm.
 *
 * @remarks
 * **Tradeoff:** Smooths traffic to a constant output rate — no bursts allowed.
 * Ideal for downstream services that can't handle spikes. Slightly more
 * complex state management than fixed windows.
 */
export interface LeakyBucketConfig {
  /** Maximum number of requests the bucket can hold (queue capacity). */
  capacity: number;
  /** Number of requests drained per leak interval. */
  leakRate: number;
  /** Time between leak intervals in milliseconds. */
  leakIntervalMs: number;
}

/**
 * Configuration for the Fixed Window algorithm.
 *
 * @remarks
 * **Tradeoff:** Simplest and lowest memory — one counter per window. But
 * vulnerable to boundary spikes (2× burst at window edges). Good for
 * coarse rate limits where precision isn't critical.
 */
export interface FixedWindowConfig {
  /** Maximum requests allowed per window. */
  maxRequests: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

/**
 * Configuration for the Sliding Window Log algorithm.
 *
 * @remarks
 * **Tradeoff:** Most accurate — tracks every request timestamp individually.
 * O(n) memory per key where n = number of requests in the window. Best for
 * low-volume, precision-critical limits (e.g., login attempts).
 */
export interface SlidingWindowLogConfig {
  /** Maximum requests allowed in the sliding window. */
  maxRequests: number;
  /** Sliding window duration in milliseconds. */
  windowMs: number;
}

/**
 * Configuration for the Sliding Window Counter algorithm.
 *
 * @remarks
 * **Tradeoff:** Approximates the sliding window using weighted counters from
 * the current + previous window. O(1) memory like fixed-window but much
 * smoother distribution. Best general-purpose choice for most applications.
 */
export interface SlidingWindowCounterConfig {
  /** Maximum requests allowed in the sliding window. */
  maxRequests: number;
  /** Sliding window duration in milliseconds. */
  windowMs: number;
}
