import type { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { getAuth } from '../auth.js';

/**
 * Express middleware that validates the BetterAuth session cookie/header.
 * Attaches the session to req.authSession and calls next() if valid.
 * Returns 401 if no valid session is found.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({ error: 'Unauthorized — please sign in' });
      return;
    }

    req.authSession = session as typeof req.authSession;
    next();
  } catch (error) {
    console.error('requireAuth error:', error);
    res.status(500).json({ error: 'Authentication check failed' });
  }
}
