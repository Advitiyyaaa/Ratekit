import type { Store } from '../types.js';

/**
 * Entry stored in the in-memory map.
 * @internal
 */
interface MemoryEntry {
  value: string;
  expiresAt: number | null;
}

/**
 * In-memory implementation of the {@link Store} interface.
 *
 * @remarks
 * Uses a plain `Map` for storage with lazy TTL expiration (entries are
 * checked and evicted on read). Suitable for single-instance / local
 * development. Not suitable for distributed or multi-process deployments.
 *
 * @example
 * ```ts
 * import { MemoryStore, TokenBucket } from 'ratekit';
 *
 * const store = new MemoryStore();
 * const limiter = new TokenBucket(store, {
 *   capacity: 10,
 *   refillRate: 1,
 *   refillIntervalMs: 1000,
 * });
 * ```
 */
export class MemoryStore implements Store {
  /** @internal */
  private readonly data = new Map<string, MemoryEntry>();

  /** @internal */
  private readonly lists = new Map<string, string[]>();

  /**
   * Check if an entry exists and hasn't expired.
   * Evicts the entry if it has expired (lazy expiration).
   * @internal
   */
  private isAlive(entry: MemoryEntry | undefined): entry is MemoryEntry {
    if (!entry) return false;
    if (entry.expiresAt !== null && Date.now() >= entry.expiresAt) {
      return false;
    }
    return true;
  }

  /**
   * Evict a key if its entry has expired.
   * @internal
   */
  private evictIfExpired(key: string): void {
    const entry = this.data.get(key);
    if (entry && entry.expiresAt !== null && Date.now() >= entry.expiresAt) {
      this.data.delete(key);
    }
  }

  async get(key: string): Promise<string | null> {
    this.evictIfExpired(key);
    const entry = this.data.get(key);
    if (!this.isAlive(entry)) {
      this.data.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlMs?: number): Promise<void> {
    const expiresAt = ttlMs !== undefined ? Date.now() + ttlMs : null;
    this.data.set(key, { value, expiresAt });
  }

  async increment(key: string, amount = 1): Promise<number> {
    this.evictIfExpired(key);
    const entry = this.data.get(key);
    let current = 0;
    let expiresAt: number | null = null;

    if (this.isAlive(entry)) {
      current = parseInt(entry.value, 10);
      if (isNaN(current)) current = 0;
      expiresAt = entry.expiresAt;
    }

    const newValue = current + amount;
    this.data.set(key, { value: String(newValue), expiresAt });
    return newValue;
  }

  async lpush(key: string, value: string): Promise<void> {
    const list = this.lists.get(key) ?? [];
    list.unshift(value);
    this.lists.set(key, list);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.lists.get(key) ?? [];
    const end = stop === -1 ? list.length : stop + 1;
    return list.slice(start, end);
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    const list = this.lists.get(key) ?? [];
    const end = stop === -1 ? list.length : stop + 1;
    this.lists.set(key, list.slice(start, end));
  }

  async eval(
    _script: string,
    _keys: string[],
    _args: string[],
  ): Promise<unknown> {
    throw new Error(
      'MemoryStore does not support eval(). Lua scripts are Redis-only. ' +
        'Algorithms should use standard Store methods for the memory path.',
    );
  }

  async pexpire(key: string, ms: number): Promise<void> {
    const entry = this.data.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + ms;
    }
    // Also handle lists — store their expiry in the data map
    if (this.lists.has(key)) {
      this.data.set(key, {
        value: '__list__',
        expiresAt: Date.now() + ms,
      });
    }
  }

  async del(key: string): Promise<void> {
    this.data.delete(key);
    this.lists.delete(key);
  }
}
