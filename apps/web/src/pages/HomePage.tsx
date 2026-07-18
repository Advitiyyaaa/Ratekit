import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Database, Box, CheckCircle2, Copy, Check } from 'lucide-react';
import { fetchAlgorithms, type Algorithm } from '../api';
import { AlgorithmCard } from '../components/AlgorithmCard';
import { CodeBlock } from '../components/CodeBlock';

// ─── Data ────────────────────────────────────────────────────────────────────

const heroCodeLines = [
  "import { SlidingWindowCounter, MemoryStore } from 'ratekit';",
  '',
  'const limiter = new SlidingWindowCounter(',
  '  new MemoryStore(),',
  '  { maxRequests: 100, windowMs: 60_000 }',
  ');',
  '',
  "const result = await limiter.consume('user:123');",
  '// → { allowed: true, remaining: 99, resetAt: 1720000000 }',
];

const heroCode = heroCodeLines.join('\n');

const features = [
  {
    icon: <Zap size={20} />,
    title: '5 Algorithms',
    description: 'Token Bucket, Leaky Bucket, Fixed Window, Sliding Window Log, and Sliding Window Counter.',
    color: 'var(--color-warning)',
    bg: 'rgba(255,171,64,0.12)',
  },
  {
    icon: <Database size={20} />,
    title: 'Pluggable Storage',
    description: 'In-memory for single-instance, Redis for distributed. Swap backends without changing code.',
    color: 'var(--color-accent)',
    bg: 'var(--color-accent-soft)',
  },
  {
    icon: <Shield size={20} />,
    title: 'Type-Safe',
    description: 'Written in TypeScript with strict mode. Full type safety and TSDoc documentation.',
    color: 'var(--color-success)',
    bg: 'rgba(0,230,118,0.12)',
  },
  {
    icon: <Box size={20} />,
    title: 'Zero Dependencies',
    description: 'No runtime dependencies. Redis support via optional ioredis peer dependency.',
    color: 'var(--color-purple)',
    bg: 'var(--color-purple-soft)',
  },
];

const stats = [
  { label: 'Algorithms', value: 5 },
  { label: 'Storage Backends', value: 2 },
  { label: 'Runtime Dependencies', value: 0 },
];

const comparisonRows = [
  { name: 'Token Bucket',       slug: 'token-bucket',           complexity: 'O(1)', burst: 'Excellent', accuracy: 'Good',      recommended: false },
  { name: 'Leaky Bucket',       slug: 'leaky-bucket',           complexity: 'O(1)', burst: 'None',      accuracy: 'Excellent', recommended: false },
  { name: 'Fixed Window',       slug: 'fixed-window',           complexity: 'O(1)', burst: 'Boundary spikes', accuracy: 'Good', recommended: false },
  { name: 'Sliding Window Log', slug: 'sliding-window-log',     complexity: 'O(n)', burst: 'Natural',   accuracy: 'Excellent', recommended: false },
  { name: 'Sliding Window Counter', slug: 'sliding-window-counter', complexity: 'O(1)', burst: 'Smoothed', accuracy: 'Good',  recommended: true  },
];

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200, trigger: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, trigger]);
  return count;
}

