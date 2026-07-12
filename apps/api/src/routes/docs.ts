import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const router = Router();

// Resolve docs directory relative to the monorepo root
const DOCS_DIR = path.resolve(import.meta.dirname, '../../../../docs');

/**
 * GET /api/docs/:slug
 * Read a markdown doc, parse frontmatter, render to HTML.
 */
router.get('/:slug', async (req, res) => {
  try {
    const slug = req.params['slug'];
    if (!slug || slug.includes('..') || slug.includes('/')) {
      res.status(400).json({ error: 'Invalid slug' });
      return;
    }

    const filePath = path.join(DOCS_DIR, `${slug}.md`);

    let content: string;
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const { data: meta, content: markdown } = matter(content);
    const html = await marked(markdown);

    res.json({ meta, html, markdown });
  } catch (error) {
    console.error('Error reading doc:', error);
    res.status(500).json({ error: 'Failed to read document' });
  }
});

/**
 * GET /api/docs
 * List all available docs with their frontmatter metadata.
 */
router.get('/', async (_req, res) => {
  try {
    const files = await fs.readdir(DOCS_DIR);
    const docs = [];

    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const content = await fs.readFile(path.join(DOCS_DIR, file), 'utf-8');
      const { data: meta } = matter(content);
      docs.push({
        slug: file.replace('.md', ''),
        ...meta,
      });
    }

    docs.sort((a, b) => ((a.order as number) ?? 99) - ((b.order as number) ?? 99));
    res.json(docs);
  } catch (error) {
    console.error('Error listing docs:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

export default router;
