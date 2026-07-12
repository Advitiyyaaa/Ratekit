# AGENTS.md

## Project Overview

**RateKit** (working name) is two things living in one monorepo:

1. **`@ratekit/core`** — a standalone, framework-agnostic npm package implementing multiple rate-limiting algorithms (Token Bucket, Leaky Bucket, Fixed Window, Sliding Window Log, Sliding Window Counter) with pluggable storage backends (in-memory, Redis).
2. **`ratekit-web`** — a website, styled and structured like npmjs.com, for browsing algorithms, reading docs, running a live playground/benchmark demo, and (optionally) tracking published package stats.

The library is the product. The website is the storefront/docs/demo layer around it. **Do not let website concerns leak into the core library's API design.**

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Core library | TypeScript, zero runtime deps where possible | Must work in plain Node, no framework assumptions |
| Distributed store | Redis (via `ioredis`) | Required for atomicity — use Lua scripts (`EVAL`) for race-free increments, not read-then-write |
| In-memory store | Plain JS `Map` | Default for local/single-instance use |
| Website frontend | React + TypeScript (Vite, not CRA) | Vite is faster to build/dev than Create React App |
| Website backend | Node.js + Express | Serves docs content, algorithm metadata, playground API, stats |
| Website database | MongoDB (Mongoose) | Stores package metadata, playground usage stats, user accounts if added later |
| Styling | Tailwind CSS | Fast iteration, consistent design tokens |
| Testing | Vitest (unit), Testcontainers or `redis-memory-server` (integration w/ Redis) | Algorithm correctness must be tested under concurrency, not just single calls |
| Benchmarking | `tinybench` or custom harness | Used to produce the comparison data show on the website |
| Docs site (alt.) | Consider Docusaurus if the custom React site becomes too much overhead — flag this to the user if docs work balloons | Not default, but a valid pivot |

**Do not** use Mongo for the rate limiter's own counters — that's the website's database only, for storing *metadata*, not for the rate-limiting hot path.

---

## Monorepo Structure

```
ratekit/
├── packages/
│   └── core/                 # @ratekit/core — the published npm package
│       ├── src/
│       │   ├── algorithms/
│       │   │   ├── token-bucket.ts
│       │   │   ├── leaky-bucket.ts
│       │   │   ├── fixed-window.ts
│       │   │   ├── sliding-window-log.ts
│       │   │   └── sliding-window-counter.ts
│       │   ├── stores/
│       │   │   ├── memory-store.ts
│       │   │   └── redis-store.ts
│       │   ├── types.ts
│       │   └── index.ts
│       ├── test/
│       ├── benchmarks/
│       └── package.json
│
├── apps/
│   ├── web/                  # React frontend (npm-website-style UI)
│   └── api/                  # Express backend for the website
│
├── docs/                     # Markdown docs consumed by apps/web
├── AGENTS.md
└── package.json              # workspace root (npm workspaces or pnpm)
```

Use **npm workspaces** or **pnpm workspaces** to manage this — don't hand-roll cross-package linking.

---

## Core Library — Design Rules

1. **Strategy pattern**: every algorithm implements the same interface:
   ```ts
   interface RateLimiter {
     consume(key: string, points?: number): Promise<RateLimitResult>;
   }
   interface RateLimitResult {
     allowed: boolean;
     remaining: number;
     resetAt: number; // epoch ms
   }
   ```
2. **Storage is injected, not hardcoded.** Every algorithm takes a `Store` in its constructor. Never import Redis directly inside an algorithm file.
3. **Concurrency correctness is non-negotiable.** For the Redis store, use Lua scripts for check-and-increment so two simultaneous requests can't both pass when only one should. Do not implement this as separate `GET` then `SET` calls.
4. **No framework middleware baked into core.** Express/Fastify/Koa adapters (if built) go in a separate optional package (`@ratekit/express`), not in `core`.
5. **Every algorithm needs**: unit tests (single-threaded correctness), concurrency tests (parallel requests against Redis), and a benchmark entry (memory + latency under burst load).

---

## Website — Design Rules

1. Visual reference is npmjs.com: package/algorithm cards, search, a detail page per algorithm with usage examples and copy-paste install commands, and a version/changelog section.
2. Add a **playground**: user picks an algorithm + params (capacity, refill rate, window size), fires simulated requests, and sees a live chart of allowed vs. throttled requests. This is the single best feature for making the project demo-able in an interview — prioritize it.
3. Docs content should be authored in Markdown under `/docs` and rendered by the web app, not hardcoded into JSX — keeps content and UI separable.
4. Keep `apps/api` thin: serve docs/metadata, proxy playground requests to a sandboxed instance of `@ratekit/core`, log usage stats to Mongo. No business logic that belongs in `core`.

---

## Commands (fill in once scaffolded)

```bash
# install all workspaces
npm install

# run core library tests
npm run test -w packages/core

# run core benchmarks
npm run bench -w packages/core

# run website dev servers
npm run dev -w apps/web
npm run dev -w apps/api

# lint/typecheck everything
npm run lint
npm run typecheck
```

---

## Conventions

- TypeScript strict mode on everywhere (`strict: true`).
- No `any` in `packages/core` — this is a library other developers will trust; type safety is part of the pitch.
- Every public function in `core` needs a TSDoc comment (these can be surfaced on the docs site later).
- Commit convention: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `bench:`) — makes changelog generation trivial later via `changesets` or `semantic-release`.
- Use `changesets` for versioning `@ratekit/core` once it's published — don't hand-bump versions.

---

## What NOT to do

- Don't add Mongo/Express dependencies inside `packages/core` — it must stay publishable and dependency-light.
- Don't skip concurrency tests for the Redis-backed algorithms — this is the whole technical credibility of the project.
- Don't over-build the website before the core library has at least 3 working, tested algorithms. Library correctness first, storefront polish second.
- Don't invent a new algorithm variant without documenting the tradeoff it's solving (accuracy vs memory vs burst tolerance) — every algorithm's README section should state its tradeoff explicitly.
