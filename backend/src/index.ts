import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRoutes from './routes/authRoutes';
import settingsRoutes from './routes/settingsRoutes';
import trekRoutes from './routes/trekRoutes';
import bookingRoutes from './routes/bookingRoutes';
import leaderRoutes from './routes/leaderRoutes';
import blogRoutes from './routes/blogRoutes';
import galleryRoutes from './routes/galleryRoutes';
import memoryRoutes from './routes/memoryRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import policyRoutes from './routes/policyRoutes';
import notificationRoutes from './routes/notificationRoutes';
import weatherRoutes from './routes/weatherRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility Middlewares
app.use(helmet());

// Cookie parsing middleware (manual implementation to avoid dependencies)
app.use((req: Request, res: Response, next: NextFunction) => {
  const list: Record<string, string> = {};
  const rc = req.headers.cookie;

  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const name = parts.shift()?.trim();
      if (name) {
        list[name] = decodeURIComponent(parts.join('='));
      }
    });
  }

  (req as any).cookies = list;
  next();
});

const allowedOrigins = [
  'http://localhost:3000',
  'https://treckwari-frontend.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Support larger payloads for Cloudinary base64 images

// Apply rate limiting (Max 150 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Strict authentication rate limiting (Max 15 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many login or registration attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Input Sanitization Middleware (XSS Protection)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      }
    }
  }
  next();
});

// Request logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[HTTP Request] ${req.method} ${req.path} | IP: ${req.ip}`);
  next();
});

// Route registration
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/events', trekRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/leader', leaderRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/weather', weatherRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date(), service: 'TreckWari Backend' });
});

// Global error handler middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error Handler]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected server error occurred.'
  });
});

// Start the Express Server
app.listen(PORT, () => {
  console.log(`
============================================================
  TRECKWARI BACKEND RUNNING ON PORT ${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  Database: SQLite (dev.db local file)
  Local healthcheck: http://localhost:${PORT}/health
============================================================
  `);
});
