import type { Session, User } from 'better-auth/types';

declare global {
  namespace Express {
    interface Request {
      /**
       * Populated by requireAuth middleware. Contains the active BetterAuth
       * session (user + session metadata). Undefined on unauthenticated routes.
       */
      authSession?: {
        session: Session;
        user: User & { role?: string };
      };
    }
  }
}
