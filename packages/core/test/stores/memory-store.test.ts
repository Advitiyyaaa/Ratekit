import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStore } from '../../src/stores/memory-store.js';

describe('MemoryStore', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  describe('get / set', () => {
    it('should return null for a non-existent key', async () => {
      expect(await store.get('missing')).toBeNull();
    });

    it('should store and retrieve a value', async () => {
      await store.set('key1', 'value1');
      expect(await store.get('key1')).toBe('value1');
    });

    it('should overwrite an existing value', async () => {
      await store.set('key1', 'value1');
      await store.set('key1', 'value2');
      expect(await store.get('key1')).toBe('value2');
    });

    it('should expire a key after TTL', async () => {
      await store.set('key1', 'value1', 50);
      expect(await store.get('key1')).toBe('value1');

      // Wait for TTL to pass
      await new Promise((r) => setTimeout(r, 60));
      expect(await store.get('key1')).toBeNull();
    });

    it('should not expire a key before TTL', async () => {
      await store.set('key1', 'value1', 200);
      await new Promise((r) => setTimeout(r, 20));
      expect(await store.get('key1')).toBe('value1');
    });
  });

  describe('increment', () => {
    it('should initialize to 1 on first increment', async () => {
      expect(await store.increment('counter')).toBe(1);
    });

    it('should increment existing value', async () => {
      await store.set('counter', '5');
      expect(await store.increment('counter')).toBe(6);
    });

    it('should increment by a custom amount', async () => {
      expect(await store.increment('counter', 5)).toBe(5);
      expect(await store.increment('counter', 3)).toBe(8);
    });

    it('should preserve TTL on increment', async () => {
      await store.set('counter', '1', 200);
      await store.increment('counter');
      // Value should still be accessible
      expect(await store.get('counter')).toBe('2');
    });
  });

  describe('list operations', () => {
    it('should push and range correctly', async () => {
      await store.lpush('list', 'a');
      await store.lpush('list', 'b');
      await store.lpush('list', 'c');

      const all = await store.lrange('list', 0, -1);
      expect(all).toEqual(['c', 'b', 'a']);
    });

    it('should support lrange with start and stop', async () => {
      await store.lpush('list', 'a');
      await store.lpush('list', 'b');
      await store.lpush('list', 'c');

      expect(await store.lrange('list', 0, 1)).toEqual(['c', 'b']);
      expect(await store.lrange('list', 1, 2)).toEqual(['b', 'a']);
    });

    it('should trim a list', async () => {
      await store.lpush('list', 'a');
      await store.lpush('list', 'b');
      await store.lpush('list', 'c');

      await store.ltrim('list', 0, 1);
      expect(await store.lrange('list', 0, -1)).toEqual(['c', 'b']);
    });

    it('should return empty array for non-existent list', async () => {
      expect(await store.lrange('nope', 0, -1)).toEqual([]);
    });
  });

  describe('eval', () => {
    it('should throw an error', async () => {
      await expect(store.eval('script', [], [])).rejects.toThrow(
        'MemoryStore does not support eval()',
      );
    });
  });

  describe('pexpire', () => {
    it('should set expiry on an existing key', async () => {
      await store.set('key1', 'value1');
      await store.pexpire('key1', 50);
      expect(await store.get('key1')).toBe('value1');

      await new Promise((r) => setTimeout(r, 60));
      expect(await store.get('key1')).toBeNull();
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      await store.set('key1', 'value1');
      await store.del('key1');
      expect(await store.get('key1')).toBeNull();
    });

    it('should delete a list', async () => {
      await store.lpush('list', 'a');
      await store.del('list');
      expect(await store.lrange('list', 0, -1)).toEqual([]);
    });
  });
});
