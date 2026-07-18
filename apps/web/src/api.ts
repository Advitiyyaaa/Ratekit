import { marked } from 'marked';
import {
  MemoryStore,
  TokenBucket,
  LeakyBucket,
  FixedWindow,
  SlidingWindowLog,
  SlidingWindowCounter,
  type RateLimiter,
} from 'ratekit';

// ─── Types ──────────────────────────────────────────────────────────────

export interface ConfigField {
  name: string;
  type: 'number';
  label: string;
  description: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
}

export interface Algorithm {
  _id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
  burstTolerance: string;
  accuracy: string;
  recommended: boolean;
  tradeoffs: string;
  configFields: ConfigField[];
}

export interface DocMeta {
  slug: string;
  title: string;
  description: string;
  order?: number;
  algorithm?: string;
}

export interface DocContent {
  meta: Record<string, unknown>;
  html: string;
  markdown: string;
}

export interface SimulationTick {
  time: number;
  allowed: number;
  denied: number;
  remaining: number;
  totalAllowed: number;
  totalDenied: number;
}

export interface SimulationResult {
  algorithm: string;
  config: Record<string, number>;
  totalRequests: number;
  requestsPerSecond: number;
  summary: { totalAllowed: number; totalDenied: number };
  timeline: SimulationTick[];
}

// ─── Static Algorithm Metadata (100% Identical to DB Seed Data) ────────

const ALGORITHMS: Algorithm[] = [
  {
    _id: 'token-bucket',
    slug: 'token-bucket',
    name: 'Token Bucket',
    description:
      'Allows controlled bursts up to bucket capacity while enforcing a steady average rate. Excellent for APIs needing burst tolerance.',
    category: 'Bucket',
    complexity: 'O(1)',
    burstTolerance: 'Excellent',
    accuracy: 'High',
    recommended: false,
    tradeoffs:
      'Higher memory per key (stores tokens + timestamp) but allows bursty traffic patterns.',
    configFields: [
      {
        name: 'capacity',
        type: 'number',
        label: 'Capacity',
        description: 'Maximum tokens the bucket can hold',
        defaultValue: 10,
        min: 1,
        max: 1000,
        step: 1,
      },
      {
        name: 'refillRate',
        type: 'number',
        label: 'Refill Rate',
        description: 'Tokens added per refill interval',
        defaultValue: 1,
        min: 1,
        max: 100,
        step: 1,
      },
      {
        name: 'refillIntervalMs',
        type: 'number',
        label: 'Refill Interval (ms)',
        description: 'Milliseconds between token refills',
        defaultValue: 1000,
        min: 100,
        max: 60000,
        step: 100,
      },
    ],
  },
  {
    _id: 'leaky-bucket',
    slug: 'leaky-bucket',
    name: 'Leaky Bucket',
    description:
      'Smooths traffic to a constant output rate — no bursts allowed. Ideal for downstream services that cannot handle spikes.',
    category: 'Bucket',
    complexity: 'O(1)',
    burstTolerance: 'None',
    accuracy: 'High',
    recommended: false,
    tradeoffs:
      'Perfect output smoothing but no burst flexibility. More complex state than fixed window.',
    configFields: [
      {
        name: 'capacity',
        type: 'number',
        label: 'Capacity',
        description: 'Maximum requests the bucket can hold',
        defaultValue: 10,
        min: 1,
        max: 1000,
        step: 1,
      },
      {
        name: 'leakRate',
        type: 'number',
        label: 'Leak Rate',
        description: 'Requests drained per leak interval',
        defaultValue: 1,
        min: 1,
        max: 100,
        step: 1,
      },
      {
        name: 'leakIntervalMs',
        type: 'number',
        label: 'Leak Interval (ms)',
        description: 'Milliseconds between drains',
        defaultValue: 1000,
        min: 100,
        max: 60000,
        step: 100,
      },
    ],
  },
  {
    _id: 'fixed-window',
    slug: 'fixed-window',
    name: 'Fixed Window',
    description:
      'Simplest rate limiter — one counter per time window. Lowest memory but vulnerable to boundary spikes.',
    category: 'Window',
    complexity: 'O(1)',
    burstTolerance: 'Boundary spikes',
    accuracy: 'Low',
    recommended: false,
    tradeoffs:
      'Simplest and lowest memory. But 2× burst possible at window edges. Good for coarse limits.',
    configFields: [
      {
        name: 'maxRequests',
        type: 'number',
        label: 'Max Requests',
        description: 'Maximum requests per window',
        defaultValue: 10,
        min: 1,
        max: 10000,
        step: 1,
      },
      {
        name: 'windowMs',
        type: 'number',
        label: 'Window (ms)',
        description: 'Window duration in milliseconds',
        defaultValue: 10000,
        min: 1000,
        max: 3600000,
        step: 1000,
      },
    ],
  },
  {
    _id: 'sliding-window-log',
    slug: 'sliding-window-log',
    name: 'Sliding Window Log',
    description:
      'Most accurate — tracks every request timestamp. O(n) memory but perfect precision for low-volume limits.',
    category: 'Window',
    complexity: 'O(n)',
    burstTolerance: 'Natural',
    accuracy: 'Exact',
    recommended: false,
    tradeoffs:
      'Exact precision but O(n) memory per key. Not suitable for high-volume keys.',
    configFields: [
      {
        name: 'maxRequests',
        type: 'number',
        label: 'Max Requests',
        description: 'Maximum requests in the sliding window',
        defaultValue: 5,
        min: 1,
        max: 1000,
        step: 1,
      },
      {
        name: 'windowMs',
        type: 'number',
        label: 'Window (ms)',
        description: 'Sliding window duration in milliseconds',
        defaultValue: 10000,
        min: 1000,
        max: 3600000,
        step: 1000,
      },
    ],
  },
  {
    _id: 'sliding-window-counter',
    slug: 'sliding-window-counter',
    name: 'Sliding Window Counter',
    description:
      'Best general-purpose choice. Approximates sliding window with O(1) memory using weighted counters.',
    category: 'Window',
    complexity: 'O(1)',
    burstTolerance: 'Smoothed',
    accuracy: 'Approximate',
    recommended: true,
    tradeoffs:
      'Great balance of accuracy, memory, and simplicity. Assumes even distribution in previous window.',
    configFields: [
      {
        name: 'maxRequests',
        type: 'number',
        label: 'Max Requests',
        description: 'Maximum requests in the sliding window',
        defaultValue: 10,
        min: 1,
        max: 10000,
        step: 1,
      },
      {
        name: 'windowMs',
        type: 'number',
        label: 'Window (ms)',
        description: 'Sliding window duration in milliseconds',
        defaultValue: 10000,
        min: 1000,
        max: 3600000,
        step: 1000,
      },
    ],
  },
];

