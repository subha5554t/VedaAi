import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import mongoose from 'mongoose';

import assignmentRoutes from './routes/assignments';

const app = express();
const server = http.createServer(app);

// Internal notify endpoint for worker
app.post('/api/internal/notify', (req, res) => {
  const { assignmentId, status, progress } = req.body;
  io.to(`assignment:${assignmentId}`).emit('job:update', { assignmentId, status, progress });
  io.emit('job:update', { assignmentId, status, progress });
  res.json({ ok: true });
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('subscribe:assignment', ({ assignmentId }: { assignmentId: string }) => {
    socket.join(`assignment:${assignmentId}`);
  });
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Redis pub/sub for job updates from worker
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isTLS = redisUrl.startsWith('rediss://');

import IORedis from 'ioredis';
const redisSub = new IORedis({
  host: 'unique-ibex-78493.upstash.io',
  port: 6379,
  password: 'gQAAAAAAATKdAAIncDFlZTEzMTBhZDNlZTY0OTA0ODBhYmZhNzhjODY4MTMzZXAxNzg0OTM',
  tls: {},
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => Math.min(times * 500, 2000),
});

redisSub.subscribe('job:update', (err) => {
  if (err) console.error('Redis subscribe error:', err);
  else console.log('✅ Subscribed to job:update channel');
});

redisSub.on('message', (channel, message) => {
  if (channel === 'job:update') {
    try {
      const data = JSON.parse(message);
      io.to(`assignment:${data.assignmentId}`).emit('job:update', data);
      io.emit('job:update', data);
    } catch {}
  }
});

redisSub.on('error', (err) => console.warn('Redis error:', err.message));

app.use('/api/assignments', assignmentRoutes);
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(err.status || 500).json({ success: false, message: err.message });
});

async function start() {
  const PORT = parseInt(process.env.PORT || '5000');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai');
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
  }
  server.listen(PORT, () => {
    console.log(`🚀 VedaAI backend running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket ready`);
  });
}

start().catch(console.error);

// Auto-start worker in same process for single-server deployment
import('./workers/questionWorker').then(() => {
  console.log('🔧 Worker started in same process');
}).catch((err) => {
  console.error('Worker failed to start:', err);
});

export { io };