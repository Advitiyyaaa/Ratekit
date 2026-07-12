import { Link, useLocation } from 'react-router-dom';
import { Gauge, Github, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/algorithms', label: 'Algorithms' },
    { to: '/playground', label: 'Playground' },
    { to: '/docs/getting-started', label: 'Docs' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className="sticky top-0 z-50 border-b border-border"
      style={{ background: 'rgba(10, 15, 30, 0.85)', backdropFilter: 'blur(16px)' }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg no-underline group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center transition-transform group-hover:scale-110">
            <Gauge size={18} className="text-base-950" />
          </div>
          <span className="text-text-primary">
            Rate<span className="text-accent">Kit</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                isActive(link.to)
                  ? 'text-accent bg-accent-soft'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* GitHub + Mobile toggle */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <Github size={20} />
          </a>
          <button
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors bg-transparent border-none cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-border px-4 py-3 flex flex-col gap-1 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                isActive(link.to)
                  ? 'text-accent bg-accent-soft'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <Gauge size={16} className="text-accent" />
          <span>RateKit — Rate Limiting Made Simple</span>
        </div>
        <div className="flex items-center gap-6 text-text-muted text-sm">
          <Link to="/docs/getting-started" className="hover:text-text-primary transition-colors text-text-muted no-underline">
            Docs
          </Link>
          <Link to="/algorithms" className="hover:text-text-primary transition-colors text-text-muted no-underline">
            Algorithms
          </Link>
          <Link to="/playground" className="hover:text-text-primary transition-colors text-text-muted no-underline">
            Playground
          </Link>
        </div>
      </div>
    </footer>
  );
}
