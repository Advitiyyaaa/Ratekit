import { Router } from 'express';
import { Algorithm } from '../models/algorithm.js';

const router = Router();

/**
 * GET /api/algorithms
 * List all algorithms with their metadata.
 */
router.get('/', async (_req, res) => {
  try {
    const algorithms = await Algorithm.find().sort({ slug: 1 }).lean();
    res.json(algorithms);
  } catch (error) {
    console.error('Error fetching algorithms:', error);
    res.status(500).json({ error: 'Failed to fetch algorithms' });
  }
});

/**
 * GET /api/algorithms/:slug
 * Get a single algorithm by slug.
 */
router.get('/:slug', async (req, res) => {
  try {
    const algorithm = await Algorithm.findOne({ slug: req.params['slug'] }).lean();
    if (!algorithm) {
      res.status(404).json({ error: 'Algorithm not found' });
      return;
    }
    res.json(algorithm);
  } catch (error) {
    console.error('Error fetching algorithm:', error);
    res.status(500).json({ error: 'Failed to fetch algorithm' });
  }
});

export default router;
