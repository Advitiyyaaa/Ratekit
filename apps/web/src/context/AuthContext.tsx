import type { ReactNode } from 'react';
import { useSession } from '../lib/auth-client';
import { AuthContext } from './auth-context';

/**
 * Provides BetterAuth session state to the component tree.
 * This file exports ONLY a React component so Vite Fast Refresh works correctly.
 * The useAuth() hook lives in ./useAuth.ts (separate file, non-component exports only).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = useSession();

  const user = data?.user ?? null;
  const session = data?.session ?? null;
  const isAdmin = (user as (typeof user & { role?: string }) | null)?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, isLoading: isPending, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}
