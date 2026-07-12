import { Router } from 'express';
import {
  MemoryStore,
  TokenBucket,
  LeakyBucket,
  FixedWindow,
  SlidingWindowLog,
  SlidingWindowCounter,
} from 'ratekit';
import type { RateLimiter } from 'ratekit';

const router = Router();

interface SimulationRequest {
  algorithm: string;
  config: Record<string, number>;
  totalRequests: number;
  requestsPerSecond: number;
}

interface SimulationTick {
  time: number;
  allowed: number;
  denied: number;
  remaining: number;
  totalAllowed: number;
  totalDenied: number;
}

/**
 * Create a rate limiter instance from algorithm name and config.
 */
function createLimiter(
  algorithm: string,
  config: Record<string, number>,
  store: MemoryStore,
): RateLimiter {
  switch (algorithm) {
    case 'token-bucket':
      return new TokenBucket(store, {
        capacity: config['capacity'] ?? 10,
        refillRate: config['refillRate'] ?? 1,
        refillIntervalMs: config['refillIntervalMs'] ?? 1000,
      });
    case 'leaky-bucket':
      return new LeakyBucket(store, {
        capacity: config['capacity'] ?? 10,
        leakRate: config['leakRate'] ?? 1,
        leakIntervalMs: config['leakIntervalMs'] ?? 1000,
      });
    case 'fixed-window':
      return new FixedWindow(store, {
        maxRequests: config['maxRequests'] ?? 10,
        windowMs: config['windowMs'] ?? 10000,
      });
    case 'sliding-window-log':
      return new SlidingWindowLog(store, {
        maxRequests: config['maxRequests'] ?? 5,
        windowMs: config['windowMs'] ?? 10000,
      });
    case 'sliding-window-counter':
      return new SlidingWindowCounter(store, {
        maxRequests: config['maxRequests'] ?? 10,
        windowMs: config['windowMs'] ?? 10000,
      });
    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }
}

/**
 * POST /api/playground/simulate
 *
 * Run a rate-limit simulation with the specified algorithm and config.
 * Returns a timeline of allowed/denied requests per tick for charting.
 */
router.post('/simulate', async (req, res) => {
  try {
    const {
      algorithm,
      config,
      totalRequests,
      requestsPerSecond,
    } = req.body as SimulationRequest;

    // Validate inputs
    if (!algorithm || !config || !totalRequests || !requestsPerSecond) {
      res.status(400).json({
        error: 'Missing required fields: algorithm, config, totalRequests, requestsPerSecond',
      });
      return;
    }

    if (totalRequests > 5000) {
      res.status(400).json({ error: 'totalRequests must be ≤ 5000' });
      return;
    }

    if (requestsPerSecond > 200) {
      res.status(400).json({ error: 'requestsPerSecond must be ≤ 200' });
      return;
    }

    // Create a sandboxed store and limiter
    const store = new MemoryStore();
    const limiter = createLimiter(algorithm, config, store);

    // Simulate requests
    const tickIntervalMs = 1000; // Report results every 1 second
    const requestsPerTick = Math.ceil(requestsPerSecond);
    const totalTicks = Math.ceil(totalRequests / requestsPerTick);
    const timeline: SimulationTick[] = [];

    let totalAllowed = 0;
    let totalDenied = 0;
    let requestsSent = 0;

    for (let tick = 0; tick < totalTicks; tick++) {
      let tickAllowed = 0;
      let tickDenied = 0;
      let lastRemaining = 0;

      const requestsThisTick = Math.min(
        requestsPerTick,
        totalRequests - requestsSent,
      );

      for (let r = 0; r < requestsThisTick; r++) {
        const result = await limiter.consume('simulation-key');
        if (result.allowed) {
          tickAllowed++;
          totalAllowed++;
        } else {
          tickDenied++;
          totalDenied++;
        }
        lastRemaining = result.remaining;
        requestsSent++;
      }

      timeline.push({
        time: (tick + 1) * tickIntervalMs,
        allowed: tickAllowed,
        denied: tickDenied,
        remaining: lastRemaining,
        totalAllowed,
        totalDenied,
      });
    }

    res.json({
      algorithm,
      config,
      totalRequests: requestsSent,
      requestsPerSecond,
      summary: { totalAllowed, totalDenied },
      timeline,
    });
  } catch (error) {
    console.error('Simulation error:', error);
    const message = error instanceof Error ? error.message : 'Simulation failed';
    res.status(500).json({ error: message });
  }
});

export default router;
