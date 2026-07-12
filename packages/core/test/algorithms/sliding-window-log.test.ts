import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SlidingWindowLog } from '../../src/algorithms/sliding-window-log.js';
import { MemoryStore } from '../../src/stores/memory-store.js';

describe('SlidingWindowLog', () => {
  let store: MemoryStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new MemoryStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within the limit', async () => {
    const limiter = new SlidingWindowLog(store, {
      maxRequests: 5,
      windowMs: 10_000,
    });

    for (let i = 0; i < 5; i++) {
      const result = await limiter.consume('user:1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  it('should deny requests over the limit', async () => {
    const limiter = new SlidingWindowLog(store, {
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

  it('should slide the window — old entries expire', async () => {
    const limiter = new SlidingWindowLog(store, {
      maxRequests: 2,
      windowMs: 5000,
    });

    // Use up the limit
    await limiter.consume('user:1');
    await limiter.consume('user:1');

    // Advance past the window
    vi.advanceTimersByTime(5001);

    // Old entries should have expired, allowing new requests
    const result = await limiter.consume('user:1');
    expect(result.allowed).toBe(true);
  });

  it('should support consuming multiple points', async () => {
    const limiter = new SlidingWindowLog(store, {
      maxRequests: 5,
      windowMs: 10_000,
    });

    const result = await limiter.consume('user:1', 3);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);

    const result2 = await limiter.consume('user:1', 3);
    expect(result2.allowed).toBe(false);
    expect(result2.remaining).toBe(2); // still 3 in window, 5-3=2
  });

  it('should track keys independently', async () => {
    const limiter = new SlidingWindowLog(store, {
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

  it('should return a valid resetAt timestamp', async () => {
    const now = Date.now();
    const limiter = new SlidingWindowLog(store, {
      maxRequests: 1,
      windowMs: 5000,
    });

    await limiter.consume('user:1');
    const result = await limiter.consume('user:1');
    expect(result.allowed).toBe(false);
    // resetAt should be when the first entry expires
    expect(result.resetAt).toBe(now + 5000);
  });

  it('should handle partial window expiry correctly', async () => {
    const limiter = new SlidingWindowLog(store, {
      maxRequests: 3,
      windowMs: 10_000,
    });

    // Add 3 requests
    await limiter.consume('user:1');
    vi.advanceTimersByTime(3000);
    await limiter.consume('user:1');
    vi.advanceTimersByTime(3000);
    await limiter.consume('user:1');

    // At t=6000, the first request was at t=0
    // Advance to t=10001 — first request should have expired
    vi.advanceTimersByTime(4001);

    const result = await limiter.consume('user:1');
    expect(result.allowed).toBe(true);
  });
});
