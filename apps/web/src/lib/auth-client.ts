import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

/**
 * BetterAuth client — shared singleton for the entire React app.
 * Uses no explicit baseURL so requests go through Vite's dev proxy (/api → localhost:3001).
 * The `adminClient` plugin adds authClient.admin.* methods for user management.
 */
export const authClient = createAuthClient({
  // Point directly at the API server — BetterAuth's internal fetch bypasses Vite proxy.
  // CORS is configured on the API to accept requests from localhost:5173/5174.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  plugins: [adminClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
