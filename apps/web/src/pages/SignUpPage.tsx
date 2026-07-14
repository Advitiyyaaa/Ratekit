import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gauge, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { authClient } from '../lib/auth-client';

// ─── Password strength ───────────────────────────────────────────────────────

function getStrength(password: string): { score: number; label: string } {
  if (!password) return { score: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score] };
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { score, label } = getStrength(password);
  if (!password) return null;
  const segClass = ['', 'active-weak', 'active-fair', 'active-good', 'active-strong'][score];
  const labelColors = ['', 'text-danger', 'text-warning', 'text-[#a0e060]', 'text-success'];
  return (
    <div className="mt-1.5 flex flex-col gap-1">
      <div className="strength-bar-track">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`strength-bar-segment ${i <= score ? segClass : ''}`} />
        ))}
      </div>
      <span className={`text-xs font-medium ${labelColors[score]}`}>{label}</span>
    </div>
  );
}

// ─── SignUpPage ───────────────────────────────────────────────────────────────

export function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message ?? 'Failed to create account');
      return;
    }

    navigate('/');
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '500px', height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,92,255,0.07) 0%, transparent 70%)',
          top: '-100px', left: '50%', transform: 'translateX(-50%)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: '280px', height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
          bottom: '-40px', left: '5%',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        <div
          className="rounded-2xl border border-border p-8 animate-fade-in-up"
          style={{ background: 'rgba(16, 22, 40, 0.90)', backdropFilter: 'blur(24px)' }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple to-accent flex items-center justify-center animate-float">
              <Gauge size={24} className="text-base-950" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-text-primary">Create an account</h1>
              <p className="text-text-secondary text-sm mt-1">
                Join RateKit to access the playground
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5 animate-fade-in-up opacity-0 stagger-1">
              <label htmlFor="signup-name" className="text-sm font-medium text-text-secondary">
                Full name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  className="w-full bg-surface-elevated border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5 animate-fade-in-up opacity-0 stagger-2">
              <label htmlFor="signup-email" className="text-sm font-medium text-text-secondary">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  id="signup-email"
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
            <div className="flex flex-col gap-1.5 animate-fade-in-up opacity-0 stagger-3">
              <label htmlFor="signup-password" className="text-sm font-medium text-text-secondary">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
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
              <PasswordStrengthBar password={password} />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 animate-fade-in">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gradient-to-r from-purple to-accent text-base-950 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer border-none mt-2 animate-fade-in-up opacity-0 stagger-4"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-base-950/40 border-t-base-950 rounded-full animate-spin" />
              ) : (
                <>Create account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-sm text-text-muted mt-6">
            Already have an account?{' '}
            <Link to="/sign-in" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
