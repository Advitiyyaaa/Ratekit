import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SlidingWindowCounter } from '../../src/algorithms/sliding-window-counter.js';
import { MemoryStore } from '../../src/stores/memory-store.js';

describe('SlidingWindowCounter', () => {
  let store: MemoryStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new MemoryStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within the limit', async () => {
    const limiter = new SlidingWindowCounter(store, {
      maxRequests: 5,
      windowMs: 10_000,
    });

    for (let i = 0; i < 5; i++) {
      const result = await limiter.consume('user:1');
      expect(result.allowed).toBe(true);
    }
  });

  it('should deny requests over the limit', async () => {
    const limiter = new SlidingWindowCounter(store, {
      maxRequests: 3,
      windowMs: 10_000,
    });

    for (let i = 0; i < 3; i++) {
      await limiter.consume('user:1');
    }

    const result = await limiter.consume('user:1');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset after the window passes', async () => {
    const limiter = new SlidingWindowCounter(store, {
      maxRequests: 2,
      windowMs: 5000,
    });

    await limiter.consume('user:1');
    await limiter.consume('user:1');
    const denied = await limiter.consume('user:1');
    expect(denied.allowed).toBe(false);

    // Advance past two full windows (previous window data becomes stale)
    vi.advanceTimersByTime(10_000);

    const result = await limiter.consume('user:1');
    expect(result.allowed).toBe(true);
  });

  it('should weight previous window counts', async () => {
    const windowMs = 10_000;
    // Align to a window boundary
    const now = Date.now();
    const windowStart = now - (now % windowMs);
    vi.setSystemTime(windowStart);

    const limiter = new SlidingWindowCounter(store, {
      maxRequests: 10,
      windowMs,
    });

    // Make 8 requests in the current window
    for (let i = 0; i < 8; i++) {
      await limiter.consume('user:1');
    }

    // Advance to 20% into the next window
    // Previous window weight = 1 - 0.2 = 0.8
    // Weighted count = 8 * 0.8 = 6.4
    vi.advanceTimersByTime(windowMs + windowMs * 0.2);

    // We should have ~3 remaining (10 - 6.4 = 3.6, floor = 3)
    const result = await limiter.consume('user:1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(2);
    expect(result.remaining).toBeLessThanOrEqual(4);
  });

  it('should support consuming multiple points', async () => {
    const limiter = new SlidingWindowCounter(store, {
      maxRequests: 10,
      windowMs: 10_000,
    });

    const result = await limiter.consume('user:1', 7);
    expect(result.allowed).toBe(true);

    const result2 = await limiter.consume('user:1', 4);
    expect(result2.allowed).toBe(false);
  });

  it('should track keys independently', async () => {
    const limiter = new SlidingWindowCounter(store, {
      maxRequests: 1,
      windowMs: 10_000,
    });

    const r1 = await limiter.consume('user:1');
    expect(r1.allowed).toBe(true);

    const r1b = await limiter.consume('user:1');
    expect(r1b.allowed).toBe(false);

    const r2 = await limiter.consume('user:2');
    expect(r2.allowed).toBe(true);
  });

  it('should return resetAt at end of current window', async () => {
    const windowMs = 10_000;
    const now = Date.now();
    const windowStart = now - (now % windowMs);
    const windowEnd = windowStart + windowMs;

    const limiter = new SlidingWindowCounter(store, {
      maxRequests: 5,
      windowMs,
    });

    const result = await limiter.consume('user:1');
    expect(result.resetAt).toBe(windowEnd);
  });
});
