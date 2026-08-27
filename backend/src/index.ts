import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import mongoose from 'mongoose';
import IORedis from 'ioredis';

import assignmentRoutes from './routes/assignments';
import examRoutes from './routes/exams';

const app = express();
const server = http.createServer(app);

// Security & Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Production logging: combined format; dev format in development
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Stricter limit for AI-triggering endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI request limit reached. Please wait before creating more.' },
});

app.use(globalLimiter);

// Socket.IO
const io = new SocketIOServer(server, {
  cors: { origin: '*', credentials: false },
  transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('subscribe:assignment', ({ assignmentId }: { assignmentId: string }) => {
    socket.join(`assignment:${assignmentId}`);
    console.log(`Socket ${socket.id} → room: assignment:${assignmentId}`);
  });

  socket.on('subscribe:exam', ({ examId }: { examId: string }) => {
    socket.join(`exam:${examId}`);
    console.log(`Socket ${socket.id} → room: exam:${examId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Redis Pub/Sub Subscriber (forwards to Socket.IO)
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isTLS = redisUrl.startsWith('rediss://');

const redisSub = new IORedis(redisUrl, {
  tls: isTLS ? {} : undefined,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => Math.min(times * 500, 2000),
} as any);

redisSub.subscribe('job:update', (err) => {
  if (err) console.error('Redis subscribe error:', err);
  else console.log('Subscribed to job:update channel');
});

redisSub.on('message', (channel, message) => {
  if (channel === 'job:update') {
    try {
      const data = JSON.parse(message);

      if (data.examId) {
        // Exam job update
        io.to(`exam:${data.examId}`).emit('job:update', data);
        io.emit('job:update', data); // broadcast fallback
      } else if (data.assignmentId) {
        // Assignment job update
        io.to(`assignment:${data.assignmentId}`).emit('job:update', data);
        io.emit('job:update', data); // broadcast fallback
      }
    } catch {}
  }
});

redisSub.on('error', (err) => console.warn('Redis sub error:', err.message));

// Routes — API v1
app.use('/api/v1/assignments', aiLimiter, assignmentRoutes);
app.use('/api/v1/exams', aiLimiter, examRoutes);

app.get('/api/v1/health', (_, res) =>
  res.json({ status: 'ok', version: 'v1', timestamp: new Date().toISOString() })
);

// Legacy redirect — /api/* → /api/v1/* (backwards compat for any old clients)
app.use('/api/assignments', (req, res) => res.redirect(308, `/api/v1/assignments${req.path}`));
app.use('/api/exams', (req, res) => res.redirect(308, `/api/v1/exams${req.path}`));
app.get('/api/health', (_, res) => res.redirect(308, '/api/v1/health'));

// Error Handlers
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message });
});

// Bootstrap
async function start() {
  const PORT = parseInt(process.env.PORT || '5000');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai');
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
  }

  server.listen(PORT, () => {
    console.log(`VedaAI backend running on http://localhost:${PORT}`);
    console.log(`WebSocket ready`);
    console.log(`API: /api/v1/assignments | /api/v1/exams`);
  });
}

start().catch(console.error);

// Start workers in same process
import('./workers/questionWorker')
  .then(() => console.log('🔧 Question worker started'))
  .catch((err) => console.error('Question worker failed:', err));

import('./workers/examWorker')
  .then(() => console.log('🔧 Exam worker started'))
  .catch((err) => console.error('Exam worker failed:', err));

export { io };