function useInView(ref: React.RefObject<Element | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatItem({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const count = useCountUp(value, 800, inView);
  return (
    <div ref={ref} className="flex flex-col items-center gap-1">
      <span
        className="text-4xl font-extrabold gradient-text"
        style={{ animation: inView ? 'count-up 0.5s ease-out forwards' : 'none' }}
      >
        {count}{value === 0 ? '' : '+'}
      </span>
      <span className="text-text-muted text-sm">{label}</span>
    </div>
  );
}

function TerminalInstall() {
  const [copied, setCopied] = useState(false);
  const cmd = 'npm install ratekit';

  async function handleCopy() {
    await navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-border bg-surface-card font-mono text-sm group cursor-pointer select-none"
      onClick={handleCopy}
      title="Click to copy"
    >
      <span className="text-success opacity-60">$</span>
      <span className="text-text-primary">{cmd}</span>
      <span className="text-text-muted group-hover:text-accent transition-colors ml-2">
        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
      </span>
      {copied && (
        <span className="toast info" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}>
          <Check size={12} /> Copied!
        </span>
      )}
    </div>
  );
}

function BurstBadge({ burst }: { burst: string }) {
  const map: Record<string, string> = {
    'Excellent': 'badge badge-success',
    'None': 'badge badge-danger',
    'Boundary spikes': 'badge badge-warning',
    'Natural': 'badge badge-accent',
    'Smoothed': 'badge badge-success',
  };
  return <span className={map[burst] ?? 'badge badge-accent'}>{burst}</span>;
}

// ─── HomePage ────────────────────────────────────────────────────────────────

export function HomePage() {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef);

  useEffect(() => {
    fetchAlgorithms().then(setAlgorithms).catch(console.error);
  }, []);

  return (
    <div className="flex-1">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">

        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.12), transparent 65%)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,92,255,0.08), transparent 70%)',
            right: '-80px', top: '60px',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-light text-sm text-text-secondary mb-6"
                style={{ background: 'rgba(0,212,255,0.04)' }}>
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                v0.1.1 — Now available
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
                Rate Limiting
                <br />
                <span className="gradient-text">Made Simple</span>
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
              <div className="rounded-xl border border-border overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
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

      {/* ── Stats Bar ──────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-surface">
        <div
          ref={statsRef}
          className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-3 gap-6 divide-x divide-border"
        >
          {statsInView && stats.map((s) => (
            <StatItem key={s.label} value={s.value} label={s.label} />
          ))}
          {!statsInView && stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-4xl font-extrabold gradient-text">—</span>
              <span className="text-text-muted text-sm">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Install ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-center gap-4 flex-wrap">
        <span className="text-text-muted text-sm">Quick install:</span>
        <TerminalInstall />
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-10">Why RateKit?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </section>

      {/* ── Algorithm Comparison ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold m-0">Compare Algorithms</h2>
          <Link to="/algorithms" className="btn-secondary text-sm">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div
          className="rounded-xl border-2 border-border bg-surface overflow-hidden shadow-[4px_4px_0px_0px_var(--color-shadow)]"
        >
          <div className="overflow-x-auto">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Complexity</th>
                  <th>Burst Tolerance</th>
                  <th>Accuracy</th>
                  <th>Best For</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr
                    key={row.slug}
                    onClick={() => window.location.href = `/playground?algorithm=${row.slug}`}
                    title="Open in Playground"
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        {row.name}
                        {row.recommended && (
                          <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>⭐ Rec.</span>
                        )}
                      </div>
                    </td>
                    <td><code>{row.complexity}</code></td>
                    <td><BurstBadge burst={row.burst} /></td>
                    <td>
                      <span className={`badge ${row.accuracy === 'Excellent' ? 'badge-success' : 'badge-accent'}`}>
                        {row.accuracy}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1 text-accent text-xs">
                        Try in Playground <ArrowRight size={10} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Algorithms ───────────────────────────────────────────────────────── */}
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

      {/* ── CTA banner ───────────────────────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 text-success text-sm mb-4">
            <CheckCircle2 size={16} />
            Open source · MIT licensed · Zero vendor lock-in
          </div>
          <h2 className="text-3xl font-extrabold mb-4 gradient-text">
            Ready to rate-limit at scale?
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto mb-8">
            Jump into the interactive playground and see exactly how each algorithm behaves under load.
          </p>
          <Link to="/playground" className="btn-primary text-base px-8 py-3">
            Open Playground <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

// ─── Feature card with mouse-glow ────────────────────────────────────────────

function FeatureCard({ feature, index }: { feature: typeof features[number]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlow({ x, y });
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`glass-card p-5 animate-fade-in-up opacity-0 stagger-${index + 1} relative overflow-hidden`}
      style={{ cursor: 'default' }}
    >
      {/* Mouse-tracked glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, ${feature.color}10, transparent 60%)`,
        }}
      />
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
        style={{ background: feature.bg, color: feature.color }}
      >
        {feature.icon}
      </div>
      <h3 className="font-semibold text-sm mb-1.5">{feature.title}</h3>
      <p className="text-text-secondary text-sm m-0 leading-relaxed">{feature.description}</p>
    </div>
  );
}
