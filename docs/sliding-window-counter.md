---
title: Sliding Window Counter
description: O(1) memory approximation of sliding window — best general-purpose choice.
algorithm: sliding-window-counter
order: 5
---

# Sliding Window Counter

## How It Works

The Sliding Window Counter combines two fixed-window counters (current and previous) with a weighted average to approximate a true sliding window. This gives much better boundary behavior than Fixed Window with the same O(1) memory footprint.

```
  Previous Window        Current Window
  ┌─────────────────┐   ┌─────────────────┐
  │ count: 80       │   │ count: 20       │
  └─────────────────┘   └─────────────────┘
                              ▲
                              │ 30% into current window
                              │
  Weighted count = 80 × 0.7 + 20 = 76
  Limit: 100 → 24 remaining → ALLOWED
```

1. Determine the current fixed window.
2. If the window has changed, rotate counters (current → previous).
3. Calculate `overlapRatio = 1 - (elapsed in current window / window size)`.
4. Weighted count = `previousCount × overlapRatio + currentCount`.
5. If weighted count + points ≤ limit: increment current counter, allow.
6. Otherwise: deny.

## Tradeoffs

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Burst tolerance** | Moderate | Smoothed naturally by the weighted average |
| **Memory per key** | ✅ Very low (O(1)) | Just two counters + one timestamp |
| **Accuracy** | Good (approximate) | Assumes previous window had even distribution |
| **Complexity** | Low | Simple weighted math |
| **Smoothing** | ✅ Good | No boundary spikes like fixed window |

## When To Use

- **General-purpose API rate limiting** — this is the **recommended default**
- **High-volume scenarios** where memory matters but you need better accuracy than Fixed Window
- **Any situation** where Sliding Window Log's O(n) memory is too expensive
- When you need a good balance of **accuracy, memory, and simplicity**

## Configuration

```typescript
interface SlidingWindowCounterConfig {
  maxRequests: number; // Maximum requests in the sliding window
  windowMs: number;    // Window duration in milliseconds
}
```

| Parameter | Example | Effect |
|-----------|---------|--------|
| `maxRequests: 100` | 100 requests per sliding window | Approximate sliding limit |
| `windowMs: 60_000` | 1-minute sliding window | Counter rotation every minute |

## Code Example

```typescript
import { SlidingWindowCounter, MemoryStore } from 'ratekit';

const store = new MemoryStore();
const limiter = new SlidingWindowCounter(store, {
  maxRequests: 100,
  windowMs: 60_000, // ~100 requests per minute (sliding)
});

// Use in Express middleware:
async function rateLimitMiddleware(req, res, next) {
  const key = req.ip; // or req.user.id
  const result = await limiter.consume(key);

  // Set standard rate limit headers
  res.setHeader('X-RateLimit-Limit', 100);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

  if (!result.allowed) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  next();
}
```
