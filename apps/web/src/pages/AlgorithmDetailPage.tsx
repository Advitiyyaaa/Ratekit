import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, Copy, Check, Play } from 'lucide-react';
import { fetchAlgorithm, fetchDoc, type Algorithm, type DocContent } from '../api';
import { CodeBlock } from '../components/CodeBlock';

export function AlgorithmDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  const [doc, setDoc] = useState<DocContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [installCopied, setInstallCopied] = useState(false);

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
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCopyInstall = async () => {
    await navigator.clipboard.writeText('npm install ratekit');
    setInstallCopied(true);
    setTimeout(() => setInstallCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-text-muted text-center py-20">Loading...</div>
      </div>
    );
  }

  if (!algorithm) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-text-muted text-center py-20">Algorithm not found.</div>
      </div>
    );
  }

  const usageCode = getUsageCode(algorithm.slug);

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

      {/* Header */}
      <div className="animate-fade-in-up">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center flex-shrink-0">
            <Package size={24} className="text-base-950" />
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
        <div className="glass-card p-4 mb-8" style={{ cursor: 'default' }}>
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2 font-semibold">
            Install
          </div>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-sm font-mono text-accent bg-surface px-3 py-2 rounded-lg">
              npm install ratekit
            </code>
            <button
              onClick={handleCopyInstall}
              className="p-2 rounded-lg bg-surface border border-border text-text-muted hover:text-accent hover:border-accent transition-all cursor-pointer"
            >
              {installCopied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Quick usage */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Quick Usage</h2>
          <CodeBlock code={usageCode} />
        </div>

        {/* Tradeoffs */}
        <div className="glass-card p-5 mb-8" style={{ cursor: 'default' }}>
          <h2 className="text-lg font-semibold mb-2 mt-0">Tradeoffs</h2>
          <p className="text-text-secondary text-sm m-0 leading-relaxed">{algorithm.tradeoffs}</p>
        </div>

        {/* Config reference */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Configuration</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-text-muted font-medium">Parameter</th>
                  <th className="text-left py-2 pr-4 text-text-muted font-medium">Default</th>
                  <th className="text-left py-2 pr-4 text-text-muted font-medium">Range</th>
                  <th className="text-left py-2 text-text-muted font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {algorithm.configFields.map((field) => (
                  <tr key={field.name} className="border-b border-border">
                    <td className="py-2 pr-4 font-mono text-accent">{field.name}</td>
                    <td className="py-2 pr-4 text-text-secondary">{field.defaultValue}</td>
                    <td className="py-2 pr-4 text-text-secondary">
                      {field.min}–{field.max}
                    </td>
                    <td className="py-2 text-text-secondary">{field.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Try in playground CTA */}
        <div className="flex gap-3 mb-8">
          <Link to={`/playground?algorithm=${algorithm.slug}`} className="btn-primary">
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
      return `import { MemoryStore } from 'ratekit';

const store = new MemoryStore();`;
  }
}
