import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import authRouter from './routes/auth';
import leadsRouter from './routes/leads';
import usersRouter from './routes/users';
import captureRouter from './routes/capture';

export function createApp() {
  const app = express();

  // CORS — allow frontend origin with credentials
  app.use(
    cors({
      origin: config.corsOrigin.split(',').map((o) => o.trim()),
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  // Health check
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', authRouter);
  app.use('/api/leads', leadsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/capture', captureRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

// Start server only when not in test mode
if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
  });
}
