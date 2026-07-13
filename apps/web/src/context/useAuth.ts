import { useContext } from 'react';
import { AuthContext } from './auth-context';

/**
 * Hook to read auth state anywhere in the app.
 * Separated into its own file so AuthProvider.tsx can export only a React
 * component — required for Vite Fast Refresh compatibility.
 */
export function useAuth() {
  return useContext(AuthContext);
}
