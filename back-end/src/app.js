import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import { initQdrantCollection } from './config/qdrant.js';
import { setupSocket } from './socket/bugEvents.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import bugRoutes from './routes/bugs.js';
import searchRoutes from './routes/search.js';

const app = express();
const httpServer = createServer(app);

// Socket.io
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] },
});
app.set('io', io); // make io accessible in routes via req.app.get('io')
setupSocket(io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'BugSense API', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth',   authRoutes);
app.use('/api/bugs',   bugRoutes);
app.use('/api/search', searchRoutes);

// 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use(errorHandler);

// Startup
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await initQdrantCollection();
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 BugSense API running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}\n`);
  });
};

start();
