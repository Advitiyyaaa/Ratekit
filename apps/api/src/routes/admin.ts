import { Router } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { getAuth } from '../auth.js';

const router = Router();

/**
 * GET /api/admin/users
 * List all registered users. Admin only.
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const auth = getAuth();
    const result = await auth.api.listUsers({
      headers: fromNodeHeaders(req.headers),
      query: {
        limit: 100,
      },
    });
    res.json(result);
  } catch (error) {
    console.error('Admin listUsers error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * Promote or demote a user's role. Admin only.
 * Body: { role: "admin" | "user" }
 */
router.patch('/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body as { role: string };

    if (!id || !role || !['admin', 'user'].includes(role)) {
      res.status(400).json({ error: 'userId and role ("admin" | "user") required' });
      return;
    }

    const auth = getAuth();
    const updated = await auth.api.setRole({
      headers: fromNodeHeaders(req.headers),
      body: { userId: id, role: role as 'admin' | 'user' },
    });

    res.json(updated);
  } catch (error) {
    console.error('Admin setRole error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

export default router;
