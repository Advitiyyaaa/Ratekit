import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { authClient } from '../lib/auth-client';
import type { Location } from 'react-router-dom';
import { LogoBox } from '../components/Logo';

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ProtectedRoute stores the full location (pathname + search) in state.from
  const from = (location.state as { from?: Location } | null)?.from;
  const redirectTo = from ? `${from.pathname}${from.search ?? ''}` : '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message ?? 'Invalid email or password');
      return;
    }

    // Navigate back to the page the user was trying to reach (with all query params)
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '500px', height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--color-accent-soft) 0%, transparent 70%)',
          top: '-100px', left: '50%', transform: 'translateX(-50%)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: '300px', height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--color-purple-soft) 0%, transparent 70%)',
          bottom: '-50px', right: '10%',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div
          className="rounded-2xl border border-border p-8 animate-fade-in-up bg-surface/90 backdrop-blur-xl"
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="animate-float">
              <LogoBox size={56} />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-text-primary">
                Welcome back
              </h1>
              <p className="text-text-secondary text-sm mt-1">
                Sign in to your RateKit account
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5 animate-fade-in-up opacity-0 stagger-1">
              <label htmlFor="signin-email" className="text-sm font-medium text-text-secondary">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-surface-elevated border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5 animate-fade-in-up opacity-0 stagger-2">
              <label htmlFor="signin-password" className="text-sm font-medium text-text-secondary">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-surface-elevated border border-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2 animate-fade-in-up opacity-0 stagger-3">
              <input
                id="signin-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer rounded"
              />
              <label htmlFor="signin-remember" className="text-sm text-text-muted cursor-pointer select-none">
                Remember me
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 animate-fade-in">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="signin-submit"
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gradient-to-r from-accent to-purple text-base-950 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer border-none mt-2 animate-fade-in-up opacity-0 stagger-4"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-base-950/40 border-t-base-950 rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-sm text-text-muted mt-6">
            Don't have an account?{' '}
            <Link to="/sign-up" className="text-accent hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
