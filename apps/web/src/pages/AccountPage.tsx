import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Shield, LogOut, Crown, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { authClient } from '../lib/auth-client';

export function AccountPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [localName, setLocalName] = useState('');

  async function handleSignOut() {
    await authClient.signOut();
    navigate('/');
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-text-muted">Loading account…</p>
      </div>
    );
  }

  const avatarLetter = user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?';
  const displayName = localName || user.name || user.email?.split('@')[0] || 'User';
  const userWithRole = user as typeof user & { role?: string };
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  });

  function startEdit() {
    setLocalName(displayName);
    setEditingName(true);
  }

  function cancelEdit() {
    setEditingName(false);
    setLocalName('');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-text-primary mb-8">My Account</h1>

      <div className="flex flex-col gap-5">
        {/* ── Profile card ────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border border-border p-6"
          style={{ background: 'rgba(16, 22, 40, 0.85)', backdropFilter: 'blur(20px)' }}
        >
          {/* Avatar + name */}
          <div className="flex items-center gap-4 mb-6">
            {/* Animated gradient ring on hover */}
            <div className="relative group">
              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: 'conic-gradient(var(--color-accent), var(--color-purple), var(--color-accent))',
                  padding: '2px',
                  borderRadius: '50%',
                  animation: 'gradient-shift 3s linear infinite',
                  backgroundSize: '200% 200%',
                }}
              />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-accent to-purple flex items-center justify-center text-2xl font-bold text-base-950 group-hover:ring-2 group-hover:ring-accent/60 group-hover:ring-offset-2 group-hover:ring-offset-surface transition-all">
                {avatarLetter}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {/* Inline name edit */}
              {editingName ? (
                <div className="flex items-center gap-2 mb-0.5">
                  <input
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    autoFocus
                    className="bg-surface-elevated border border-accent rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none w-40"
                  />
                  <button
                    onClick={() => setEditingName(false)}
                    className="text-success bg-transparent border-none cursor-pointer p-0.5"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-text-muted bg-transparent border-none cursor-pointer p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-lg font-semibold text-text-primary">{displayName}</p>
                  {isAdmin && (
                    <span className="flex items-center gap-1 text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      <Crown size={11} /> Admin
                    </span>
                  )}
                  <button
                    onClick={startEdit}
                    className="text-text-muted hover:text-accent transition-colors bg-transparent border-none cursor-pointer p-0.5"
                    title="Edit name (local only)"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              )}
              <p className="text-text-muted text-sm">{user.email}</p>
            </div>
          </div>

          <div className="h-px bg-border mb-5" />

          {/* Details */}
          <div className="flex flex-col gap-3">
            <Detail icon={<Mail size={15} />} label="Email" value={user.email ?? '—'} />
            <Detail
              icon={<Shield size={15} />}
              label="Role"
              value={
                <span className={`font-semibold ${isAdmin ? 'text-amber-400' : 'text-text-secondary'}`}>
                  {userWithRole.role ?? 'user'}
                </span>
              }
            />
            <Detail icon={<Crown size={15} />} label="Member since" value={memberSince} />
          </div>

          <div className="h-px bg-border mt-5 mb-5" />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {isAdmin && (
              <button
                id="account-admin-panel"
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors cursor-pointer"
              >
                <Crown size={16} /> Open Admin Panel
              </button>
            )}
            <button
              id="account-signout"
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg border border-border bg-transparent text-text-secondary text-sm font-medium hover:bg-surface-elevated hover:text-red-400 hover:border-red-500/40 transition-colors cursor-pointer"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>

        {/* ── Stats glance ─────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border border-border p-5"
          style={{ background: 'rgba(16, 22, 40, 0.6)', backdropFilter: 'blur(16px)' }}
        >
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
            Quick Stats
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <StatBox label="Account Type" value={isAdmin ? 'Admin' : 'Free'} accent={isAdmin} />
            <StatBox label="Algorithms" value="5" />
            <StatBox label="Status" value="Active" green />
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-text-muted">{icon}</span>
      <span className="text-text-muted w-24 shrink-0">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}

function StatBox({ label, value, accent = false, green = false }: { label: string; value: string; accent?: boolean; green?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-surface border border-border">
      <span className={`text-lg font-bold ${accent ? 'text-amber-400' : green ? 'text-success' : 'text-text-primary'}`}>
        {value}
      </span>
      <span className="text-[11px] text-text-muted text-center">{label}</span>
    </div>
  );
}
