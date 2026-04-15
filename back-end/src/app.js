import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import bugRoutes from './routes/bugs.js';
import searchRoutes from './routes/search.js';

export const createApp = () => {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
  app.use(express.json());
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'BugSense API', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/bugs', bugRoutes);
  app.use('/api/search', searchRoutes);

  app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
  });

  app.use(errorHandler);

  return app;
};

export default createApp;
