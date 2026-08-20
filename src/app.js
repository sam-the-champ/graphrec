import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { verifyConnectivity } from './database/driver.js';
import { env } from './config/env.js';
import { ok } from './utils/response.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import tutorialRoutes from './routes/tutorial.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';

import { notFoundMiddleware } from './middleware/not-found.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.cors.origin === '*' ? '*' : env.cors.origin.split(',').map((s) => s.trim()),
    })
  );
  app.use(express.json({ limit: '1mb' }));

  // ── Health checks ─────────────────────────────────────────
  app.get('/health', (req, res) => {
    return ok(res, { status: 'ok', uptimeSeconds: process.uptime() });
  });

  app.get('/health/db', async (req, res) => {
    try {
      const info = await verifyConnectivity();
      return ok(res, {
        status: 'ok',
        address: info.address,
        agent: info.agent,
      });
    } catch (err) {
      return res.status(503).json({
        success: false,
        error: { message: 'Database is unreachable', detail: err.message },
      });
    }
  });

  // API routes 
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tutorials', tutorialRoutes);
  app.use('/api/recommendations', recommendationRoutes);

  // 404 + centralized error handling 
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
