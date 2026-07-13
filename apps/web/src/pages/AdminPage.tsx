import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Users, Shield, ShieldOff, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { authClient } from '../lib/auth-client';

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  banned: boolean;
}

export function AdminPage() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Redirect non-admins immediately
  if (!isLoading && !isAdmin) {
    navigate('/', { replace: true });
    return null;
  }

  async function loadUsers() {
    setFetching(true);
    setError('');
    try {
      const result = await authClient.admin.listUsers({ query: { limit: 100 } });
      setUsers((result.data?.users ?? []) as unknown as UserRow[]);
      setFetched(true);
    } catch {
      setError('Failed to load users');
    } finally {
      setFetching(false);
    }
  }

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setActionId(userId);
    try {
      await authClient.admin.setRole({ userId, role: newRole as 'admin' | 'user' });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
    } catch {
      setError('Failed to update role');
    } finally {
      setActionId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <span className="w-8 h-8 border-2 border-accent/40 border-t-accent rounded-full animate-spin inline-block" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <Crown size={22} className="text-amber-400" />
        <h1 className="text-2xl font-bold text-text-primary">Admin Panel</h1>
      </div>
      <p className="text-text-muted text-sm mb-8 ml-12">
        Manage users and roles across RateKit.
      </p>

      {/* Users card */}
      <div
        className="rounded-2xl border border-border overflow-hidden"
        style={{ background: 'rgba(16, 22, 40, 0.85)', backdropFilter: 'blur(20px)' }}
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2 text-text-primary font-semibold">
            <Users size={18} />
            <span>Users</span>
            {fetched && (
              <span className="text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded-full ml-1">
                {users.length}
              </span>
            )}
          </div>
          <button
            id="admin-load-users"
            onClick={loadUsers}
            disabled={fetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
            {fetched ? 'Refresh' : 'Load users'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!fetched && !fetching && (
          <div className="flex flex-col items-center gap-2 py-16 text-text-muted">
            <Users size={32} className="opacity-30" />
            <p className="text-sm">Click "Load users" to fetch the user list</p>
          </div>
        )}

        {/* Loading spinner */}
        {fetching && (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {/* Table */}
        {fetched && !fetching && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-border">
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border/50 hover:bg-surface-elevated/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-text-primary font-medium">{user.name ?? '—'}</p>
                        <p className="text-text-muted text-xs">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full w-fit">
                          <Crown size={10} /> Admin
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-text-secondary bg-surface-elevated border border-border px-2 py-0.5 rounded-full">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleRole(user.id, user.role)}
                        disabled={actionId === user.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ml-auto disabled:opacity-50 ${
                          user.role === 'admin'
                            ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                            : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                        }`}
                      >
                        {user.role === 'admin' ? (
                          <><ShieldOff size={12} /> Demote</>
                        ) : (
                          <><Shield size={12} /> Promote</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
