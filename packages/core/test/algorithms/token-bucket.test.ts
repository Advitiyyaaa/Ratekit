import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TokenBucket } from '../../src/algorithms/token-bucket.js';
import { MemoryStore } from '../../src/stores/memory-store.js';

describe('TokenBucket', () => {
  let store: MemoryStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new MemoryStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within capacity', async () => {
    const limiter = new TokenBucket(store, {
      capacity: 5,
      refillRate: 1,
      refillIntervalMs: 1000,
    });

    for (let i = 0; i < 5; i++) {
      const result = await limiter.consume('user:1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  it('should deny requests when bucket is empty', async () => {
    const limiter = new TokenBucket(store, {
      capacity: 3,
      refillRate: 1,
      refillIntervalMs: 1000,
    });

    // Exhaust the bucket
    for (let i = 0; i < 3; i++) {
      await limiter.consume('user:1');
    }

    // Next request should be denied
    const result = await limiter.consume('user:1');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should refill tokens over time', async () => {
    const limiter = new TokenBucket(store, {
      capacity: 3,
      refillRate: 1,
      refillIntervalMs: 1000,
    });

    // Exhaust the bucket
    for (let i = 0; i < 3; i++) {
      await limiter.consume('user:1');
    }

    // Advance time by 2 seconds → 2 tokens refilled
    vi.advanceTimersByTime(2000);

    const result = await limiter.consume('user:1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1); // 2 refilled - 1 consumed = 1
  });

  it('should not exceed capacity on refill', async () => {
    const limiter = new TokenBucket(store, {
      capacity: 5,
      refillRate: 10,
      refillIntervalMs: 1000,
    });

    // Use 1 token
    await limiter.consume('user:1');

    // Advance by 10 seconds (would refill 100 tokens, but capped at 5)
    vi.advanceTimersByTime(10_000);

    const result = await limiter.consume('user:1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4); // capped at 5, consumed 1
  });

  it('should support consuming multiple points', async () => {
    const limiter = new TokenBucket(store, {
      capacity: 10,
      refillRate: 1,
      refillIntervalMs: 1000,
    });

    const result = await limiter.consume('user:1', 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);

    const result2 = await limiter.consume('user:1', 6);
    expect(result2.allowed).toBe(false);
    expect(result2.remaining).toBe(5);
  });

  it('should track keys independently', async () => {
    const limiter = new TokenBucket(store, {
      capacity: 2,
      refillRate: 1,
      refillIntervalMs: 1000,
    });

    // Exhaust user:1
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
    const limiter = new TokenBucket(store, {
      capacity: 1,
      refillRate: 1,
      refillIntervalMs: 5000,
    });

    await limiter.consume('user:1');
    const result = await limiter.consume('user:1');
    expect(result.allowed).toBe(false);
    expect(result.resetAt).toBeGreaterThanOrEqual(now);
  });
});
