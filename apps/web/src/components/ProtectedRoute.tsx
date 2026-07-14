import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  /** If true, also require admin role (403 → redirect to home) */
  requireAdmin?: boolean;
}

/**
 * Wraps a route that requires authentication (and optionally admin role).
 * - While the session is loading: shows a centered spinner
 * - Unauthenticated: redirects to /sign-in, preserving the intended URL
 *   (including search params, so playground share links survive sign-in)
 * - Authenticated but not admin (when requireAdmin=true): redirects to /
 */
export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  if (!user) {
    // Preserve pathname + search params so the user lands back on the exact URL
    // e.g. /playground?algorithm=token-bucket&capacity=10 after sign-in
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

