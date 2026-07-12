---
title: Fixed Window
description: Simple counter-per-window rate limiting with minimal memory.
algorithm: fixed-window
order: 3
---

# Fixed Window

## How It Works

The Fixed Window algorithm divides time into fixed-duration windows (e.g., every minute). Each window has a counter. Every request increments the counter. When the counter exceeds the limit, further requests are denied until the next window.

```
  Window 1          Window 2          Window 3
├─────────────────┼─────────────────┼─────────────────┤
│ ████████░░      │ ███░░░░░░░      │ ░░░░░░░░░░      │
│ 8/10 requests   │ 3/10 requests   │ 0/10 requests   │
├─────────────────┼─────────────────┼─────────────────┤
  00:00             01:00             02:00
```

1. Determine which window the current time falls in.
2. Increment the counter for that window.
3. If the counter ≤ limit: allow. Otherwise: deny.
4. When the window changes, the counter resets to 0.

## Tradeoffs

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Burst tolerance** | ⚠️ Boundary issue | 2× burst possible at window edges |
| **Memory per key** | ✅ Very low | Just one counter per key |
| **Accuracy** | Low | Not precise at boundaries |
| **Complexity** | ✅ Very low | Simplest algorithm |
| **Smoothing** | Poor | Resets abruptly at window boundaries |

### The Boundary Problem

A user could make all their requests at the **end** of window 1 and the **start** of window 2, effectively getting 2× the limit in a short period:

```
        Window 1        │        Window 2
────────────────────────┼────────────────────────
              ██████████│██████████
              10 reqs   │10 reqs = 20 in ~1 second!
```

If this is a concern, use Sliding Window Counter instead.

## When To Use

- **Simple daily/hourly quotas** (e.g., "1000 API calls per day")
- **Coarse limits** where boundary precision doesn't matter
- **High-volume scenarios** where memory efficiency is critical
- When you need the **simplest possible implementation**

## Configuration

```typescript
interface FixedWindowConfig {
  maxRequests: number; // Maximum requests per window
  windowMs: number;    // Window duration in milliseconds
}
```

| Parameter | Example | Effect |
|-----------|---------|--------|
| `maxRequests: 100` | 100 requests allowed per window | Hard cap per period |
| `windowMs: 60_000` | 1-minute windows | Counter resets every minute |

## Code Example

```typescript
import { FixedWindow, MemoryStore } from 'ratekit';

const store = new MemoryStore();
const limiter = new FixedWindow(store, {
  maxRequests: 100,
  windowMs: 60_000, // 100 requests per minute
});

const result = await limiter.consume('user:123');

if (!result.allowed) {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
  res.setHeader('Retry-After', retryAfter);
  res.status(429).json({ error: 'Rate limit exceeded' });
  return;
}
```
