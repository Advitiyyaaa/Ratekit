import { Bench } from 'tinybench';
import { MemoryStore } from '../src/stores/memory-store.js';
import { TokenBucket } from '../src/algorithms/token-bucket.js';
import { LeakyBucket } from '../src/algorithms/leaky-bucket.js';
import { FixedWindow } from '../src/algorithms/fixed-window.js';
import { SlidingWindowLog } from '../src/algorithms/sliding-window-log.js';
import { SlidingWindowCounter } from '../src/algorithms/sliding-window-counter.js';

async function main() {
  console.log('🚀 RateKit Benchmark Suite');
  console.log('='.repeat(60));
  console.log(`Store: MemoryStore | Date: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  console.log();

  const bench = new Bench({
    time: 5000,      // 5 seconds per benchmark
    iterations: 1,   // minimum 1 iteration (time-based)
    warmupTime: 1000, // 1 second warmup
  });

  // Each algorithm gets its own store and unique keys to avoid interference
  const tbStore = new MemoryStore();
  const tbLimiter = new TokenBucket(tbStore, {
    capacity: 100,
    refillRate: 10,
    refillIntervalMs: 1000,
  });
  let tbCounter = 0;

  const lbStore = new MemoryStore();
  const lbLimiter = new LeakyBucket(lbStore, {
    capacity: 100,
    leakRate: 10,
    leakIntervalMs: 1000,
  });
  let lbCounter = 0;

  const fwStore = new MemoryStore();
  const fwLimiter = new FixedWindow(fwStore, {
    maxRequests: 1_000_000,
    windowMs: 60_000,
  });
  let fwCounter = 0;

  const swlStore = new MemoryStore();
  const swlLimiter = new SlidingWindowLog(swlStore, {
    maxRequests: 100,      // SWL is designed for low-volume, precision-critical limits
    windowMs: 60_000,
  });
  let swlCounter = 0;

  const swcStore = new MemoryStore();
  const swcLimiter = new SlidingWindowCounter(swcStore, {
    maxRequests: 1_000_000,
    windowMs: 60_000,
  });
  let swcCounter = 0;

  bench
    .add('Token Bucket', async () => {
      // Use rotating keys to simulate realistic multi-tenant usage
      await tbLimiter.consume(`key:${tbCounter++ % 100}`);
    })
    .add('Leaky Bucket', async () => {
      await lbLimiter.consume(`key:${lbCounter++ % 100}`);
    })
    .add('Fixed Window', async () => {
      await fwLimiter.consume(`key:${fwCounter++ % 100}`);
    })
    .add('Sliding Window Log', async () => {
      await swlLimiter.consume(`key:${swlCounter++ % 100}`);
    })
    .add('Sliding Window Counter', async () => {
      await swcLimiter.consume(`key:${swcCounter++ % 100}`);
    });

  console.log('Running benchmarks (this may take ~30 seconds)...\n');
  await bench.run();

  // Format results
  console.log('Results:');
  console.log('-'.repeat(75));
  console.log(
    'Algorithm'.padEnd(25),
    'ops/sec'.padStart(12),
    'avg (ms)'.padStart(12),
    'p99 (ms)'.padStart(12),
    'samples'.padStart(10),
  );
  console.log('-'.repeat(75));

  for (const task of bench.tasks) {
    const result = task.result;
    if (!result) continue;

    const opsPerSec = Math.round(result.hz).toLocaleString();
    const avgMs = (result.mean * 1000).toFixed(4);
    const p99Ms = (result.p99 * 1000).toFixed(4);
    const samples = result.samples.length.toLocaleString();

    console.log(
      task.name.padEnd(25),
      opsPerSec.padStart(12),
      avgMs.padStart(12),
      p99Ms.padStart(12),
      samples.padStart(10),
    );
  }

  console.log('-'.repeat(75));
  console.log('\n✅ Benchmark complete.');
}

main().catch(console.error);
