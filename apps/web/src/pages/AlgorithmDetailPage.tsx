import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Copy, Check, Play,
  Zap, Droplets, LayoutGrid, ScrollText, BarChart2,
} from 'lucide-react';
import { fetchAlgorithm, fetchDoc, type Algorithm, type DocContent } from '../api';
import { CodeBlock } from '../components/CodeBlock';
import { Skeleton } from '../components/Skeleton';

// ─── Per-algorithm icons & colors ─────────────────────────────────────────────

const ALGO_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  'token-bucket':           { icon: <Zap size={22} />,       color: 'var(--color-warning)',  bg: 'rgba(255,171,64,0.15)' },
  'leaky-bucket':           { icon: <Droplets size={22} />,  color: 'var(--color-accent)',   bg: 'var(--color-accent-soft)' },
  'fixed-window':           { icon: <LayoutGrid size={22} />,color: 'var(--color-purple)',   bg: 'var(--color-purple-soft)' },
  'sliding-window-log':     { icon: <ScrollText size={22} />,color: 'var(--color-success)',  bg: 'rgba(0,230,118,0.12)' },
  'sliding-window-counter': { icon: <BarChart2 size={22} />, color: 'var(--color-accent)',   bg: 'var(--color-accent-soft)' },
};

// ─── Skeleton layout ──────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Skeleton width="8rem" height="1rem" className="mb-6" />
      <div className="flex items-start gap-4 mb-6">
        <Skeleton width="3.5rem" height="3.5rem" rounded="12px" />
        <div className="flex-1">
          <Skeleton width="50%" height="1.5rem" className="mb-2" />
          <Skeleton width="80%" height="0.875rem" />
        </div>
      </div>
      <div className="flex gap-2 mb-8">
        <Skeleton width="5rem" height="1.25rem" rounded="9999px" />
        <Skeleton width="5rem" height="1.25rem" rounded="9999px" />
        <Skeleton width="7rem" height="1.25rem" rounded="9999px" />
      </div>
      <Skeleton width="100%" height="4rem" rounded="12px" className="mb-8" />
      <Skeleton width="100%" height="10rem" rounded="8px" className="mb-8" />
      <Skeleton width="100%" height="6rem" rounded="12px" className="mb-8" />
    </div>
  );
}

// ─── Tradeoffs panel ──────────────────────────────────────────────────────────

