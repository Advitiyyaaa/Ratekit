# RateKit

[![npm version](https://img.shields.io/npm/v/ratekit)](https://www.npmjs.com/package/ratekit)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-51%20passing-brightgreen)](https://github.com/your-username/ratekit)

**Framework-agnostic rate-limiting library** for Node.js with multiple algorithms and pluggable storage backends.

```ts
import { TokenBucket, MemoryStore } from 'ratekit';

const store = new MemoryStore();
const limiter = new TokenBucket(store, { capacity: 10, refillRate: 1, refillIntervalMs: 1000 });

const result = await limiter.consume('user:123');
// { allowed: true, remaining: 9, resetAt: 1720000000000 }
```

---

## Features

- **5 algorithms** — Token Bucket, Leaky Bucket, Fixed Window, Sliding Window Log, Sliding Window Counter
- **2 storage backends** — In-memory (default) and Redis (via [ioredis](https://github.com/redis/ioredis))
- **Concurrency-safe** — Redis backend uses Lua scripts for atomic check-and-increment
- **Framework-agnostic** — zero framework dependencies; works with Express, Fastify, Koa, or plain Node.js
- **TypeScript-first** — full type definitions, strict mode, no `any`
- **Zero runtime dependencies** — the in-memory store has no dependencies at all

---

## Installation

```bash
npm install ratekit
```

For Redis support, install ioredis as a peer dependency:

```bash
npm install ratekit ioredis
```

---

## Algorithms

Each algorithm implements the same interface:

```ts
interface RateLimiter {
  consume(key: string, points?: number): Promise<RateLimitResult>;
}

interface RateLimitResult {
  allowed: boolean;   // Whether this request was permitted
  remaining: number;  // Remaining quota in the current window/bucket
  resetAt: number;    // Epoch ms when the quota resets
}
```

### Token Bucket

Allows controlled bursts up to `capacity` while enforcing a steady average rate via refills.

```ts
import { TokenBucket, MemoryStore } from 'ratekit';

const limiter = new TokenBucket(new MemoryStore(), {
  capacity: 10,          // Max tokens the bucket can hold
  refillRate: 1,         // Tokens added per interval
  refillIntervalMs: 1000 // Refill every 1 second
});

const result = await limiter.consume('user:123');
```

**Tradeoff**: Higher memory per key (stores tokens + timestamp), but allows bursty traffic patterns.

---

### Leaky Bucket

Smooths traffic to a constant output rate — no bursts allowed.

```ts
import { LeakyBucket, MemoryStore } from 'ratekit';

const limiter = new LeakyBucket(new MemoryStore(), {
  capacity: 10,          // Max queue depth
  leakRate: 1,           // Requests drained per interval
  leakIntervalMs: 1000   // Drain every 1 second
});
```

**Tradeoff**: Perfect output smoothing but no burst flexibility.

---

### Fixed Window

Simplest rate limiter — one counter per time window.

```ts
import { FixedWindow, MemoryStore } from 'ratekit';

const limiter = new FixedWindow(new MemoryStore(), {
  maxRequests: 100,   // Max requests per window
  windowMs: 60_000    // 1-minute window
});
```

**Tradeoff**: Lowest memory, but a 2× burst is possible at window boundaries.

---

### Sliding Window Log

Most accurate — tracks every request timestamp.

```ts
import { SlidingWindowLog, MemoryStore } from 'ratekit';

const limiter = new SlidingWindowLog(new MemoryStore(), {
  maxRequests: 100,
  windowMs: 60_000
});
```

**Tradeoff**: Exact precision, but O(n) memory per key. Best for low-volume, high-accuracy limits.

---

### Sliding Window Counter *(recommended)*

Best general-purpose choice — approximates a sliding window with O(1) memory using weighted counters.

```ts
import { SlidingWindowCounter, MemoryStore } from 'ratekit';

const limiter = new SlidingWindowCounter(new MemoryStore(), {
  maxRequests: 100,
  windowMs: 60_000
});
```

**Tradeoff**: Great balance of accuracy, memory, and simplicity. Small approximation error at window edges.

---

## Storage Backends

### MemoryStore (default)

In-process memory. Zero dependencies. Use for single-instance deployments or local development.

```ts
import { MemoryStore } from 'ratekit';

const store = new MemoryStore();
```

### RedisStore

Distributed, concurrency-safe storage using Lua scripts for atomic operations. Requires `ioredis`.

```ts
import { RedisStore } from 'ratekit';
import Redis from 'ioredis';

const redis = new Redis({ host: 'localhost', port: 6379 });
const store = new RedisStore(redis);
```

All algorithms work with either store — swap without changing algorithm code.

---

## Express Middleware Example

```ts
import express from 'express';
import { SlidingWindowCounter, MemoryStore } from 'ratekit';

const app = express();
const store = new MemoryStore();
const limiter = new SlidingWindowCounter(store, { maxRequests: 100, windowMs: 60_000 });

app.use(async (req, res, next) => {
  const key = req.ip ?? 'anonymous';
  const result = await limiter.consume(key);

  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', result.resetAt);

  if (!result.allowed) {
    res.status(429).json({ error: 'Too Many Requests' });
    return;
  }
  next();
});
```

---

## Algorithm Comparison

| Algorithm | Memory | Burst | Accuracy | Best For |
|---|---|---|---|---|
| Token Bucket | O(1) | ✅ Excellent | High | APIs needing burst tolerance |
| Leaky Bucket | O(1) | ❌ None | High | Smoothing traffic to downstream services |
| Fixed Window | O(1) | ⚠️ Boundary spikes | Low | Coarse, simple limits |
| Sliding Window Log | O(n) | ✅ Natural | Exact | Low-volume, high-precision limits |
| **Sliding Window Counter** | **O(1)** | **✅ Smoothed** | **Approximate** | **General purpose** ✨ |

---

## TypeScript

Full TypeScript support with strict types:

```ts
import type { RateLimiter, RateLimitResult, Store } from 'ratekit';

function applyLimit(limiter: RateLimiter, key: string): Promise<RateLimitResult> {
  return limiter.consume(key);
}
```

---

## License

MIT © 2025 Advitiya Arya
