import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  /** If true, also require admin role (403 → redirect to home) */
  requireAdmin?: boolean;
}

/**
 * Wraps a route that requires authentication (and optionally admin role).
 * - While the session is loading: shows a centered spinner
 * - Unauthenticated: redirects to /sign-in, preserving the intended URL
 * - Authenticated but not admin (when requireAdmin=true): redirects to /
 */
export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Preserve the URL so we can redirect back after sign-in
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
