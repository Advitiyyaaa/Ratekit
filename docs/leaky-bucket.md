---
title: Leaky Bucket
description: Constant-rate traffic smoothing with no burst tolerance.
algorithm: leaky-bucket
order: 2
---

# Leaky Bucket

## How It Works

The Leaky Bucket algorithm models a bucket with a hole in the bottom. Requests fill the bucket with "water." The bucket leaks (drains) at a constant rate. If the bucket overflows, requests are denied.

```
     ▼ incoming requests
┌─────────────────────┐
│  ≈≈≈≈≈≈≈≈≈≈≈        │  ← water level (queued requests)
│  ≈≈≈≈≈≈≈≈≈≈≈        │
│                     │  capacity: 10
│       ┃             │
└───────╋─────────────┘
        ┃  leak: 1/sec     ← constant drain rate
        ▼
   (processed)
```

1. A request arrives — check if there's room in the bucket.
2. If yes: add "water" (the request), allow it.
3. If no: the bucket would overflow — deny the request.
4. Meanwhile, water drains at a fixed rate regardless of input.

## Tradeoffs

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Burst tolerance** | ❌ None | Strictly smooths output to constant rate |
| **Memory per key** | Medium | Stores water level + last leak timestamp |
| **Accuracy** | High | Precise drain tracking |
| **Complexity** | Medium | Slightly more complex state management |
| **Smoothing** | ✅ Excellent | Perfect constant-rate output |

## When To Use

- **Third-party API calls** where the downstream has strict, constant rate limits
- **Database write throttling** to prevent overwhelming the DB
- **Network traffic shaping** — ensuring steady packet flow
- Any scenario where **spikes are unacceptable** even if the average is within limits

## Configuration

```typescript
interface LeakyBucketConfig {
  capacity: number;       // Maximum requests the bucket can hold
  leakRate: number;       // Requests drained per leak interval
  leakIntervalMs: number; // Milliseconds between drains
}
```

| Parameter | Example | Effect |
|-----------|---------|--------|
| `capacity: 10` | Bucket holds max 10 queued requests | Buffer for incoming bursts |
| `leakRate: 1` | 1 request drained per interval | Output rate = 1 req/interval |
| `leakIntervalMs: 1000` | Drain every 1 second | Steady 1 req/sec throughput |

## Code Example

```typescript
import { LeakyBucket, MemoryStore } from 'ratekit';

const store = new MemoryStore();
const limiter = new LeakyBucket(store, {
  capacity: 10,
  leakRate: 1,
  leakIntervalMs: 1000,
});

const result = await limiter.consume('api-key:xyz');

if (!result.allowed) {
  res.status(429).json({
    error: 'Rate limit exceeded',
    retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
  });
  return;
}
```
