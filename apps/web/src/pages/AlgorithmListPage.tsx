import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { fetchAlgorithms, type Algorithm } from '../api';
import { AlgorithmCard } from '../components/AlgorithmCard';
import { SkeletonCard } from '../components/Skeleton';

export function AlgorithmListPage() {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlgorithms()
      .then(setAlgorithms)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(algorithms.map((a) => a.category))];

  const filtered = algorithms.filter((algo) => {
    const matchesSearch =
      algo.name.toLowerCase().includes(search.toLowerCase()) ||
      algo.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || algo.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold mb-2">Algorithms</h1>
        <p className="text-text-secondary text-lg">
          Browse all rate-limiting algorithms. Each implements the same{' '}
          <code>RateLimiter</code> interface — swap freely.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {/* Search with clear button */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search algorithms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 bg-surface-card border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer p-0"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium border cursor-pointer transition-all ${
                category === cat
                  ? 'bg-accent-soft border-accent text-accent shadow-[0_0_10px_rgba(0,212,255,0.15)]'
                  : 'bg-surface-card border-border text-text-secondary hover:border-border-light hover:text-text-primary'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-text-muted">
          <Search size={40} opacity={0.3} />
          <p className="text-sm">No algorithms match "<span className="text-text-secondary">{search}</span>"</p>
          <button onClick={() => { setSearch(''); setCategory('all'); }} className="btn-secondary text-sm">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((algo, i) => (
            <AlgorithmCard key={algo.slug} algorithm={algo} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
