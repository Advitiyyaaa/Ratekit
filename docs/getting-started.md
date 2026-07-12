---
title: Getting Started
description: Install ratekit and start rate-limiting in under 5 minutes.
order: 0
---

# Getting Started

## Installation

```bash
npm install ratekit
```

If you plan to use Redis as the storage backend (for distributed rate limiting), also install `ioredis`:

```bash
npm install ratekit ioredis
```

## Quick Start

```typescript
import { TokenBucket, MemoryStore } from 'ratekit';

// Create a store (in-memory for single-instance use)
const store = new MemoryStore();

// Create a rate limiter
const limiter = new TokenBucket(store, {
  capacity: 10,          // max 10 tokens
  refillRate: 1,          // add 1 token...
  refillIntervalMs: 1000, // ...every second
});

// Check rate limit
const result = await limiter.consume('user:123');

if (result.allowed) {
  console.log(`Request allowed. ${result.remaining} remaining.`);
} else {
  console.log(`Rate limited. Try again at ${new Date(result.resetAt)}`);
}
```

## Choosing an Algorithm

| Algorithm | Best For | Memory | Accuracy | Burst Handling |
|-----------|----------|--------|----------|----------------|
| **Token Bucket** | APIs needing burst tolerance | Medium | High | ✅ Allows bursts |
| **Leaky Bucket** | Smoothing traffic to constant rate | Medium | High | ❌ No bursts |
| **Fixed Window** | Simple quotas (daily/hourly) | Low | Low | ⚠️ Boundary spikes |
| **Sliding Window Log** | Login attempts, precision-critical | High (O(n)) | Exact | ❌ No bursts |
| **Sliding Window Counter** | General-purpose (recommended) | Low | Approximate | ⚠️ Smoothed |

## Using Redis (Distributed)

```typescript
import Redis from 'ioredis';
import { SlidingWindowCounter, RedisStore } from 'ratekit';

const redis = new Redis('redis://localhost:6379');
const store = new RedisStore(redis);

const limiter = new SlidingWindowCounter(store, {
  maxRequests: 100,
  windowMs: 60_000, // 100 requests per minute
});
```

## The RateLimitResult

Every `consume()` call returns the same shape:

```typescript
interface RateLimitResult {
  allowed: boolean;    // Was the request allowed?
  remaining: number;   // How many requests/points are left?
  resetAt: number;     // When does the limit reset? (epoch ms)
}
```
