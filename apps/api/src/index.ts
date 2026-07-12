import * as dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { connectDatabase } from './db.js';
import { seedAlgorithms } from './models/algorithm.js';
import algorithmsRouter from './routes/algorithms.js';
import docsRouter from './routes/docs.js';
import playgroundRouter from './routes/playground.js';

const app = express();
const PORT = parseInt(process.env['PORT'] ?? '3001', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/algorithms', algorithmsRouter);
app.use('/api/docs', docsRouter);
app.use('/api/playground', playgroundRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start(): Promise<void> {
  await connectDatabase();
  await seedAlgorithms();

  app.listen(PORT, () => {
    console.log(`🚀 RateKit API running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
