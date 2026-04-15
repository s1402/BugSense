import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { initQdrantCollection } from './config/qdrant.js';
import { setupSocket } from './socket/bugEvents.js';
import { createApp } from './app.js';

const app = createApp();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] },
});
app.set('io', io);
setupSocket(io);

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
