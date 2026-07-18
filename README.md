<div align="center">

# RateKit ⚡

**High-performance, framework-agnostic rate limiting library for TypeScript & Node.js.**

[![npm version](https://img.shields.io/badge/npm-v0.1.1-blue.svg)](https://www.npmjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-51%20passed-brightgreen.svg)](https://vitest.dev/)

[Interactive Playground & Docs](https://github.com/Advitiyyaaa/Ratekit) • [Algorithms](#-algorithms-comparison) • [Quick Start](#-quick-start) • [Storage Backends](#-storage-backends)

</div>

---

## ✨ Highlights

- 🧮 **5 Algorithms Built-In**: Token Bucket, Leaky Bucket, Fixed Window, Sliding Window Log, and Sliding Window Counter.
- 🚀 **Zero Dependencies**: Core library runtime is lightweight, strict TypeScript, and works in any JavaScript/Node.js environment.
- 🔒 **Concurrency Correct**: Atomic Redis implementation using Lua scripts (`EVAL`) for race-free check-and-increment operations under high load.
- 🔌 **Pluggable Storage**: Strategy pattern allows swapping between JS `MemoryStore`, `RedisStore`, or custom storage adapters.
- 🎨 **Interactive Demo App**: Monorepo includes a 100% static React + Vite web playground with real-time algorithm visualizer and documentation.

---

## 📦 Monorepo Structure

```
ratekit/
├── packages/
│   └── core/                 # @ratekit/core — published npm library
│       ├── src/
│       │   ├── algorithms/   # TokenBucket, LeakyBucket, FixedWindow, SlidingWindowLog, SlidingWindowCounter
│       │   ├── stores/       # MemoryStore, RedisStore
│       │   └── types.ts      # RateLimiter, Store, RateLimitResult
│       └── test/             # 51 unit & concurrency tests
├── apps/
│   └── web/                  # React + Vite static docs site & interactive simulation playground
└── docs/                     # Documentation guide & algorithm deep dives
```

---

## ⚡ Quick Start

### Installation

```bash
npm install ratekit
```

### Basic Usage (In-Memory)

```typescript
import { TokenBucket, MemoryStore } from 'ratekit';

// Instantiate an in-memory store
const store = new MemoryStore();

// Create a Token Bucket rate limiter (10 capacity, 2 tokens refilled per second)
const limiter = new TokenBucket(store, {
  capacity: 10,
  refillRate: 2,
  refillIntervalMs: 1000,
});

async function handleRequest(userId: string) {
  const result = await limiter.consume(userId);

  if (result.allowed) {
    console.log(`Allowed! Remaining tokens: ${result.remaining}`);
  } else {
    console.log(`Rate limited! Try again at epoch: ${result.resetAt}`);
  }
}
```

### Distributed Usage (Redis)

```typescript
import { SlidingWindowCounter, RedisStore } from 'ratekit';
import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL);
const store = new RedisStore(redisClient);

// Create a Sliding Window Counter rate limiter (100 requests per 60s window)
const limiter = new SlidingWindowCounter(store, {
  maxRequests: 100,
  windowMs: 60000,
});

const result = await limiter.consume(`user:${userId}`);
```

---

## 📊 Algorithms Comparison

| Algorithm | Category | Time Complexity | Burst Tolerance | Accuracy | Tradeoff Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Token Bucket** | Bucket | O(1) | Excellent | Good | Allows controlled bursts up to bucket capacity; smooth token refill. |
| **Leaky Bucket** | Bucket | O(1) | Damped | High | Smooths out bursty traffic into constant output rate; queue overhead. |
| **Fixed Window** | Window | O(1) | Poor | Approximate | Minimal memory footprint; susceptible to boundary burst spikes. |
| **Sliding Window Log** | Window | O(n) | Natural | Exact | 100% exact boundary precision; O(n) memory overhead per request timestamp. |
| **Sliding Window Counter** | Window | O(1) | Smoothed | Approximate | Best general-purpose balance of O(1) memory and smooth sliding window precision. |

---

## 🛠️ Unified API Interface

Every rate limiter in `@ratekit/core` implements the `RateLimiter` interface:

```typescript
export interface RateLimiter {
  consume(key: string, points?: number): Promise<RateLimitResult>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Epoch ms timestamp
}
```

---

## 🛠️ Storage Backends

RateKit decouples storage from algorithms using the `Store` interface:

```typescript
export interface Store {
  get(key: string): Promise<Record<string, unknown> | null>;
  set(key: string, value: Record<string, unknown>, ttlMs?: number): Promise<void>;
  // Additional atomic helpers...
}
```

- `MemoryStore`: Built-in JS Map-based store, ideal for single-node services or unit testing.
- `RedisStore`: Distributed store powered by `ioredis` with Lua script execution for zero race conditions.

---

## 🧪 Testing & Development

```bash
# Install all workspace dependencies
npm install

# Run core library unit tests (51 tests)
npm run test

# Typecheck monorepo
npm run typecheck

# Build core library and static website
npm run build

# Start local web development server
npm run dev
```

---

## 📄 License

[MIT](LICENSE) © Advitiyyaaa
