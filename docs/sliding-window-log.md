---
title: Sliding Window Log
description: Most accurate rate limiting via per-request timestamp tracking.
algorithm: sliding-window-log
order: 4
---

# Sliding Window Log

## How It Works

The Sliding Window Log maintains a list of timestamps for every request within the window. When a new request arrives, expired timestamps are removed, and the remaining count is checked against the limit.

```
  Window (last 60s)
  ◄──────────────────────────────────────────►
  │                                          │
  t₁  t₂  t₃     t₄  t₅     t₆  t₇  t₈  NOW
  ●   ●   ●      ●   ●      ●   ●   ●    ?
                                           │
  Count: 8       Max: 10     ──► ALLOWED (2 remaining)
```

1. Remove all entries older than `now - windowMs`.
2. Count remaining entries.
3. If count + requested points ≤ limit: add new timestamp(s), allow.
4. Otherwise: deny.

## Tradeoffs

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Burst tolerance** | Moderate | No artificial smoothing, natural window |
| **Memory per key** | ❌ High (O(n)) | Stores every timestamp in the window |
| **Accuracy** | ✅ Exact | Precise per-request tracking |
| **Complexity** | Medium | Requires list management and cleanup |
| **Smoothing** | Good | True sliding window, no boundary issues |

## When To Use

- **Login attempt limiting** — "5 failed logins per 15 minutes"
- **Password reset throttling**
- **Any low-volume, precision-critical** rate limit
- **Not recommended** for high-volume keys (memory grows linearly with requests)

## Configuration

```typescript
interface SlidingWindowLogConfig {
  maxRequests: number; // Maximum requests in the sliding window
  windowMs: number;    // Window duration in milliseconds
}
```

| Parameter | Example | Effect |
|-----------|---------|--------|
| `maxRequests: 5` | 5 requests allowed in the window | Hard cap with exact tracking |
| `windowMs: 900_000` | 15-minute sliding window | Timestamps older than 15min are evicted |

## Code Example

```typescript
import { SlidingWindowLog, MemoryStore } from 'ratekit';

const store = new MemoryStore();
const limiter = new SlidingWindowLog(store, {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 5 attempts per 15 minutes
});

const result = await limiter.consume('login:user@example.com');

if (!result.allowed) {
  const waitMinutes = Math.ceil((result.resetAt - Date.now()) / 60_000);
  res.status(429).json({
    error: `Too many login attempts. Try again in ${waitMinutes} minutes.`,
  });
  return;
}
```
