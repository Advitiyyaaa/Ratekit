/**
 * ratekit — Framework-agnostic rate-limiting library with multiple algorithms
 * and pluggable storage backends.
 *
 * @packageDocumentation
 */

// ─── Types ──────────────────────────────────────────────────────────────────
export type {
  RateLimiter,
  RateLimitResult,
  Store,
  TokenBucketConfig,
  LeakyBucketConfig,
  FixedWindowConfig,
  SlidingWindowLogConfig,
  SlidingWindowCounterConfig,
} from './types.js';

// ─── Algorithms ─────────────────────────────────────────────────────────────
export { TokenBucket } from './algorithms/token-bucket.js';
export { LeakyBucket } from './algorithms/leaky-bucket.js';
export { FixedWindow } from './algorithms/fixed-window.js';
export { SlidingWindowLog } from './algorithms/sliding-window-log.js';
export { SlidingWindowCounter } from './algorithms/sliding-window-counter.js';

// ─── Stores ─────────────────────────────────────────────────────────────────
export { MemoryStore } from './stores/memory-store.js';
export { RedisStore } from './stores/redis-store.js';
export type { RedisClient } from './stores/redis-store.js';
