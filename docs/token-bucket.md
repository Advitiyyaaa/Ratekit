---
title: Token Bucket
description: Burst-tolerant rate limiting with steady token refill.
algorithm: token-bucket
order: 1
---

# Token Bucket

## How It Works

The Token Bucket algorithm maintains a "bucket" of tokens for each rate-limited key. Each request consumes one or more tokens. Tokens are refilled at a steady rate, up to a maximum capacity.

```
┌─────────────────────┐
│  Bucket (cap: 10)   │
│  ●●●●●●●○○○         │  ← 7 tokens remaining
│                     │
│  Refill: +1/sec     │  ← Steady refill
│  Consume: -1/req    │  ← Each request drains
└─────────────────────┘
```

1. A request arrives — check if the bucket has enough tokens.
2. If yes: consume the tokens, allow the request.
3. If no: deny the request (bucket is empty).
4. Meanwhile, tokens refill at a constant rate up to the maximum capacity.

## Tradeoffs

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Burst tolerance** | ✅ Excellent | Can handle bursts up to bucket capacity |
| **Memory per key** | Medium | Stores token count + last refill timestamp |
| **Accuracy** | High | Exact token accounting |
| **Complexity** | Low | Simple to understand and implement |
| **Smoothing** | Moderate | Allows bursts, then enforces steady rate |

## When To Use

- **API rate limiting** where you want to allow short bursts (e.g., a user uploading multiple files at once)
- **Gaming** — action cooldowns that build up over time
- **Any scenario** where bursty traffic is acceptable as long as the average stays within limits

## Configuration

```typescript
interface TokenBucketConfig {
  capacity: number;        // Maximum tokens the bucket can hold
  refillRate: number;      // Tokens added per refill interval
  refillIntervalMs: number; // Milliseconds between refills
}
```

| Parameter | Example | Effect |
|-----------|---------|--------|
| `capacity: 10` | Bucket holds max 10 tokens | Allows bursts of up to 10 requests |
| `refillRate: 1` | 1 token added per interval | Steady-state rate = 1 req/interval |
| `refillIntervalMs: 1000` | Refill every 1 second | Combined with rate: 1 req/sec average |

## Code Example

```typescript
import { TokenBucket, MemoryStore } from 'ratekit';

const store = new MemoryStore();
const limiter = new TokenBucket(store, {
  capacity: 10,
  refillRate: 2,
  refillIntervalMs: 1000,
});

// In your request handler:
const result = await limiter.consume('user:123');

if (!result.allowed) {
  res.status(429).json({
    error: 'Too many requests',
    retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
  });
  return;
}

// Process the request...
```
