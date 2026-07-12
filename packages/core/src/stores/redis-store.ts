import type { Store } from '../types.js';

/**
 * Redis-backed implementation of the {@link Store} interface.
 *
 * @remarks
 * Wraps an injected `ioredis` client instance — does **not** import or
 * instantiate ioredis itself. This keeps the core library free of hard
 * Redis dependencies; consumers provide their own client.
 *
 * All operations delegate directly to Redis commands, and `eval()` is
 * used for Lua script execution to ensure atomic rate-limit checks.
 *
 * @example
 * ```ts
 * import Redis from 'ioredis';
 * import { RedisStore, TokenBucket } from 'ratekit';
 *
 * const redis = new Redis();
 * const store = new RedisStore(redis);
 * const limiter = new TokenBucket(store, {
 *   capacity: 10,
 *   refillRate: 1,
 *   refillIntervalMs: 1000,
 * });
 * ```
 */
export class RedisStore implements Store {
  /**
   * The minimal interface we need from an ioredis client.
   * Using this instead of importing the ioredis type directly
   * keeps the compile-time dependency optional.
   * @internal
   */
  private readonly client: RedisClient;

  /**
   * Create a new RedisStore.
   * @param client - An ioredis-compatible client instance.
   */
  constructor(client: RedisClient) {
    this.client = client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlMs?: number): Promise<void> {
    if (ttlMs !== undefined) {
      await this.client.set(key, value, 'PX', ttlMs);
    } else {
      await this.client.set(key, value);
    }
  }

  async increment(key: string, amount = 1): Promise<number> {
    if (amount === 1) {
      return this.client.incr(key);
    }
    return this.client.incrby(key, amount);
  }

  async lpush(key: string, value: string): Promise<void> {
    await this.client.lpush(key, value);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    await this.client.ltrim(key, start, stop);
  }

  async eval(
    script: string,
    keys: string[],
    args: string[],
  ): Promise<unknown> {
    return this.client.eval(script, keys.length, ...keys, ...args);
  }

  async pexpire(key: string, ms: number): Promise<void> {
    await this.client.pexpire(key, ms);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}

/**
 * Minimal interface an ioredis-compatible client must satisfy.
 *
 * @remarks
 * We define this locally instead of importing from `ioredis` so that
 * TypeScript compilation doesn't require ioredis to be installed.
 * Any client implementing these methods will work.
 */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: (string | number)[]): Promise<unknown>;
  incr(key: string): Promise<number>;
  incrby(key: string, amount: number): Promise<number>;
  lpush(key: string, ...values: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  ltrim(key: string, start: number, stop: number): Promise<unknown>;
  eval(script: string, numkeys: number, ...args: (string | number)[]): Promise<unknown>;
  pexpire(key: string, ms: number): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
}
