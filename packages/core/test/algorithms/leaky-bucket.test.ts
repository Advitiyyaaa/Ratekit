import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LeakyBucket } from '../../src/algorithms/leaky-bucket.js';
import { MemoryStore } from '../../src/stores/memory-store.js';

describe('LeakyBucket', () => {
  let store: MemoryStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new MemoryStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within capacity', async () => {
    const limiter = new LeakyBucket(store, {
      capacity: 5,
      leakRate: 1,
      leakIntervalMs: 1000,
    });

    for (let i = 0; i < 5; i++) {
      const result = await limiter.consume('user:1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  it('should deny requests when bucket is full', async () => {
    const limiter = new LeakyBucket(store, {
      capacity: 3,
      leakRate: 1,
      leakIntervalMs: 1000,
    });

    // Fill the bucket
    for (let i = 0; i < 3; i++) {
      await limiter.consume('user:1');
    }

    // Next request should overflow
    const result = await limiter.consume('user:1');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should leak (drain) over time, freeing capacity', async () => {
    const limiter = new LeakyBucket(store, {
      capacity: 3,
      leakRate: 1,
      leakIntervalMs: 1000,
    });

    // Fill the bucket
    for (let i = 0; i < 3; i++) {
      await limiter.consume('user:1');
    }

    // Advance time by 2 seconds → 2 requests leaked
    vi.advanceTimersByTime(2000);

    const result = await limiter.consume('user:1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1); // 3 - 2 leaked + 1 new = 2 water, 3 - 2 = 1 remaining
  });

  it('should not go below 0 water level on leak', async () => {
    const limiter = new LeakyBucket(store, {
      capacity: 5,
      leakRate: 10,
      leakIntervalMs: 1000,
    });

    // Add 1 request
    await limiter.consume('user:1');

    // Advance by 10 seconds (would leak 100, but water can't go below 0)
    vi.advanceTimersByTime(10_000);

    const result = await limiter.consume('user:1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4); // bucket drained to 0, then 1 added
  });

  it('should support consuming multiple points', async () => {
    const limiter = new LeakyBucket(store, {
      capacity: 10,
      leakRate: 1,
      leakIntervalMs: 1000,
    });

    const result = await limiter.consume('user:1', 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);

    const result2 = await limiter.consume('user:1', 6);
    expect(result2.allowed).toBe(false);
  });

  it('should track keys independently', async () => {
    const limiter = new LeakyBucket(store, {
      capacity: 2,
      leakRate: 1,
      leakIntervalMs: 1000,
    });

    // Fill user:1
    await limiter.consume('user:1');
    await limiter.consume('user:1');
    const r1 = await limiter.consume('user:1');
    expect(r1.allowed).toBe(false);

    // user:2 should still work
    const r2 = await limiter.consume('user:2');
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
  });

  it('should return a valid resetAt timestamp', async () => {
    const now = Date.now();
    const limiter = new LeakyBucket(store, {
      capacity: 1,
      leakRate: 1,
      leakIntervalMs: 5000,
    });

    await limiter.consume('user:1');
    const result = await limiter.consume('user:1');
    expect(result.allowed).toBe(false);
    expect(result.resetAt).toBeGreaterThanOrEqual(now);
  });
});
