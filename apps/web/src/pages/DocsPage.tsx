import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { fetchDoc, fetchDocs, type DocContent, type DocMeta } from '../api';

// ─── Reading progress bar ─────────────────────────────────────────────────────

function ReadingProgress({ contentRef }: { contentRef: React.RefObject<HTMLElement | null> }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    function update() {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight - window.innerHeight;
      const scrolled = -rect.top;
      setPct(Math.min(100, Math.max(0, (scrolled / total) * 100)));
    }
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [contentRef]);

  return <div className="reading-progress" style={{ width: `${pct}%` }} />;
}

// ─── Inject copy buttons into rendered markdown pre blocks ───────────────────

function injectCopyButtons(container: HTMLElement) {
  container.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.copy-btn')) return; // already injected
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.textContent ?? pre.textContent ?? '';
      await navigator.clipboard.writeText(code);
      btn.textContent = '✓ Copied';
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    });
    pre.appendChild(btn);
  });
}

// ─── On-this-page TOC ─────────────────────────────────────────────────────────

interface Heading { id: string; text: string; level: number; }

function extractHeadings(html: string): Heading[] {
  const div = document.createElement('div');
  div.innerHTML = html;
  const headings: Heading[] = [];
  div.querySelectorAll('h2, h3').forEach((el) => {
    const text = el.textContent ?? '';
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    headings.push({ id, text, level: el.tagName === 'H2' ? 2 : 3 });
  });
  return headings;
}

// ─── Sidebar section group ────────────────────────────────────────────────────



function SidebarSection({ label, docs, currentSlug }: { label: string; docs: DocMeta[]; currentSlug?: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 px-1 py-0.5 bg-transparent border-none cursor-pointer hover:text-text-secondary transition-colors"
      >
        {label}
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && docs.map((d) => (
        <Link
          key={d.slug}
          to={`/docs/${d.slug}`}
          className={`doc-sidebar-link ${d.slug === currentSlug ? 'active' : ''}`}
        >
          {d.title}
        </Link>
      ))}
    </div>
  );
}

// ─── DocsPage ─────────────────────────────────────────────────────────────────

export function DocsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [doc, setDoc] = useState<DocContent | null>(null);
  const [docList, setDocList] = useState<DocMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeHeading, setActiveHeading] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocs().then(setDocList).catch(console.error);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchDoc(slug)
      .then((d) => {
        setDoc(d);
        setHeadings(extractHeadings(d.html));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  // Inject copy buttons after content renders
  useEffect(() => {
    if (contentRef.current) {
      injectCopyButtons(contentRef.current);
    }
  }, [doc]);

  // Heading IDs: add to rendered HTML headings so anchor links work
  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.querySelectorAll('h2, h3').forEach((el) => {
      const id = (el.textContent ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      el.id = id;
    });
  }, [doc]);

  // Track active heading via IntersectionObserver
  useEffect(() => {
    if (!contentRef.current) return;
    const els = Array.from(contentRef.current.querySelectorAll('h2, h3'));
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveHeading(visible.target.id);
      },
      { rootMargin: '-10% 0% -60% 0%' },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [doc]);

  // Group docs by section
  const gettingStartedDocs = docList.filter((d) => d.slug === 'getting-started' || d.order === 0);
  const algorithmDocs = docList.filter((d) => d.slug !== 'getting-started' && d.order !== 0);

  return (
    <>
      <ReadingProgress contentRef={contentRef} />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-56 flex-shrink-0">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen size={13} />
              Documentation
            </h3>
            <nav>
              {gettingStartedDocs.length > 0 && (
                <SidebarSection label="Getting Started" docs={gettingStartedDocs} currentSlug={slug} />
              )}
              {algorithmDocs.length > 0 && (
                <SidebarSection label="Algorithms" docs={algorithmDocs} currentSlug={slug} />
              )}
              {/* Fallback: show all if grouping produces nothing */}
              {gettingStartedDocs.length === 0 && algorithmDocs.length === 0 && docList.map((d) => (
                <Link
                  key={d.slug}
                  to={`/docs/${d.slug}`}
                  className={`doc-sidebar-link ${d.slug === slug ? 'active' : ''}`}
                >
                  {d.title}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="text-text-muted py-20 text-center animate-fade-in">Loading…</div>
            ) : doc ? (
              <div className="animate-fade-in flex gap-8">
                <div className="flex-1 min-w-0">
                  <Link
                    to="/algorithms"
                    className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors mb-6 no-underline md:hidden"
                  >
                    <ArrowLeft size={14} /> Back
                  </Link>
                  <div
                    ref={contentRef}
                    className="markdown-body"
                    dangerouslySetInnerHTML={{ __html: doc.html }}
                  />
                </div>

                {/* On this page TOC */}
                {headings.length > 0 && (
                  <aside className="hidden xl:block w-48 flex-shrink-0">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                      On this page
                    </p>
                    <nav className="flex flex-col gap-0.5">
                      {headings.map((h) => (
                        <a
                          key={h.id}
                          href={`#${h.id}`}
                          className={`text-xs py-1 no-underline transition-colors block ${
                            h.level === 3 ? 'pl-3' : ''
                          } ${
                            activeHeading === h.id
                              ? 'text-accent font-medium'
                              : 'text-text-muted hover:text-text-secondary'
                          }`}
                        >
                          {h.text}
                        </a>
                      ))}
                    </nav>
                  </aside>
                )}
              </div>
            ) : (
              <div className="text-text-muted py-20 text-center">Document not found.</div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
