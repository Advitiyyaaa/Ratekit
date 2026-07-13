import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, LogOut, Crown } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { authClient } from '../lib/auth-client';

export function AccountPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

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
  const userWithRole = user as typeof user & { role?: string };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-text-primary mb-8">My Account</h1>

      {/* Profile card */}
      <div
        className="rounded-2xl border border-border p-6 flex flex-col gap-6"
        style={{ background: 'rgba(16, 22, 40, 0.85)', backdropFilter: 'blur(20px)' }}
      >
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center text-2xl font-bold text-base-950 shrink-0">
            {avatarLetter}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-text-primary">{user.name}</p>
              {isAdmin && (
                <span className="flex items-center gap-1 text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  <Crown size={11} /> Admin
                </span>
              )}
            </div>
            <p className="text-text-muted text-sm">{user.email}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Details */}
        <div className="flex flex-col gap-3">
          <Detail icon={<User size={16} />} label="Name" value={user.name ?? '—'} />
          <Detail icon={<Mail size={16} />} label="Email" value={user.email} />
          <Detail
            icon={<Shield size={16} />}
            label="Role"
            value={
              <span
                className={`font-semibold ${isAdmin ? 'text-amber-400' : 'text-text-secondary'}`}
              >
                {userWithRole.role ?? 'user'}
              </span>
            }
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

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
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-text-muted">{icon}</span>
      <span className="text-text-muted w-12 shrink-0">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
