import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FixedWindow } from '../../src/algorithms/fixed-window.js';
import { MemoryStore } from '../../src/stores/memory-store.js';

describe('FixedWindow', () => {
  let store: MemoryStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new MemoryStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within the limit', async () => {
    const limiter = new FixedWindow(store, {
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
    const limiter = new FixedWindow(store, {
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

  it('should reset after window expires', async () => {
    const limiter = new FixedWindow(store, {
      maxRequests: 2,
      windowMs: 5000,
    });

    // Exhaust the window
    await limiter.consume('user:1');
    await limiter.consume('user:1');
    const denied = await limiter.consume('user:1');
    expect(denied.allowed).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(5000);

    const result = await limiter.consume('user:1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('should support consuming multiple points', async () => {
    const limiter = new FixedWindow(store, {
      maxRequests: 10,
      windowMs: 10_000,
    });

    const result = await limiter.consume('user:1', 7);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3);

    const result2 = await limiter.consume('user:1', 4);
    expect(result2.allowed).toBe(false);
    expect(result2.remaining).toBe(0);
  });

  it('should track keys independently', async () => {
    const limiter = new FixedWindow(store, {
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
    const now = Date.now();
    const windowMs = 10_000;
    const windowStart = now - (now % windowMs);
    const windowEnd = windowStart + windowMs;

    const limiter = new FixedWindow(store, {
      maxRequests: 5,
      windowMs,
    });

    const result = await limiter.consume('user:1');
    expect(result.resetAt).toBe(windowEnd);
  });
});
