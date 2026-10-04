import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { ENV } from './config/env.js';
import { db } from './config/database.js';

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration - Permissive for dev to eliminate all network/origin errors
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate Limiting - Optimized for local development and real-time classroom polling
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50000, // High ceiling to prevent throttling active classroom attendance polling
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting on local dev connections
    const host = req.headers.host || '';
    return host.includes('localhost') || host.includes('127.0.0.1');
  },
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// JSON and URL-encoded parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve local static uploaded media files
const isVercelEnv = Boolean(process.env.VERCEL);
const uploadsDir = isVercelEnv
  ? '/tmp/uploads'
  : (path.resolve(process.cwd(), 'uploads'));

app.use('/uploads', express.static(uploadsDir));
if (isVercelEnv) {
  app.use('/uploads', express.static('/tmp/uploads'));
}

// Root endpoint for API and browser redirect
app.get('/', (req, res) => {
  if (req.accepts('html') && !req.xhr && !req.headers['x-requested-with']) {
    const target = process.env.FRONTEND_URL || process.env.CLIENT_URL || '';
    // Only redirect if target is a live domain, NEVER redirect to localhost
    if (
      target &&
      target.startsWith('http') &&
      !target.includes('localhost') &&
      !target.includes('127.0.0.1')
    ) {
      return res.redirect(target);
    }
  }
  res.json({
    success: true,
    service: 'SMIT Web Class API Backend',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Ensure database is freshly synced with Supabase PostgreSQL
app.use(async (req, res, next) => {
  try {
    await db.ensureSynced();
  } catch (e) {
    // Non-blocking fallback
  }
  next();
});

// Mount API Routes (Both /api and / to support all serverless reverse proxy environments)
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Catch-all 404 handler for all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