function TradeoffPanel({ text }: { text: string }) {
  // Heuristic split: look for "Good for", "Bad for", "Best for"
  const pros = text.match(/excellent|fast|accurate|low memory|simple|smooth|precise/gi) ?? [];

  return (
    <div className="grid sm:grid-cols-3 gap-4 mb-8">
      <div className="glass-card p-4" style={{ cursor: 'default', borderColor: 'rgba(0,230,118,0.25)' }}>
        <p className="text-xs font-semibold text-success uppercase tracking-wider mb-2">Pros</p>
        {pros.length > 0
          ? pros.slice(0, 3).map((p, i) => (
              <p key={i} className="text-sm text-text-secondary flex items-start gap-1.5 mb-1">
                <Check size={12} className="text-success mt-0.5 flex-shrink-0" />
                {p}
              </p>
            ))
          : <p className="text-sm text-text-muted italic">See full notes →</p>}
      </div>
      <div className="glass-card p-4 sm:col-span-2" style={{ cursor: 'default' }}>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Full Tradeoff Notes</p>
        <p className="text-text-secondary text-sm m-0 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

// ─── Config slider row ────────────────────────────────────────────────────────

function ConfigRow({
  field, value, onChange,
}: {
  field: Algorithm['configFields'][number];
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - field.min) / (field.max - field.min)) * 100;
  return (
    <tr className="border-b-2 border-border hover:bg-surface-hover transition-colors">
      <td className="py-3 px-4 font-mono font-bold text-text-primary text-sm border-2 border-border">{field.name}</td>
      <td className="py-3 px-4 font-mono text-text-secondary text-sm border-2 border-border">{field.defaultValue}</td>
      <td className="py-3 px-4 font-mono text-text-muted text-sm border-2 border-border">{field.min}–{field.max}</td>
      <td className="py-3 px-4 text-text-secondary text-sm hidden md:table-cell border-2 border-border">{field.description}</td>
      <td className="py-3 px-4 w-48 border-2 border-border">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="rate-range flex-1"
            style={{
              background: `linear-gradient(to right, var(--color-text-primary) 0%, var(--color-text-primary) ${pct}%, var(--color-surface-hover) ${pct}%, var(--color-surface-hover) 100%)`,
              border: '2px solid var(--color-border)',
            }}
          />
          <span className="text-text-primary font-mono font-bold text-xs w-10 text-right">{value}</span>
        </div>
      </td>
    </tr>
  );
}

// ─── AlgorithmDetailPage ──────────────────────────────────────────────────────

export function AlgorithmDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  const [doc, setDoc] = useState<DocContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [installCopied, setInstallCopied] = useState(false);
  const [liveConfig, setLiveConfig] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      fetchAlgorithm(slug).catch(() => null),
      fetchDoc(slug).catch(() => null),
    ])
      .then(([algo, docContent]) => {
        setAlgorithm(algo);
        setDoc(docContent);
        if (algo) {
          const defaults: Record<string, number> = {};
          for (const f of algo.configFields) defaults[f.name] = f.defaultValue;
          setLiveConfig(defaults);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCopyInstall = async () => {
    await navigator.clipboard.writeText('npm install ratekit');
    setInstallCopied(true);
    setTimeout(() => setInstallCopied(false), 2000);
  };

  if (loading) return <DetailSkeleton />;

  if (!algorithm) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-text-muted text-center py-20">Algorithm not found.</div>
      </div>
    );
  }

  const usageCode = getUsageCode(algorithm.slug);
  const meta = ALGO_META[algorithm.slug] ?? {
    icon: <BarChart2 size={22} />,
    color: 'var(--color-accent)',
    bg: 'var(--color-accent-soft)',
  };

  // Build playground link with live config values
  const playgroundParams = new URLSearchParams({
    algorithm: algorithm.slug,
    ...Object.fromEntries(Object.entries(liveConfig).map(([k, v]) => [k, String(v)])),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <Link
        to="/algorithms"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors mb-6 no-underline"
      >
        <ArrowLeft size={14} />
        Back to algorithms
      </Link>

      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: meta.bg, color: meta.color }}
          >
            {meta.icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold m-0 mb-1">{algorithm.name}</h1>
            <p className="text-text-secondary m-0">{algorithm.description}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="badge badge-accent">{algorithm.complexity}</span>
          <span className="badge badge-accent">{algorithm.category}</span>
          <span className="badge badge-accent">Accuracy: {algorithm.accuracy}</span>
          {algorithm.recommended && (
            <span className="badge badge-success">⭐ Recommended</span>
          )}
        </div>

        {/* Install box */}
        <div className="brutal-card p-4 mb-8" style={{ cursor: 'default' }}>
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2 font-semibold">
            Install
          </div>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-sm font-mono text-text-primary bg-surface px-3 py-2 border-2 border-border">
              npm install ratekit
            </code>
            <button
              onClick={handleCopyInstall}
              className="px-3 py-2 text-xs font-bold bg-surface border-2 border-border text-text-primary hover:bg-surface-hover transition-all shadow-[2px_2px_0px_0px_var(--color-shadow)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5"
              title="Copy to clipboard"
            >
              {installCopied ? (
                <>
                  <Check size={14} className="text-success" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick usage */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Quick Usage</h2>
          <CodeBlock code={usageCode} />
        </div>

        {/* Tradeoffs */}
        <h2 className="text-lg font-semibold mb-3">Tradeoffs</h2>
        <TradeoffPanel text={algorithm.tradeoffs} />

        {/* Config reference with live sliders */}
        <div className="mb-8 brutal-card p-5 bg-surface border-2 border-border shadow-[4px_4px_0px_0px_var(--color-shadow)]">
          <h2 className="text-xl font-bold mb-4 border-b-2 border-border pb-2 m-0">Configuration</h2>
          <div className="overflow-x-auto">
            <table className="comparison-table w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Default</th>
                  <th>Range</th>
                  <th className="hidden md:table-cell">Description</th>
                  <th>Preview</th>
                </tr>
              </thead>
              <tbody>
                {algorithm.configFields.map((field) => (
                  <ConfigRow
                    key={field.name}
                    field={field}
                    value={liveConfig[field.name] ?? field.defaultValue}
                    onChange={(v) => setLiveConfig((prev) => ({ ...prev, [field.name]: v }))}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Try in playground CTA — includes live config */}
        <div className="flex gap-3 mb-8">
          <Link to={`/playground?${playgroundParams.toString()}`} className="btn-primary">
            <Play size={16} />
            Try in Playground
          </Link>
          <Link to={`/docs/${algorithm.slug}`} className="btn-secondary">
            Full Documentation
          </Link>
        </div>

        {/* Docs */}
        {doc && (
          <div className="border-t border-border pt-8">
            <h2 className="text-lg font-semibold mb-4">Documentation</h2>
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: doc.html }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Usage snippets ───────────────────────────────────────────────────────────

function getUsageCode(slug: string): string {
  switch (slug) {
    case 'token-bucket':
      return `import { TokenBucket, MemoryStore } from 'ratekit';

const limiter = new TokenBucket(new MemoryStore(), {
  capacity: 10,
  refillRate: 1,
  refillIntervalMs: 1000,
});

const result = await limiter.consume('user:123');`;
    case 'leaky-bucket':
      return `import { LeakyBucket, MemoryStore } from 'ratekit';

const limiter = new LeakyBucket(new MemoryStore(), {
  capacity: 10,
  leakRate: 1,
  leakIntervalMs: 1000,
});

const result = await limiter.consume('user:123');`;
    case 'fixed-window':
      return `import { FixedWindow, MemoryStore } from 'ratekit';

const limiter = new FixedWindow(new MemoryStore(), {
  maxRequests: 100,
  windowMs: 60_000,
});

const result = await limiter.consume('user:123');`;
    case 'sliding-window-log':
      return `import { SlidingWindowLog, MemoryStore } from 'ratekit';

const limiter = new SlidingWindowLog(new MemoryStore(), {
  maxRequests: 5,
  windowMs: 900_000,
});

const result = await limiter.consume('login:user@example.com');`;
    case 'sliding-window-counter':
      return `import { SlidingWindowCounter, MemoryStore } from 'ratekit';

const limiter = new SlidingWindowCounter(new MemoryStore(), {
  maxRequests: 100,
  windowMs: 60_000,
});

const result = await limiter.consume('user:123');`;
    default:
      return `import { MemoryStore } from 'ratekit';\n\nconst store = new MemoryStore();`;
  }
}
