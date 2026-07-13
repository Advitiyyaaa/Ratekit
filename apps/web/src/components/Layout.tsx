import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Gauge, Github, Menu, X, LogIn, Crown, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { authClient } from '../lib/auth-client';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, isAdmin, isLoading } = useAuth();

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

  async function handleSignOut() {
    setDropdownOpen(false);
    await authClient.signOut();
    navigate('/');
  }

  const avatarLetter = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?';

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
          {isAdmin && (
            <Link
              to="/admin"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline flex items-center gap-1.5 ${
                isActive('/admin')
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-amber-500/70 hover:text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <Crown size={13} /> Admin
            </Link>
          )}
        </nav>

        {/* Right side: auth + github */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <Github size={20} />
          </a>

          {/* Auth area */}
          {!isLoading && (
            <>
              {user ? (
                /* User avatar dropdown */
                <div className="relative">
                  <button
                    id="nav-user-menu"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center text-sm font-bold text-base-950 cursor-pointer border-none hover:ring-2 hover:ring-accent/50 transition-all"
                  >
                    {avatarLetter}
                  </button>

                  {dropdownOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setDropdownOpen(false)}
                      />
                      {/* Dropdown */}
                      <div
                        className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-border py-1 shadow-2xl"
                        style={{ background: 'rgba(16, 22, 40, 0.98)', backdropFilter: 'blur(20px)' }}
                      >
                        <div className="px-4 py-3 border-b border-border">
                          <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
                          <p className="text-xs text-text-muted truncate">{user.email}</p>
                        </div>
                        <Link
                          to="/account"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors no-underline"
                        >
                          <User size={14} /> Account
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors no-underline"
                          >
                            <Crown size={14} /> Admin Panel
                          </Link>
                        )}
                        <div className="border-t border-border mt-1" />
                        <button
                          id="nav-signout"
                          onClick={handleSignOut}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-text-secondary hover:text-red-400 hover:bg-surface-elevated transition-colors cursor-pointer bg-transparent border-none text-left"
                        >
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Sign in button */
                <Link
                  to="/sign-in"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm font-medium hover:bg-accent/20 transition-colors no-underline"
                >
                  <LogIn size={14} /> Sign in
                </Link>
              )}
            </>
          )}

          {/* Mobile toggle */}
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
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-500/10 no-underline transition-colors"
            >
              <Crown size={13} /> Admin
            </Link>
          )}
          {!user ? (
            <Link
              to="/sign-in"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-accent hover:bg-accent-soft no-underline transition-colors mt-1"
            >
              <LogIn size={14} /> Sign in
            </Link>
          ) : (
            <Link
              to="/account"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary no-underline transition-colors mt-1"
            >
              <User size={14} /> Account
            </Link>
          )}
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
