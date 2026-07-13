import { createContext } from 'react';

interface AuthContextValue {
  user: {
    id: string;
    name: string | null;
    email?: string;
    image?: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    role?: string | null;
  } | null;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
  } | null;
  isLoading: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,
});

export type { AuthContextValue };
