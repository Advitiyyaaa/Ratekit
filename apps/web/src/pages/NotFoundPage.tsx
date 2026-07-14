import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LogoBox } from '../components/Logo';

/**
 * 404 Not Found page.
 * On-brand: "This request got rate-limited."
 */
export function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(var(--color-accent) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-accent) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(124,92,255,0.09), transparent 65%)',
        }}
      />

      <div className="relative z-10 text-center max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="animate-float">
            <LogoBox size={56} />
          </div>
        </div>

        {/* 404 */}
        <h1
          className="font-extrabold mb-2 gradient-text select-none"
          style={{ fontSize: 'clamp(5rem, 20vw, 9rem)', lineHeight: 1 }}
        >
          404
        </h1>

        <p className="text-xl font-semibold text-text-primary mb-3">
          This request got rate-limited.
        </p>
        <p className="text-text-secondary text-sm mb-10 leading-relaxed">
          The page you're looking for doesn't exist — or it consumed all its tokens and got dropped.
        </p>

        {/* Status card mock */}
        <div
          className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-border font-mono text-sm mb-8"
          style={{ background: 'rgba(15, 22, 41, 0.8)' }}
        >
          <span className="text-danger">✗</span>
          <span className="text-text-primary">allowed: <span className="text-danger font-bold">false</span></span>
          <span className="text-border-light">·</span>
          <span className="text-text-primary">remaining: <span className="text-warning">0</span></span>
        </div>

        <div>
          <Link to="/" className="btn-primary inline-flex">
            <ArrowLeft size={16} /> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
