import type { Request, Response, NextFunction } from 'express';
import { requireAuth } from './requireAuth.js';

/**
 * Express middleware that requires an authenticated session where the user
 * has role === "admin". Chains requireAuth first to avoid duplicating
 * the session-lookup logic.
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // First validate the session exists
  await requireAuth(req, res, async () => {
    const role = req.authSession?.user?.role;
    if (role !== 'admin') {
      res.status(403).json({ error: 'Forbidden — admin access required' });
      return;
    }
    next();
  });
}
