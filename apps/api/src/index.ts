import * as dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { connectDatabase } from './db.js';
import { seedAlgorithms } from './models/algorithm.js';
import { getAuth } from './auth.js';
import algorithmsRouter from './routes/algorithms.js';
import docsRouter from './routes/docs.js';
import playgroundRouter from './routes/playground.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = parseInt(process.env['PORT'] ?? '3001', 10);

// CORS — credentials required for BetterAuth session cookies.
// Allow both 5173 and 5174 since Vite bumps the port if 5173 is busy.
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  }),
);

// Routes
app.use('/api/algorithms', express.json(), algorithmsRouter);
app.use('/api/docs', express.json(), docsRouter);
app.use('/api/playground', express.json(), playgroundRouter);
app.use('/api/admin', express.json(), adminRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start(): Promise<void> {
  await connectDatabase();
  await seedAlgorithms();

  // Mount BetterAuth handler AFTER DB is connected (getAuth() uses mongoose client).
  // Use Express 4 wildcard syntax /* (not /{*path} which is Express 5 only).
  // Must NOT have express.json() before this — BetterAuth reads the raw body itself.
  app.all('/api/auth/*', toNodeHandler(getAuth()));

  app.listen(PORT, () => {
    console.log(`🚀 RateKit API running on http://localhost:${PORT}`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  });
}

start().catch(console.error);
