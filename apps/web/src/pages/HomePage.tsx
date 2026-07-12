import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Database, Box } from 'lucide-react';
import { fetchAlgorithms, type Algorithm } from '../api';
import { AlgorithmCard } from '../components/AlgorithmCard';
import { CodeBlock } from '../components/CodeBlock';

const heroCode = `import { SlidingWindowCounter, MemoryStore } from 'ratekit';

const limiter = new SlidingWindowCounter(
  new MemoryStore(),
  { maxRequests: 100, windowMs: 60_000 }
);

const result = await limiter.consume('user:123');
// → { allowed: true, remaining: 99, resetAt: 1720000000 }`;

const features = [
  {
    icon: <Zap size={20} />,
    title: '5 Algorithms',
    description: 'Token Bucket, Leaky Bucket, Fixed Window, Sliding Window Log, and Sliding Window Counter.',
  },
  {
    icon: <Database size={20} />,
    title: 'Pluggable Storage',
    description: 'In-memory for single-instance, Redis for distributed. Swap backends without changing code.',
  },
  {
    icon: <Shield size={20} />,
    title: 'Type-Safe',
    description: 'Written in TypeScript with strict mode. Full type safety and TSDoc documentation.',
  },
  {
    icon: <Box size={20} />,
    title: 'Zero Dependencies',
    description: 'No runtime dependencies. Redis support via optional ioredis peer dependency.',
  },
];

export function HomePage() {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);

  useEffect(() => {
    fetchAlgorithms().then(setAlgorithms).catch(console.error);
  }, []);

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(0, 212, 255, 0.15), transparent 70%)',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-light text-sm text-text-secondary mb-6">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                v0.1.0 — Now available
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
                Rate Limiting
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, var(--color-accent), #7c5cff)',
                  }}
                >
                  Made Simple
                </span>
              </h1>
              <p className="text-lg text-text-secondary max-w-lg mb-8 leading-relaxed">
                Framework-agnostic rate-limiting library with 5 battle-tested algorithms
                and pluggable storage backends. Zero dependencies.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/playground" className="btn-primary">
                  Try Playground <ArrowRight size={16} />
                </Link>
                <Link to="/docs/getting-started" className="btn-secondary">
                  Get Started
                </Link>
              </div>
            </div>

            {/* Right: Code */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-surface border-b border-border">
                  <div className="w-3 h-3 rounded-full bg-danger opacity-60" />
                  <div className="w-3 h-3 rounded-full bg-warning opacity-60" />
                  <div className="w-3 h-3 rounded-full bg-success opacity-60" />
                  <span className="ml-3 text-xs text-text-muted font-mono">example.ts</span>
                </div>
                <CodeBlock code={heroCode} showCopy={true} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Install */}
      <section className="border-y border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center gap-4 flex-wrap">
          <span className="text-text-muted text-sm">Quick install:</span>
          <code className="text-accent text-sm font-mono bg-surface-card px-4 py-2 rounded-lg border border-border">
            npm install ratekit
          </code>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Why RateKit?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`glass-card p-5 animate-fade-in-up opacity-0 stagger-${i + 1}`}
              style={{ cursor: 'default' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center text-accent mb-3">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{feature.title}</h3>
              <p className="text-text-secondary text-sm m-0 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Algorithms */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold m-0">Algorithms</h2>
          <Link to="/algorithms" className="btn-secondary text-sm">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {algorithms.slice(0, 3).map((algo, i) => (
            <AlgorithmCard key={algo.slug} algorithm={algo} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
