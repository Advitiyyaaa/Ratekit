import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Github, Menu, X, LogIn, Crown, User, Sun, Moon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import { authClient } from '../lib/auth-client';
import { useTheme } from '../context/ThemeContext';
import { Logo } from './Logo';

// ─── Nav progress bar ────────────────────────────────────────────────────────

function NavProgressBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVisible(true);
    setProgress(30);
    const t1 = setTimeout(() => setProgress(70), 100);
    const t2 = setTimeout(() => setProgress(95), 300);
    const t3 = setTimeout(() => {
      setProgress(100);
      const t4 = setTimeout(() => { setVisible(false); setProgress(0); }, 350);
      timerRef.current = t4;
    }, 500);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location.pathname]);

  if (!visible) return null;
  return (
    <div
      className="nav-progress-bar"
      style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
    />
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, isAdmin, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
    <>
      {/* CSS grid background (Global) */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035] -z-10"
        style={{
          backgroundImage: `
            linear-gradient(var(--color-accent) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-accent) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      <div className="blue-glow-bg fixed inset-0 pointer-events-none -z-10" />
      <NavProgressBar />
      
      {/* Container for non-sticky floating positioning */}
      <div className="relative mt-4 mb-4 z-50 flex justify-center px-4">
        <header
          className="w-full max-w-7xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] transition-all"
          style={{
            boxShadow: '4px 4px 0px 0px var(--color-shadow)',
          }}
        >
          <div className="px-4 h-14 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-black text-lg no-underline group">
              <Logo size={24} className="transition-transform group-hover:scale-110" />
              <span className="text-text-primary">
                Rate<span className="text-blue-500">Kit</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 font-bold text-sm transition-all no-underline border-2 border-transparent ${
                    isActive(link.to)
                      ? 'nav-link-active border-border'
                      : 'text-text-primary hover:bg-surface-hover hover:border-border hover:shadow-[2px_2px_0px_0px_var(--color-shadow)] hover:-translate-y-[2px] hover:-translate-x-[2px]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 font-bold text-sm transition-all no-underline border-2 border-transparent flex items-center gap-1.5 ${
                    isActive('/admin')
                      ? 'bg-text-primary text-amber-400 border-border'
                      : 'text-amber-500 hover:bg-surface-hover hover:border-border hover:shadow-[2px_2px_0px_0px_var(--color-shadow)] hover:-translate-y-[2px] hover:-translate-x-[2px]'
                  }`}
                >
                  <Crown size={13} /> Admin
                </Link>
              )}
            </nav>

            {/* Right side: auth + github + theme */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-1.5 border-2 border-transparent hover:border-border text-text-primary hover:bg-surface-hover transition-all cursor-pointer bg-transparent hover:shadow-[2px_2px_0px_0px_var(--color-shadow)] hover:-translate-y-[2px] hover:-translate-x-[2px]"
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <a
                href="https://github.com/Advitiyyaaa/Ratekit"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 border-2 border-transparent hover:border-border text-text-primary hover:bg-surface-hover transition-all cursor-pointer bg-transparent hover:shadow-[2px_2px_0px_0px_var(--color-shadow)] hover:-translate-y-[2px] hover:-translate-x-[2px]"
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
                        className="w-8 h-8 bg-surface-card border-2 border-border flex items-center justify-center text-sm font-bold text-text-primary cursor-pointer hover:shadow-[2px_2px_0px_0px_var(--color-shadow)] hover:-translate-y-[2px] hover:-translate-x-[2px] transition-all"
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
                            className="absolute right-0 top-12 z-50 w-52 border-2 border-border bg-surface-card shadow-[4px_4px_0px_0px_var(--color-shadow)] py-1 animate-slide-in-right"
                          >
                            <div className="px-4 py-3 border-b-2 border-border">
                              <p className="text-sm font-bold text-text-primary truncate">{user.name}</p>
                              <p className="text-xs font-medium text-text-muted truncate">{user.email}</p>
                            </div>
                            <Link
                              to="/account"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-text-primary hover:bg-surface-hover transition-colors no-underline"
                            >
                              <User size={14} /> Account
                            </Link>
                            {isAdmin && (
                              <Link
                                to="/admin"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-amber-500 hover:bg-surface-hover transition-colors no-underline"
                              >
                                <Crown size={14} /> Admin Panel
                              </Link>
                            )}
                            <div className="border-t-2 border-border mt-1" />
                            <button
                              id="nav-signout"
                              onClick={handleSignOut}
                              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-bold text-danger hover:bg-surface-hover transition-colors cursor-pointer bg-transparent border-none text-left"
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
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-text-primary border-2 border-border text-base-950 text-sm font-bold hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0px_0px_0px_0px_var(--color-shadow)] shadow-[2px_2px_0px_0px_var(--color-shadow)] transition-all no-underline"
                    >
                      <LogIn size={14} /> Sign in
                    </Link>
                  )}
                </>
              )}

              {/* Mobile toggle */}
              <button
                className="md:hidden p-1.5 border-2 border-transparent hover:border-border text-text-primary hover:bg-surface-hover transition-all bg-transparent cursor-pointer"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          {mobileOpen && (
            <nav className="md:hidden border-t-2 border-border px-4 py-3 flex flex-col gap-1 bg-surface-card">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-bold no-underline border-2 border-transparent transition-colors ${
                    isActive(link.to)
                      ? 'bg-text-primary text-surface border-border'
                      : 'text-text-primary hover:bg-surface-hover hover:border-border'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-amber-500 hover:bg-surface-hover hover:border-border border-2 border-transparent no-underline transition-colors"
                >
                  <Crown size={13} /> Admin
                </Link>
              )}
              {!user ? (
                <Link
                  to="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold bg-text-primary text-base-950 border-2 border-border no-underline transition-colors mt-2"
                >
                  <LogIn size={14} /> Sign in
                </Link>
              ) : (
                <Link
                  to="/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-text-primary hover:bg-surface-hover hover:border-border border-2 border-transparent no-underline transition-colors mt-1"
                >
                  <User size={14} /> Account
                </Link>
              )}
            </nav>
          )}
        </header>
      </div>
      {/* End of Layout */}
    </>
  );
}


// ─── Footer ───────────────────────────────────────────────────────────────────

export function Footer() {
  return (
    <footer className="border-t-2 border-border bg-surface mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <Logo size={16} />
          <span>Rate<span className="text-text-primary font-bold">Kit</span></span>
          <span className="ml-1 px-1.5 py-0.5 rounded-none bg-surface-card border border-border text-[10px] font-mono text-text-primary font-bold shadow-[1px_1px_0px_0px_var(--color-shadow)]">
            v0.1.1
          </span>
          <span className="text-text-muted">— Rate Limiting Made Simple</span>
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
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-primary transition-colors text-text-muted no-underline"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
