import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const configFieldSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['number'] },
    label: { type: String, required: true },
    description: { type: String, required: true },
    defaultValue: { type: Number, required: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    step: { type: Number, default: 1 },
  },
  { _id: false },
);

const algorithmSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    complexity: {
      type: String,
      required: true,
      enum: ['O(1)', 'O(n)'],
    },
    burstTolerance: { type: String, required: true },
    accuracy: { type: String, required: true },
    recommended: { type: Boolean, default: false },
    tradeoffs: { type: String, required: true },
    configFields: { type: [configFieldSchema], required: true },
  },
  { timestamps: true },
);

export type AlgorithmDocument = InferSchemaType<typeof algorithmSchema>;

export const Algorithm = mongoose.model('Algorithm', algorithmSchema);

/**
 * Seed the algorithms collection with data for all 5 algorithms.
 * Uses upsert to avoid duplicates on restart.
 */
export async function seedAlgorithms(): Promise<void> {
  const algorithms: AlgorithmDocument[] = [
    {
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

  for (const algo of algorithms) {
    await Algorithm.findOneAndUpdate({ slug: algo.slug }, algo, {
      upsert: true,
      new: true,
    });
  }

  console.log(`📦 Seeded ${algorithms.length} algorithms`);
}
