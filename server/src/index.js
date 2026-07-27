import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import authRoutes from './features/auth/routes/auth.routes.js';
import workspaceRoutes from './features/workspaces/routes/workspace.routes.js';
import streamRoutes from './features/streams/routes/stream.routes.js';
import dashboardRoutes from './features/dashboards/routes/dashboard.routes.js';

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Rate Limiter Stub
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/streams', streamRoutes);
app.use('/api/v1/dashboards', dashboardRoutes);
app.use('/api/v1', streamRoutes);

// Health Route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const redisUrl = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379';
const pubClient = createClient({ url: redisUrl });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Socket.io Redis adapter connected');
}).catch(err => {
  console.error('Running standalone socket adapter (Redis offline):', err.message);
});

io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);

  socket.on('join-workspace', (workspaceId) => {
    socket.join(`workspace:${workspaceId}`);
  });

  socket.on('leave-workspace', (workspaceId) => {
    socket.leave(`workspace:${workspaceId}`);
  });

  socket.on('join-share', (shareToken) => {
    socket.join(`share:${shareToken}`);
    console.log(`Socket ${socket.id} joined public share room: share:${shareToken}`);
  });

  socket.on('leave-share', (shareToken) => {
    socket.leave(`share:${shareToken}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
