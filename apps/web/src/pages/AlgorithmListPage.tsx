import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { fetchAlgorithms, type Algorithm } from '../api';
import { AlgorithmCard } from '../components/AlgorithmCard';

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
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search algorithms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface-card border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium border cursor-pointer transition-all ${
                category === cat
                  ? 'bg-accent-soft border-accent text-accent'
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
        <div className="flex items-center justify-center py-20 text-text-muted">
          Loading algorithms...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-text-muted">
          No algorithms match your search.
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