// ─── API Functions (Client-Side Async) ──────────────────────────────────

export async function fetchAlgorithms(): Promise<Algorithm[]> {
  return Promise.resolve(ALGORITHMS);
}

export async function fetchAlgorithm(slug: string): Promise<Algorithm> {
  const found = ALGORITHMS.find((a) => a.slug === slug);
  if (!found) {
    return Promise.reject(new Error(`Algorithm not found: ${slug}`));
  }
  return Promise.resolve(found);
}

// ─── Markdown Docs Loader via Vite Glob ────────────────────────────────

const docFiles = import.meta.glob<string>('../../../docs/*.md', {
  query: '?raw',
  eager: true,
  import: 'default',
});

function parseFrontmatter(raw: string): { meta: Record<string, unknown>; content: string } {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = raw.match(frontmatterRegex);
  if (!match) {
    return { meta: {}, content: raw };
  }
  const yaml = match[1];
  const content = match[2];
  const meta: Record<string, unknown> = {};

  yaml.split(/\r?\n/).forEach((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      let val: unknown = line.slice(colonIdx + 1).trim();
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (!isNaN(Number(val)) && val !== '') val = Number(val);
      meta[key] = val;
    }
  });

  return { meta, content };
}

export async function fetchDocs(): Promise<DocMeta[]> {
  const docs: DocMeta[] = [];
  for (const [filepath, rawContent] of Object.entries(docFiles)) {
    const filename = filepath.split('/').pop() || '';
    const slug = filename.replace('.md', '');
    const parsed = parseFrontmatter(rawContent);
    docs.push({
      slug,
      title: (parsed.meta['title'] as string) || slug,
      description: (parsed.meta['description'] as string) || '',
      order: (parsed.meta['order'] as number) ?? 99,
      algorithm: (parsed.meta['algorithm'] as string) || undefined,
    });
  }
  docs.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  return Promise.resolve(docs);
}

export async function fetchDoc(slug: string): Promise<DocContent> {
  const targetKey = Object.keys(docFiles).find((k) => k.endsWith(`/${slug}.md`));
  if (!targetKey) {
    return Promise.reject(new Error(`Document not found: ${slug}`));
  }
  const rawContent = docFiles[targetKey];
  const parsed = parseFrontmatter(rawContent);
  const html = await marked.parse(parsed.content);
  return Promise.resolve({
    meta: parsed.meta,
    html,
    markdown: parsed.content,
  });
}

// ─── Client-Side Rate-Limiter Simulation ────────────────────────────────

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

export async function runSimulation(params: {
  algorithm: string;
  config: Record<string, number>;
  totalRequests: number;
  requestsPerSecond: number;
}): Promise<SimulationResult> {
  const { algorithm, config, totalRequests, requestsPerSecond } = params;

  const store = new MemoryStore();
  const limiter = createLimiter(algorithm, config, store);

  const tickIntervalMs = 1000;
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

    const requestsThisTick = Math.min(requestsPerTick, totalRequests - requestsSent);

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

  return Promise.resolve({
    algorithm,
    config,
    totalRequests: requestsSent,
    requestsPerSecond,
    summary: { totalAllowed, totalDenied },
    timeline,
  });
}
