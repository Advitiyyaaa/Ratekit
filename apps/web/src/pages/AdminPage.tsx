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
          className="p-2 border-2 border-border bg-surface text-text-primary hover:bg-surface-hover shadow-[2px_2px_0px_0px_var(--color-shadow)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          title="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <Crown size={24} className="text-warning" />
        <h1 className="text-3xl font-extrabold text-text-primary m-0">Admin Panel</h1>
      </div>
      <p className="text-text-secondary text-sm mb-8 ml-12 font-medium">
        Manage users and roles across RateKit.
      </p>

      {/* Users card */}
      <div className="brutal-card bg-surface border-2 border-border shadow-[4px_4px_0px_0px_var(--color-shadow)] overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-border bg-surface-hover">
          <div className="flex items-center gap-2 text-text-primary font-bold">
            <Users size={18} />
            <span className="uppercase text-sm tracking-wider">Users</span>
            {fetched && (
              <span className="text-xs text-text-primary bg-surface border-2 border-border px-2 py-0.5 font-mono font-bold shadow-[2px_2px_0px_0px_var(--color-shadow)] ml-2">
                {users.length}
              </span>
            )}
          </div>
          <button
            id="admin-load-users"
            onClick={loadUsers}
            disabled={fetching}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
            {fetched ? 'Refresh' : 'Load users'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 bg-danger/10 border-2 border-danger text-danger px-4 py-3 text-sm font-bold shadow-[2px_2px_0px_0px_var(--color-shadow)]">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!fetched && !fetching && (
          <div className="flex flex-col items-center gap-3 py-16 text-text-muted">
            <Users size={40} className="opacity-40 text-text-primary" />
            <p className="text-sm font-bold text-text-secondary">Click "Load users" to fetch the user list</p>
          </div>
        )}

        {/* Loading spinner */}
        {fetching && (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-4 border-text-primary border-t-transparent animate-spin" />
          </div>
        )}

        {/* Table */}
        {fetched && !fetching && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-text-primary bg-surface-hover border-b-2 border-border">
                  <th className="px-6 py-3 font-extrabold uppercase text-xs tracking-wider border-r-2 border-border">User</th>
                  <th className="px-6 py-3 font-extrabold uppercase text-xs tracking-wider border-r-2 border-border">Role</th>
                  <th className="px-6 py-3 font-extrabold uppercase text-xs tracking-wider border-r-2 border-border">Joined</th>
                  <th className="px-6 py-3 font-extrabold uppercase text-xs tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b-2 border-border hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-6 py-4 border-r-2 border-border">
                      <div>
                        <p className="text-text-primary font-bold m-0">{user.name ?? '—'}</p>
                        <p className="text-text-muted text-xs font-mono m-0">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r-2 border-border">
                      {user.role === 'admin' ? (
                        <span className="badge badge-warning flex items-center gap-1 w-fit">
                          <Crown size={10} /> Admin
                        </span>
                      ) : (
                        <span className="badge badge-accent">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-text-secondary font-mono text-xs border-r-2 border-border">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleRole(user.id, user.role)}
                        disabled={actionId === user.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition-all cursor-pointer border-2 border-border shadow-[2px_2px_0px_0px_var(--color-shadow)] active:translate-x-[1px] active:translate-y-[1px] ml-auto disabled:opacity-50 ${
                          user.role === 'admin'
                            ? 'bg-danger text-white hover:bg-danger/80'
                            : 'bg-success text-black hover:bg-success/80'
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
