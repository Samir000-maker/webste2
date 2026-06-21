import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from '../config.js';
import { connectDB } from '../database.js';
import { initializeFirebase } from '../firebase-auth.js';
import Redis from 'ioredis';

// Redis
const pubClient = new Redis(config.REDIS_URL);
const subClient = pubClient.duplicate();

// Express
const app = express();
app.use(cors());
app.use(express.json());

// Routes
import moodRoutes from './routes/mood.js';
import chatRoutes from './routes/chat.js';
import callRoutes from './routes/call.js';
import socialClubRoutes from './routes/social-club.js';

app.use('/api/mood', moodRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/call', callRoutes);
app.use('/api/social-club', socialClubRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// HTTP server + Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

// Socket handlers
import { registerSocketHandlers } from './services/socket-handlers.js';
registerSocketHandlers(io, pubClient);

// Start
async function start() {
  await initializeFirebase();
  await connectDB();
  const PORT = config.PORT || 10000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (stateless, scale-to-zero ready)`);
  });
}

start().catch(console.error);

export { app, io, pubClient };
