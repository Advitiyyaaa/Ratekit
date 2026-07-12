import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { fetchDoc, fetchDocs, type DocContent, type DocMeta } from '../api';

export function DocsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [doc, setDoc] = useState<DocContent | null>(null);
  const [docList, setDocList] = useState<DocMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocs().then(setDocList).catch(console.error);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchDoc(slug)
      .then(setDoc)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="md:w-56 flex-shrink-0">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <BookOpen size={14} />
            Documentation
          </h3>
          <nav className="flex flex-col gap-0.5">
            {docList.map((d) => (
              <Link
                key={d.slug}
                to={`/docs/${d.slug}`}
                className={`px-3 py-2 rounded-lg text-sm no-underline transition-colors ${
                  d.slug === slug
                    ? 'text-accent bg-accent-soft font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                {d.title}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="text-text-muted py-20 text-center">Loading...</div>
          ) : doc ? (
            <div className="animate-fade-in">
              <Link
                to="/algorithms"
                className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors mb-6 no-underline md:hidden"
              >
                <ArrowLeft size={14} />
                Back
              </Link>
              <div
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: doc.html }}
              />
            </div>
          ) : (
            <div className="text-text-muted py-20 text-center">
              Document not found.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
